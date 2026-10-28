-- Enforce one customer review per booking, including concurrent requests.
-- Before running, resolve any existing duplicate booking_id values in reviews.
BEGIN;

DO $block$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.reviews
     GROUP BY booking_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate reviews already exist. Resolve duplicate booking_id rows before applying this migration.';
  END IF;
END;
$block$;

CREATE UNIQUE INDEX IF NOT EXISTS reviews_one_per_booking_idx
  ON public.reviews (booking_id);

COMMIT;
