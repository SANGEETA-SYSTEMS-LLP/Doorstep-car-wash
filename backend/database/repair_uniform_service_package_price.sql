-- Temporarily set every service package to the same price.
-- Current shared WashNow package price: ₹399.
-- Run in Supabase SQL Editor as database owner. Safe to re-run.
BEGIN;

UPDATE public.service_packages
   SET price = 399
 WHERE price IS DISTINCT FROM 399;

COMMIT;
NOTIFY pgrst, 'reload schema';

-- Confirm all packages now use the shared price.
SELECT count(*) AS package_count,
       count(*) FILTER (WHERE price IS DISTINCT FROM 399) AS packages_with_different_price,
       min(price) AS minimum_price,
       max(price) AS maximum_price
  FROM public.service_packages;
