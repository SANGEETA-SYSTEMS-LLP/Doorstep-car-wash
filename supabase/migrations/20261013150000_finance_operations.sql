-- New migration: apply after the previously supplied migrations.
create table if not exists public.finance_operations (
 id uuid primary key, kind text not null check(kind in ('refund','payout')),
 payment_id uuid references public.payments(id), washer_id uuid references public.washers(id),
 amount_paise bigint not null check(amount_paise > 0), currency text not null default 'INR',
 reason text not null, status text not null default 'reserved', provider_id text unique,
 provider_request jsonb not null, provider_status text, processed_at timestamptz, created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.finance_payout_items (
 operation_id uuid not null references public.finance_operations(id),
 earning_id uuid primary key references public.washer_earnings(id)
);
create table if not exists public.washer_payout_accounts (
 washer_id uuid primary key references public.washers(id), fund_account_id text not null,
 account_label text not null, updated_by uuid not null references auth.users(id), updated_at timestamptz not null default now()
);
create table if not exists public.booking_invoices (
 id uuid primary key default gen_random_uuid(), booking_id uuid not null unique references public.bookings(id),
 invoice_number bigint generated always as identity unique, snapshot jsonb not null,
 created_at timestamptz not null default now()
);
alter table public.finance_operations enable row level security;
alter table public.finance_payout_items enable row level security;
alter table public.washer_payout_accounts enable row level security;
alter table public.booking_invoices enable row level security;
revoke all on public.finance_operations, public.finance_payout_items, public.washer_payout_accounts, public.booking_invoices from anon, authenticated;
grant all on public.finance_operations, public.finance_payout_items, public.washer_payout_accounts, public.booking_invoices to service_role;
grant usage, select on sequence public.booking_invoices_invoice_number_seq to service_role;

create or replace function public.reserve_finance_operation(p_id uuid, p_kind text, p_target uuid, p_amount bigint, p_reason text, p_actor uuid, p_account_number text default null)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare op public.finance_operations%rowtype; pay public.payments%rowtype; total bigint; fund text; ids uuid[];
begin
 -- Serialize reservations and reconciliation across processes, not just one Express instance.
 perform pg_advisory_xact_lock(73619842);
 if not exists(select 1 from profiles where id=p_actor and role in ('accountant','sub_admin','super_admin') and is_active) then raise exception 'Finance role required.'; end if;
 if p_reason is null or length(trim(p_reason)) < 3 or length(p_reason)>500 then raise exception 'A reason is required.'; end if;
 select * into op from finance_operations where id=p_id;
 if found then
   if op.kind<>p_kind or op.reason<>p_reason or (p_kind='refund' and (op.payment_id<>p_target or op.amount_paise<>p_amount)) or (p_kind='payout' and op.washer_id<>p_target) then raise exception 'Idempotency key already used for another request.'; end if;
   return to_jsonb(op);
 end if;
 if p_kind='refund' then
   select * into pay from payments where id=p_target for update;
   if not found or pay.status<>'paid' or pay.provider<>'razorpay' or pay.provider_payment_id is null then raise exception 'A captured Razorpay payment is required.'; end if;
   if not exists(select 1 from bookings where id=pay.booking_id and status in ('completed','closed','payment_completed','customer_confirmed','cancelled')) then raise exception 'Cancel or complete the booking before refunding.'; end if;
   if exists(select 1 from finance_payout_items i join washer_earnings e on e.id=i.earning_id join finance_operations o on o.id=i.operation_id where e.booking_id=pay.booking_id and o.status<>'processed') then raise exception 'This booking has a payout reservation. Reconcile that payout before refunding.'; end if;
   select coalesce(sum(amount_paise),0) into total from finance_operations where payment_id=p_target and kind='refund' and status not in ('failed');
   if p_amount is null or p_amount<100 or p_amount+total>round(pay.amount*100) then raise exception 'Refund exceeds the remaining paid amount or is less than INR 1.'; end if;
   insert into finance_operations(id,kind,payment_id,amount_paise,reason,created_by,provider_request)
   values(p_id,p_kind,p_target,p_amount,p_reason,p_actor,jsonb_build_object('payment_id',pay.provider_payment_id,'amount',p_amount,'speed','normal','receipt',p_id::text)) returning * into op;
 elsif p_kind='payout' then
   select fund_account_id into fund from washer_payout_accounts where washer_id=p_target;
   if fund is null or p_account_number is null or length(p_account_number)<3 then raise exception 'Configure a verified fund account and RazorpayX account first.'; end if;
   if not exists(select 1 from washers where id=p_target and is_active and is_verified) then raise exception 'An active verified washer is required.'; end if;
   select array_agg(e.id),sum(round(e.washer_amount*100)) into ids,total
   from washer_earnings e join bookings b on b.id=e.booking_id
   where e.washer_id=p_target and e.status='pending' and e.washer_amount>0
   and b.status in ('completed','closed','payment_completed','customer_confirmed')
   and not exists(select 1 from finance_payout_items i where i.earning_id=e.id)
   and exists(select 1 from payments p where p.booking_id=b.id and p.status='paid' and p.provider='razorpay' and p.amount>=b.total_amount)
   and not exists(select 1 from finance_operations r join payments p on p.id=r.payment_id where p.booking_id=b.id and r.kind='refund' and r.status<>'failed');
   if total is null or total<100 then raise exception 'No eligible online-paid earnings (minimum INR 1). Cash collections are reconciled separately.'; end if;
   insert into finance_operations(id,kind,washer_id,amount_paise,reason,created_by,provider_request)
   values(p_id,p_kind,p_target,total,p_reason,p_actor,jsonb_build_object('account_number',p_account_number,'fund_account_id',fund,'amount',total,'currency','INR','mode','IMPS','purpose','payout','queue_if_low_balance',true,'reference_id',p_id::text)) returning * into op;
   insert into finance_payout_items(operation_id,earning_id) select p_id,unnest(ids);
 else raise exception 'Invalid operation.';
 end if;
 return to_jsonb(op);
end $$;

create or replace function public.reconcile_finance_operation(p_id uuid, p_provider_id text, p_status text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare op public.finance_operations%rowtype;
begin
 perform pg_advisory_xact_lock(73619842);
 select * into op from finance_operations where id=p_id for update;
 if not found then raise exception 'Operation not found.'; end if;
 if op.provider_id is not null and op.provider_id<>p_provider_id then raise exception 'Provider reference mismatch.'; end if;
 if op.status='failed' then return to_jsonb(op); end if;
 if op.status='processed' and not (op.kind='payout' and p_status='reversed') then return to_jsonb(op); end if;
 if p_status not in ('created','pending','queued','processing','processed','failed','rejected','cancelled','reversed') then raise exception 'Unknown provider status.'; end if;
 update finance_operations set provider_id=p_provider_id,provider_status=p_status,
 processed_at=case when p_status='processed' then coalesce(processed_at,now()) else processed_at end,
 status=case when p_status='processed' then 'processed' when p_status in ('failed','rejected','cancelled','reversed') then 'failed' else 'pending' end,updated_at=now() where id=p_id returning * into op;
 if op.kind='payout' then
   if p_status='processed' then
     update washer_earnings set status='settled',settled_at=now() where id in(select earning_id from finance_payout_items where operation_id=p_id);
   elsif p_status in ('failed','rejected','cancelled','reversed') then
     update washer_earnings set status='pending',settled_at=null where id in(select earning_id from finance_payout_items where operation_id=p_id);
     delete from finance_payout_items where operation_id=p_id;
   end if;
 end if;
 return to_jsonb(op);
end $$;
revoke all on function public.reserve_finance_operation(uuid,text,uuid,bigint,text,uuid,text) from public,anon,authenticated;
revoke all on function public.reconcile_finance_operation(uuid,text,text) from public,anon,authenticated;
grant execute on function public.reserve_finance_operation(uuid,text,uuid,bigint,text,uuid,text) to service_role;
grant execute on function public.reconcile_finance_operation(uuid,text,text) to service_role;

create or replace function public.begin_finance_operation(p_id uuid, p_cancel boolean default false)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare op public.finance_operations%rowtype;
begin
 perform pg_advisory_xact_lock(73619842);
 select * into op from finance_operations where id=p_id for update;
 if not found then raise exception 'Operation not found.'; end if;
 if p_cancel then
  if op.status<>'reserved' or op.provider_id is not null then raise exception 'Already submitted. Reconcile this request instead.'; end if;
  update finance_operations set status='failed',provider_status='cancelled',updated_at=now() where id=p_id returning * into op;
  delete from finance_payout_items where operation_id=p_id;
 else
  if op.status='failed' and op.provider_id is null then raise exception 'This draft was cancelled. Create a new request.'; end if;
  if op.status='reserved' then update finance_operations set status='submitting',updated_at=now() where id=p_id returning * into op; end if;
 end if;
 return to_jsonb(op);
end $$;
revoke all on function public.begin_finance_operation(uuid,boolean) from public,anon,authenticated;
grant execute on function public.begin_finance_operation(uuid,boolean) to service_role;
