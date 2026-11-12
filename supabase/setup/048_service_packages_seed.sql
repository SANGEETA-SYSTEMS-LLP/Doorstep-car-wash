-- ========================================================= 
-- FILE: 048_service_packages_seed.sql 
-- MODULE: Seed Data 
-- PURPOSE: Default service packages 
-- RUN AFTER: 047_services_seed.sql 
-- ========================================================= 
 
 
-- ========================================================= 
-- CAR WASH - HATCHBACK 
-- ========================================================= 
 
INSERT INTO public.service_packages ( 
    service_id, 
    name, 
    description, 
    vehicle_type, 
    price, 
    duration_minutes, 
    washer_commission_percent, 
    is_active 
) 
SELECT 
    s.id, 
    'Basic Car Wash', 
    'Exterior body wash and cleaning', 
    'hatchback', 
    299.00, 
    45, 
    70, 
    TRUE 
FROM public.services s 
WHERE LOWER(s.name) = LOWER('Car Wash') 
AND NOT EXISTS ( 
    SELECT 1 
    FROM public.service_packages sp 
    WHERE sp.service_id = s.id 
      AND LOWER(sp.name) = LOWER('Basic Car Wash') 
      AND LOWER(sp.vehicle_type) = LOWER('hatchback') 
); 
 
 
-- ========================================================= 
-- CAR WASH - SEDAN 
-- ========================================================= 
 
INSERT INTO public.service_packages ( 
    service_id, 
    name, 
    description, 
    vehicle_type, 
    price, 
    duration_minutes, 
    washer_commission_percent, 
    is_active 
) 
SELECT 
    s.id, 
    'Basic Car Wash', 
    'Exterior body wash and cleaning', 
    'sedan', 
    349.00, 
    45, 
    70, 
    TRUE 
FROM public.services s 
WHERE LOWER(s.name) = LOWER('Car Wash') 
AND NOT EXISTS ( 
    SELECT 1 
    FROM public.service_packages sp 
    WHERE sp.service_id = s.id 
      AND LOWER(sp.name) = LOWER('Basic Car Wash') 
      AND LOWER(sp.vehicle_type) = LOWER('sedan') 
); 
 
 
-- ========================================================= 
-- CAR WASH - SUV 
-- ========================================================= 
 
INSERT INTO public.service_packages ( 
    service_id, 
    name, 
    description, 
    vehicle_type, 
    price, 
    duration_minutes, 
    washer_commission_percent, 
    is_active 
) 
SELECT 
    s.id, 
    'Basic Car Wash', 
    'Exterior body wash and cleaning', 
    'suv', 
    399.00, 
    60, 
    70, 
    TRUE 
FROM public.services s 
WHERE LOWER(s.name) = LOWER('Car Wash') 
AND NOT EXISTS ( 
    SELECT 1 
    FROM public.service_packages sp 
    WHERE sp.service_id = s.id 
      AND LOWER(sp.name) = LOWER('Basic Car Wash') 
      AND LOWER(sp.vehicle_type) = LOWER('suv') 
); 
 
 
-- ========================================================= 
-- INTERIOR CLEANING - HATCHBACK 
-- ========================================================= 
 
INSERT INTO public.service_packages ( 
    service_id, 
    name, 
    description, 
    vehicle_type, 
    price, 
    duration_minutes, 
    washer_commission_percent, 
    is_active 
) 
SELECT 
    s.id, 
    'Interior Cleaning', 
    'Vacuuming, dashboard cleaning and interior cleaning', 
    'hatchback', 
    399.00, 
    60, 
    70, 
    TRUE 
FROM public.services s 
WHERE LOWER(s.name) = LOWER('Interior Cleaning') 
AND NOT EXISTS ( 
    SELECT 1 
    FROM public.service_packages sp 
    WHERE sp.service_id = s.id 
      AND LOWER(sp.name) = LOWER('Interior Cleaning') 
      AND LOWER(sp.vehicle_type) = LOWER('hatchback') 
); 
 
 
-- ========================================================= 
-- INTERIOR CLEANING - SEDAN 
-- ========================================================= 
 
