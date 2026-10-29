-- Store redeemed offer codes with bookings and enforce one redemption of each
-- offer code per customer, including concurrent checkout requests.
-- Run in Supabase SQL Editor as database owner. Safe to re-run.
BEGIN;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS promo_code text;

CREATE INDEX IF NOT EXISTS bookings_customer_promo_code_idx
  ON public.bookings (customer_id, upper(promo_code))
  WHERE promo_code IS NOT NULL;

DO $block$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM public.bookings
     WHERE promo_code IS NOT NULL AND btrim(promo_code) <> ''
     GROUP BY customer_id, upper(btrim(promo_code))
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate customer promo redemptions exist. Resolve duplicates before installing the one-use-offer constraint.';
  END IF;
END;
$block$;

CREATE UNIQUE INDEX IF NOT EXISTS bookings_customer_one_use_promo_idx
  ON public.bookings (customer_id, upper(btrim(promo_code)))
  WHERE promo_code IS NOT NULL AND btrim(promo_code) <> '';

COMMIT;
NOTIFY pgrst, 'reload schema';

-- Confirm the column and redemption guard are installed.
SELECT column_name, data_type
  FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'bookings'
   AND column_name = 'promo_code';

SELECT indexname
  FROM pg_indexes
 WHERE schemaname = 'public'
   AND indexname = 'bookings_customer_one_use_promo_idx';
