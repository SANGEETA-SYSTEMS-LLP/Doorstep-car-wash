-- Retire the three discontinued ₹399 packages from one-time wash selection.
-- Existing booking history retains its original package name and price.
-- Safe to re-run.
BEGIN;

UPDATE public.service_packages
   SET is_active = false
 WHERE is_active = true
   AND price = 399
   AND NOT lower(regexp_replace(btrim(name), '\s+', ' ', 'g')) LIKE '%monthly%'
   AND lower(regexp_replace(btrim(name), '\s+', ' ', 'g'))
       IN ('interior cleaning', 'complete detailing', 'basic car wash');

COMMIT;
NOTIFY pgrst, 'reload schema';

SELECT id, name, price, is_active
  FROM public.service_packages
 WHERE lower(regexp_replace(btrim(name), '\s+', ' ', 'g'))
       IN ('interior cleaning', 'complete detailing', 'basic car wash')
   AND NOT lower(regexp_replace(btrim(name), '\s+', ' ', 'g')) LIKE '%monthly%'
 ORDER BY name;
