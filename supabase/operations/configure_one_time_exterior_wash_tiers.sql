-- Configure the three shared one-time exterior wash tiers for every vehicle.
-- Prices are before GST. Re-running this script updates only these named packages.
-- It uses an active wash service, an existing package's duration/commission, and
-- raises a clear error when the database does not contain those prerequisites.
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.services WHERE is_active = true AND lower(name) LIKE '%wash%') THEN
    RAISE EXCEPTION 'No active wash service found. Create or activate a wash service first.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.service_packages WHERE is_active = true) THEN
    RAISE EXCEPTION 'No active package found to copy duration and commission from.';
  END IF;
END $$;

WITH selected_service AS (
  SELECT id
    FROM public.services
   WHERE is_active = true AND lower(name) LIKE '%wash%'
   ORDER BY CASE WHEN lower(name) = 'exterior wash' THEN 0 ELSE 1 END, name
   LIMIT 1
), defaults AS (
  SELECT duration_minutes, washer_commission_percent
    FROM public.service_packages
   WHERE is_active = true
   ORDER BY id
   LIMIT 1
), tiers(name, description, price) AS (
  VALUES
    ('Essential Exterior Wash', 'One exterior wash for one registered vehicle. GST extra. Interior cleaning, vacuuming, polishing, and detailing are not included.', 100::numeric),
    ('Plus Exterior Wash', 'One enhanced exterior wash for one registered vehicle. GST extra. Interior cleaning, vacuuming, polishing, and detailing are not included.', 130::numeric),
    ('Premium Exterior Wash', 'One premium exterior wash for one registered vehicle. GST extra. Interior cleaning, vacuuming, polishing, and detailing are not included.', 150::numeric)
), updated AS (
  UPDATE public.service_packages package
     SET service_id = selected_service.id,
         description = tiers.description,
         vehicle_type = 'all vehicles',
         price = tiers.price,
         is_active = true
    FROM tiers, selected_service
   WHERE lower(package.name) = lower(tiers.name)
   RETURNING lower(package.name) AS name
)
INSERT INTO public.service_packages (
  service_id, name, description, vehicle_type, price,
  duration_minutes, washer_commission_percent, is_active
)
SELECT selected_service.id, tiers.name, tiers.description, 'all vehicles', tiers.price,
       defaults.duration_minutes, defaults.washer_commission_percent, true
  FROM tiers
 CROSS JOIN selected_service
 CROSS JOIN defaults
 WHERE NOT EXISTS (
   SELECT 1 FROM public.service_packages existing
    WHERE lower(existing.name) = lower(tiers.name)
 );

COMMIT;
NOTIFY pgrst, 'reload schema';

SELECT id, name, vehicle_type, price, duration_minutes, is_active
  FROM public.service_packages
 WHERE lower(name) IN ('essential exterior wash', 'plus exterior wash', 'premium exterior wash')
 ORDER BY price;
