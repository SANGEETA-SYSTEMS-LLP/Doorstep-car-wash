-- Track paid bookings whose washer could not complete the service so finance
-- can review the reason and issue the customer refund through finance operations.
create table if not exists public.service_failure_reports (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id),
  payment_id uuid not null references public.payments(id),
  washer_id uuid not null references public.washers(id),
  reason text not null check (length(trim(reason)) between 5 and 1000),
  status text not null default 'pending_review'
    check (status in ('pending_review','refund_pending','refund_processed','refund_failed')),
  reported_by uuid not null references auth.users(id),
  reviewed_by uuid references auth.users(id),
  finance_operation_id uuid references public.finance_operations(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.service_failure_reports enable row level security;
revoke all on public.service_failure_reports from anon, authenticated;
grant all on public.service_failure_reports to service_role;
create index if not exists service_failure_reports_status_created_idx
  on public.service_failure_reports(status, created_at desc);

-- Failed-service refunds may be issued while the booking is still in its
-- operational status. A failure report is required for these additional states.
create or replace function public.reserve_finance_operation(p_id uuid, p_kind text, p_target uuid, p_amount bigint, p_reason text, p_actor uuid, p_account_number text default null)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare op public.finance_operations%rowtype; pay public.payments%rowtype; total bigint; fund text; ids uuid[];
begin
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
  if exists(select 1 from service_failure_reports s where s.payment_id=pay.id and s.status='refund_processed') then raise exception 'This payment has already been refunded for incomplete service.'; end if;
   if not exists(select 1 from bookings b where b.id=pay.booking_id and (
     b.status in ('completed','closed','payment_completed','customer_confirmed','cancelled')
     or exists(select 1 from service_failure_reports s where s.booking_id=b.id and s.payment_id=pay.id and s.status in ('pending_review','refund_pending','refund_failed'))
   )) then raise exception 'Cancel or complete the booking, or submit a service failure report, before refunding.'; end if;
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

revoke all on function public.reserve_finance_operation(uuid,text,uuid,bigint,text,uuid,text) from public,anon,authenticated;
grant execute on function public.reserve_finance_operation(uuid,text,uuid,bigint,text,uuid,text) to service_role;

create or replace function public.link_service_failure_refund(p_report uuid, p_operation uuid, p_actor uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare report public.service_failure_reports%rowtype; op public.finance_operations%rowtype;
begin
 if not exists(select 1 from profiles where id=p_actor and role in ('accountant','sub_admin','super_admin') and is_active) then raise exception 'Finance role required.'; end if;
 select * into report from service_failure_reports where id=p_report for update;
 if not found then raise exception 'Service failure report not found.'; end if;
 if report.status = 'refund_processed' then raise exception 'This service failure refund is already processed.'; end if;
 select * into op from finance_operations where id=p_operation and kind='refund' and payment_id=report.payment_id;
 if not found then raise exception 'Refund operation does not match this report payment.'; end if;
 if op.amount_paise <> (select round(amount*100) from payments where id=report.payment_id) then raise exception 'The incomplete-service report requires a full refund of the captured payment.'; end if;
 if report.finance_operation_id is not null and report.finance_operation_id<>p_operation then raise exception 'A refund operation is already linked to this case.'; end if;
 if op.status='failed' and op.provider_id is null then raise exception 'This refund draft was cancelled before submission.'; end if;
 update service_failure_reports set finance_operation_id=p_operation, reviewed_by=p_actor,
   status=case when op.status='processed' then 'refund_processed' when op.status='failed' then 'refund_failed' else 'refund_pending' end,
   updated_at=now() where id=p_report returning * into report;
 return to_jsonb(report);
end $$;
revoke all on function public.link_service_failure_refund(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.link_service_failure_refund(uuid,uuid,uuid) to service_role;

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
 else
   update service_failure_reports set status=case when op.status='processed' then 'refund_processed' when op.status='failed' then 'refund_failed' else 'refund_pending' end, updated_at=now()
   where finance_operation_id=p_id;
 end if;
 return to_jsonb(op);
end $$;
revoke all on function public.reconcile_finance_operation(uuid,text,text) from public,anon,authenticated;
grant execute on function public.reconcile_finance_operation(uuid,text,text) to service_role;
