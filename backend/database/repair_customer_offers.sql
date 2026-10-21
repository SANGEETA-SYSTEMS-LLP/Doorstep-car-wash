-- Store redeemed offer codes with bookings and enforce one FIRSTWASH redemption
-- per customer, including concurrent checkout requests.
-- Run in Supabase SQL Editor as database owner. Safe to re-run.
BEGIN;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS promo_code text;

CREATE INDEX IF NOT EXISTS bookings_customer_promo_code_idx
  ON public.bookings (customer_id, upper(promo_code))
  WHERE promo_code IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS bookings_firstwash_once_per_customer_idx
  ON public.bookings (customer_id)
  WHERE upper(promo_code) = 'FIRSTWASH';

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
   AND indexname = 'bookings_firstwash_once_per_customer_idx';
