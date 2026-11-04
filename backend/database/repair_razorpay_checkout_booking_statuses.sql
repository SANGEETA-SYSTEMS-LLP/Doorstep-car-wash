-- Allow customers to retry online checkout after their unpaid booking advances
-- from pending into assignment or service states. Cancelled and expired
-- bookings remain ineligible, and COD bookings retain their separate rules.
BEGIN;

CREATE OR REPLACE FUNCTION public.reserve_razorpay_payment_order(
  p_booking_id uuid,
  p_customer_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_booking public.bookings%rowtype;
  v_payment public.payments%rowtype;
  v_created boolean := false;
  v_online boolean;
BEGIN
  SELECT * INTO v_booking
    FROM public.bookings
   WHERE id = p_booking_id AND customer_id = p_customer_id
   FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found.' USING errcode = 'P0002'; END IF;

  v_online := lower(coalesce(v_booking.payment_method::text, '')) NOT IN ('cod', 'cash');
  IF v_booking.status::text = 'cancelled' THEN
    RAISE EXCEPTION 'This booking was cancelled before checkout.' USING errcode = '55000';
  END IF;
  IF v_online AND v_booking.status::text = 'pending'
     AND v_booking.created_at <= now() - interval '30 minutes' THEN
    RAISE EXCEPTION 'The booking payment window has expired.' USING errcode = '55000';
  END IF;
  IF (NOT v_online AND v_booking.status::text NOT IN ('customer_confirmed', 'closed'))
     OR (v_online AND v_booking.status::text NOT IN (
       'pending', 'confirmed', 'finding_washer', 'support_escalated',
       'washer_assigned', 'washer_on_the_way', 'washer_arrived', 'otp_verified',
       'service_started', 'service_completed', 'customer_confirmed', 'payment_completed', 'closed'
     )) THEN
    RAISE EXCEPTION 'This booking is not eligible for online payment.' USING errcode = '55000';
  END IF;
  IF v_booking.total_amount IS NULL OR v_booking.total_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid booking amount.' USING errcode = '22023';
  END IF;

  UPDATE public.payments
     SET status = 'failed', updated_at = now()
   WHERE booking_id = p_booking_id AND status = 'created'
     AND provider_order_id IS NULL
     AND created_at <= now() - interval '2 minutes';

  SELECT * INTO v_payment
    FROM public.payments
   WHERE booking_id = p_booking_id AND status IN ('created', 'paid')
   ORDER BY created_at DESC
   LIMIT 1
   FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.payments (
      booking_id, customer_id, amount, payment_method, status, provider
    ) VALUES (
      p_booking_id, p_customer_id, v_booking.total_amount, 'online', 'created', 'razorpay'
    ) RETURNING * INTO v_payment;
    v_created := true;
  END IF;

  RETURN jsonb_build_object(
    'booking', to_jsonb(v_booking),
    'payment', to_jsonb(v_payment),
    'created', v_created
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.reserve_razorpay_payment_order(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_razorpay_payment_order(uuid, uuid) TO service_role;

COMMIT;
NOTIFY pgrst, 'reload schema';
