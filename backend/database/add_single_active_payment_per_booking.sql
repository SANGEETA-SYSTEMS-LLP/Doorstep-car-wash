-- Prevent concurrent checkout requests from creating multiple payable orders.
-- Resolve any existing duplicate created/paid payment rows before applying.
BEGIN;

DO $block$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.payments
     WHERE booking_id IS NOT NULL AND status IN ('created', 'paid')
     GROUP BY booking_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Multiple active payments already exist for a booking. Reconcile duplicates before applying this migration.';
  END IF;
END;
$block$;

CREATE UNIQUE INDEX IF NOT EXISTS payments_one_active_per_booking_idx
  ON public.payments (booking_id)
  WHERE booking_id IS NOT NULL AND status IN ('created', 'paid');

COMMIT;
