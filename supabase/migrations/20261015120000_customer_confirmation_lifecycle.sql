-- Requires lifecycle fields and payment-idempotency migrations first.
BEGIN;
CREATE OR REPLACE FUNCTION public.confirm_customer_service(p_booking_id uuid, p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE b public.bookings%rowtype;
BEGIN
 SELECT b0.* INTO b FROM public.bookings b0 JOIN public.customers c ON c.id=b0.customer_id
 WHERE b0.id=p_booking_id AND c.user_id=p_user_id FOR UPDATE OF b0;
 IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found.'; END IF;
 IF b.status::text IN ('customer_confirmed','payment_completed','closed') THEN RETURN to_jsonb(b); END IF;
 IF b.status::text <> 'service_completed' OR b.service_validated_at IS NULL THEN
 RAISE EXCEPTION 'Service photos must be validated before customer confirmation.'; END IF;
 UPDATE public.bookings SET status='customer_confirmed', customer_confirmed_at=now() WHERE id=b.id RETURNING * INTO b;
 IF EXISTS(SELECT 1 FROM public.payments WHERE booking_id=b.id AND status='paid' AND amount>=b.total_amount) THEN
 UPDATE public.bookings SET status='payment_completed' WHERE id=b.id RETURNING * INTO b;
 END IF;
 RETURN to_jsonb(b);
END $$;
REVOKE ALL ON FUNCTION public.confirm_customer_service(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_customer_service(uuid,uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.complete_confirmed_paid_booking() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.status::text='paid' THEN
 UPDATE public.bookings SET status='payment_completed'
 WHERE id=NEW.booking_id AND status='customer_confirmed' AND total_amount<=NEW.amount;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS complete_confirmed_paid_booking ON public.payments;
CREATE TRIGGER complete_confirmed_paid_booking AFTER INSERT OR UPDATE OF status ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.complete_confirmed_paid_booking();
COMMIT;

create or replace function public.record_cod_payment_once(p_booking_id uuid,p_washer_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare b public.bookings%rowtype; p public.payments%rowtype;
begin
 select * into b from bookings where id=p_booking_id for update;
 if not found or b.assigned_washer_id is distinct from p_washer_id or b.payment_method<>'cod' or b.status::text not in ('customer_confirmed','payment_completed') then raise exception 'A customer-confirmed cash booking assigned to this washer is required.'; end if;
 select * into p from payments where booking_id=b.id and status='paid';
 if found then return to_jsonb(p); end if;
 if b.total_amount is null or b.total_amount<=0 then raise exception 'Invalid booking amount.'; end if;
 insert into payments(booking_id,customer_id,amount,payment_method,status,provider,paid_at) values(b.id,b.customer_id,b.total_amount,'cod','paid','cash',now()) returning * into p;
 return to_jsonb(p);
end $$;
revoke all on function public.record_cod_payment_once(uuid,uuid) from public,anon,authenticated;
grant execute on function public.record_cod_payment_once(uuid,uuid) to service_role;