INSERT INTO public.service_packages ( 
    service_id, 
    name, 
    description, 
    vehicle_type, 
    price, 
    duration_minutes, 
    washer_commission_percent, 
    is_active 
) 
SELECT 
    s.id, 
    'Interior Cleaning', 
    'Vacuuming, dashboard cleaning and interior cleaning', 
    'sedan', 
    449.00, 
    60, 
    70, 
    TRUE 
FROM public.services s 
WHERE LOWER(s.name) = LOWER('Interior Cleaning') 
AND NOT EXISTS ( 
    SELECT 1 
    FROM public.service_packages sp 
    WHERE sp.service_id = s.id 
      AND LOWER(sp.name) = LOWER('Interior Cleaning') 
      AND LOWER(sp.vehicle_type) = LOWER('sedan') 
); 
 
 
-- ========================================================= 
-- INTERIOR CLEANING - SUV 
-- ========================================================= 
 
INSERT INTO public.service_packages ( 
    service_id, 
    name, 
    description, 
    vehicle_type, 
    price, 
    duration_minutes, 
    washer_commission_percent, 
    is_active 
) 
SELECT 
    s.id, 
    'Interior Cleaning', 
    'Vacuuming, dashboard cleaning and interior cleaning', 
    'suv', 
    549.00, 
    75, 
    70, 
    TRUE 
FROM public.services s 
WHERE LOWER(s.name) = LOWER('Interior Cleaning') 
AND NOT EXISTS ( 
    SELECT 1 
    FROM public.service_packages sp 
    WHERE sp.service_id = s.id 
      AND LOWER(sp.name) = LOWER('Interior Cleaning') 
      AND LOWER(sp.vehicle_type) = LOWER('suv') 
); 
 
 
-- ========================================================= 
-- CAR DETAILING - HATCHBACK 
-- ========================================================= 
 
INSERT INTO public.service_packages ( 
    service_id, 
    name, 
    description, 
    vehicle_type, 
    price, 
    duration_minutes, 
    washer_commission_percent, 
    is_active 
) 
SELECT 
    s.id, 
    'Complete Detailing', 
    'Complete interior and exterior detailing', 
    'hatchback', 
    999.00, 
    120, 
    70, 
    TRUE 
FROM public.services s 
WHERE LOWER(s.name) = LOWER('Car Detailing') 
AND NOT EXISTS ( 
    SELECT 1 
    FROM public.service_packages sp 
    WHERE sp.service_id = s.id 
      AND LOWER(sp.name) = LOWER('Complete Detailing') 
      AND LOWER(sp.vehicle_type) = LOWER('hatchback') 
); 
 
 
-- ========================================================= 
-- CAR DETAILING - SEDAN 
-- ========================================================= 
 
INSERT INTO public.service_packages ( 
    service_id, 
    name, 
    description, 
    vehicle_type, 
    price, 
    duration_minutes, 
    washer_commission_percent, 
    is_active 
) 
SELECT 
    s.id, 
    'Complete Detailing', 
    'Complete interior and exterior detailing', 
    'sedan', 
    1199.00, 
    150, 
    70, 
    TRUE 
FROM public.services s 
WHERE LOWER(s.name) = LOWER('Car Detailing') 
AND NOT EXISTS ( 
    SELECT 1 
    FROM public.service_packages sp 
    WHERE sp.service_id = s.id 
      AND LOWER(sp.name) = LOWER('Complete Detailing') 
      AND LOWER(sp.vehicle_type) = LOWER('sedan') 
); 
 
 
-- ========================================================= 
-- CAR DETAILING - SUV 
-- ========================================================= 
 
INSERT INTO public.service_packages ( 
    service_id, 
    name, 
    description, 
    vehicle_type, 
    price, 
    duration_minutes, 
    washer_commission_percent, 
    is_active 
) 
SELECT 
    s.id, 
    'Complete Detailing', 
    'Complete interior and exterior detailing', 
    'suv', 
    1499.00, 
    180, 
    70, 
    TRUE 
FROM public.services s 
WHERE LOWER(s.name) = LOWER('Car Detailing') 
AND NOT EXISTS ( 
    SELECT 1 
    FROM public.service_packages sp 
    WHERE sp.service_id = s.id 
      AND LOWER(sp.name) = LOWER('Complete Detailing') 
      AND LOWER(sp.vehicle_type) = LOWER('suv') 
);


