-- Customer cancellation with a retained audit row and refund amount excluding
-- the platform fee. Run once in Supabase SQL Editor as database owner.
BEGIN;

CREATE TABLE IF NOT EXISTS public.booking_cancellations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings(id),
  customer_id uuid NOT NULL REFERENCES public.customers(id),
  payment_id uuid REFERENCES public.payments(id),
  refund_amount_paise bigint NOT NULL DEFAULT 0 CHECK (refund_amount_paise >= 0),
  platform_fee_paise bigint NOT NULL DEFAULT 0 CHECK (platform_fee_paise >= 0),
  status text NOT NULL CHECK (status IN ('cancelled', 'refund_pending', 'refund_processed', 'refund_failed')),
  provider_refund_id text,
  provider_status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS booking_cancellations_provider_refund_idx
  ON public.booking_cancellations (provider_refund_id)
  WHERE provider_refund_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS booking_cancellations_pending_idx
  ON public.booking_cancellations (updated_at)
  WHERE status = 'refund_pending';

CREATE OR REPLACE FUNCTION public.cancel_customer_booking(
  p_booking_id uuid,
  p_customer_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_customer_id uuid;
  v_booking public.bookings%rowtype;
  v_payment public.payments%rowtype;
  v_cancel public.booking_cancellations%rowtype;
  v_has_payment boolean := false;
  v_paid_paise bigint := 0;
  v_fee_paise bigint := 0;
  v_refund_paise bigint := 0;
BEGIN
  SELECT id INTO v_customer_id FROM public.customers WHERE user_id = p_customer_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Customer profile not found.' USING errcode = '42501'; END IF;

  SELECT * INTO v_booking FROM public.bookings
   WHERE id = p_booking_id AND customer_id = v_customer_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found.' USING errcode = 'P0002'; END IF;

  SELECT * INTO v_cancel FROM public.booking_cancellations WHERE booking_id = p_booking_id;
  IF FOUND THEN RETURN to_jsonb(v_cancel); END IF;

  IF v_booking.status::text NOT IN (
    'pending', 'confirmed', 'finding_washer', 'support_escalated', 'washer_assigned',
    'washer_on_the_way', 'washer_arrived', 'otp_verified'
  ) THEN
    RAISE EXCEPTION 'This booking can no longer be cancelled online.' USING errcode = '55000';
  END IF;

  PERFORM 1 FROM public.payments
   WHERE booking_id = p_booking_id AND status = 'created'
   FOR UPDATE;
  IF FOUND THEN
    RAISE EXCEPTION 'Payment is still processing. Wait for payment confirmation, then retry cancellation.' USING errcode = '55000';
  END IF;

  SELECT * INTO v_payment FROM public.payments
   WHERE booking_id = p_booking_id AND status = 'paid'
     AND lower(coalesce(payment_method::text, '')) NOT IN ('cod', 'cash')
   ORDER BY paid_at DESC NULLS LAST, created_at DESC
   LIMIT 1 FOR UPDATE;
  v_has_payment := FOUND;
  IF v_has_payment THEN
    IF nullif(v_payment.provider_payment_id, '') IS NULL THEN
      RAISE EXCEPTION 'Paid payment is missing its provider reference; contact support before cancelling.' USING errcode = '55000';
    END IF;
    v_paid_paise := round(v_payment.amount * 100)::bigint;
    v_fee_paise := round(greatest(coalesce(v_booking.platform_fee, 0), 0) * 100)::bigint;
    v_refund_paise := greatest(v_paid_paise - v_fee_paise, 0);
  END IF;

  INSERT INTO public.booking_cancellations (
    booking_id, customer_id, payment_id, refund_amount_paise,
    platform_fee_paise, status
  ) VALUES (
    p_booking_id, v_customer_id,
    CASE WHEN v_has_payment THEN v_payment.id ELSE NULL END,
    v_refund_paise, v_fee_paise,
    CASE WHEN v_refund_paise > 0 THEN 'refund_pending' ELSE 'cancelled' END
  ) RETURNING * INTO v_cancel;

  UPDATE public.bookings SET status = 'cancelled', updated_at = now()
   WHERE id = p_booking_id;
  UPDATE public.booking_assignments
     SET status = 'cancelled', responded_at = now(),
         rejection_reason = 'Booking cancelled by customer.'
   WHERE booking_id = p_booking_id AND status IN ('pending', 'accepted');

  IF v_booking.assigned_washer_id IS NOT NULL THEN
    UPDATE public.washers w SET status = 'available', updated_at = now()
     WHERE w.id = v_booking.assigned_washer_id AND w.status = 'busy'
       AND NOT EXISTS (
         SELECT 1 FROM public.bookings b
          WHERE b.assigned_washer_id = w.id AND b.id <> p_booking_id
            AND b.status::text IN ('washer_assigned', 'washer_on_the_way', 'washer_arrived', 'otp_verified', 'service_started', 'service_completed')
       );
  END IF;

  RETURN to_jsonb(v_cancel);
END;
$function$;

REVOKE ALL ON FUNCTION public.cancel_customer_booking(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_customer_booking(uuid, uuid) TO service_role;
REVOKE ALL ON TABLE public.booking_cancellations FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.booking_cancellations TO service_role;

COMMIT;
NOTIFY pgrst, 'reload schema';
