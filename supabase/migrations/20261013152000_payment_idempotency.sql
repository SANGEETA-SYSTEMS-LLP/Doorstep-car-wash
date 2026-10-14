-- Existing duplicate payment/earning records must be reconciled before these indexes can be created.
create unique index if not exists payments_one_active_order_per_booking on public.payments(booking_id) where status in ('created','paid');
create unique index if not exists washer_earnings_one_per_booking on public.washer_earnings(booking_id);
create or replace function public.record_cod_payment_once(p_booking_id uuid,p_washer_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare b public.bookings%rowtype; p public.payments%rowtype;
begin
 select * into b from bookings where id=p_booking_id for update;
 if not found or b.assigned_washer_id is distinct from p_washer_id or b.payment_method<>'cod' or b.status<>'completed' then raise exception 'A completed cash booking assigned to this washer is required.'; end if;
 select * into p from payments where booking_id=b.id and status='paid';
 if found then return to_jsonb(p); end if;
 if b.total_amount is null or b.total_amount<=0 then raise exception 'Invalid booking amount.'; end if;
 insert into payments(booking_id,customer_id,amount,payment_method,status,provider,paid_at) values(b.id,b.customer_id,b.total_amount,'cod','paid','cash',now()) returning * into p;
 return to_jsonb(p);
end $$;
revoke all on function public.record_cod_payment_once(uuid,uuid) from public,anon,authenticated;
grant execute on function public.record_cod_payment_once(uuid,uuid) to service_role;
