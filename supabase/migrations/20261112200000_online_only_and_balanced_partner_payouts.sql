BEGIN;

-- COD is no longer part of the booking flow. Keep the enum value for old
-- records, but reject it for new booking writes and remove the cash RPC.
CREATE OR REPLACE FUNCTION public.require_online_booking_payment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF lower(coalesce(NEW.payment_method::text, '')) IN ('cod', 'cash') THEN
    RAISE EXCEPTION 'Cash on delivery is unavailable. Complete online payment to confirm this booking.'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS bookings_require_online_payment ON public.bookings;
CREATE TRIGGER bookings_require_online_payment
BEFORE INSERT OR UPDATE OF payment_method ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.require_online_booking_payment();

DROP FUNCTION IF EXISTS public.record_cod_payment_once(uuid, uuid);

-- Checkout reservations are online only. The booking row is locked before the
-- payment row so reservation remains serialized with cancellation.
CREATE OR REPLACE FUNCTION public.reserve_razorpay_payment_order(
  p_booking_id uuid,
  p_customer_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  b public.bookings%rowtype;
  p public.payments%rowtype;
  made boolean := false;
BEGIN
  SELECT * INTO b FROM public.bookings
   WHERE id = p_booking_id AND customer_id = p_customer_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found.' USING errcode = 'P0002'; END IF;
  IF lower(coalesce(b.payment_method::text, '')) IN ('cod', 'cash') THEN
    RAISE EXCEPTION 'Cash on delivery is unavailable. Create a booking and complete online payment.' USING errcode = '55000';
  END IF;
  IF b.status::text IN ('cancelled', 'expired') THEN
    RAISE EXCEPTION 'This booking is not available for checkout.' USING errcode = '55000';
  END IF;
  IF b.status::text = 'pending' AND b.created_at <= now() - interval '30 minutes' THEN
    RAISE EXCEPTION 'The booking payment window has expired.' USING errcode = '55000';
  END IF;
  IF b.status::text NOT IN (
    'pending', 'confirmed', 'finding_washer', 'support_escalated',
    'washer_assigned', 'washer_on_the_way', 'washer_arrived', 'otp_verified',
    'service_started', 'service_completed', 'customer_confirmed',
    'payment_completed', 'closed'
  ) THEN
    RAISE EXCEPTION 'This booking is not eligible for online payment.' USING errcode = '55000';
  END IF;
  IF b.total_amount IS NULL OR b.total_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid booking amount.' USING errcode = '22023';
  END IF;

  UPDATE public.payments SET status = 'failed', updated_at = now()
   WHERE booking_id = p_booking_id AND status = 'created'
     AND provider_order_id IS NULL AND created_at <= now() - interval '2 minutes';
  SELECT * INTO p FROM public.payments
   WHERE booking_id = p_booking_id AND status IN ('created', 'paid')
   ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.payments(booking_id, customer_id, amount, payment_method, status, provider)
    VALUES (p_booking_id, p_customer_id, b.total_amount, 'online', 'created', 'razorpay')
    RETURNING * INTO p;
    made := true;
  END IF;
  RETURN jsonb_build_object('booking', to_jsonb(b), 'payment', to_jsonb(p), 'created', made);
END;
$function$;
REVOKE ALL ON FUNCTION public.reserve_razorpay_payment_order(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_razorpay_payment_order(uuid, uuid) TO service_role;

-- Fund the supervisor from the platform commission remaining after the
-- washer share. This keeps washer + supervisor + platform shares within the
-- captured service amount, with GST and platform fee accounted separately.
UPDATE public.supervisor_earnings supervisor
   SET commission_base_amount = greatest(coalesce(washer.platform_commission, 0), 0),
       supervisor_amount = round(greatest(coalesce(washer.platform_commission, 0), 0)
         * supervisor.commission_percent / 100, 2)
  FROM public.washer_earnings washer
 WHERE washer.booking_id = supervisor.booking_id
   AND supervisor.status = 'pending'
   AND supervisor.payout_operation_id IS NULL;

-- Quarantine legacy earnings that were recorded before service validation.
-- They stay in the ledger and are released by createWasherEarning after the
-- validated service is customer-confirmed.
ALTER TABLE public.supervisor_earnings
  DROP CONSTRAINT IF EXISTS supervisor_earnings_status_check;
ALTER TABLE public.supervisor_earnings
  ADD CONSTRAINT supervisor_earnings_status_check
  CHECK (status IN ('pending', 'settled', 'held'));

UPDATE public.washer_earnings earning
   SET status = 'held'
 WHERE earning.status = 'pending'
   AND NOT EXISTS (
     SELECT 1 FROM public.finance_payout_items item
      WHERE item.earning_id = earning.id
   )
   AND NOT EXISTS (
     SELECT 1 FROM public.bookings booking
      WHERE booking.id = earning.booking_id
        AND booking.service_validated_at IS NOT NULL
        AND booking.status::text IN ('service_completed', 'customer_confirmed', 'payment_completed', 'closed', 'completed')
   );

UPDATE public.supervisor_earnings earning
   SET status = 'held'
 WHERE earning.status = 'pending'
   AND earning.payout_operation_id IS NULL
   AND NOT EXISTS (
     SELECT 1 FROM public.bookings booking
      WHERE booking.id = earning.booking_id
        AND booking.service_validated_at IS NOT NULL
        AND booking.status::text IN ('service_completed', 'customer_confirmed', 'payment_completed', 'closed', 'completed')
   );

COMMIT;
NOTIFY pgrst, 'reload schema';
