-- Restore missing default catalog entries without changing existing prices.
BEGIN;
-- =========================================================
-- FILE: 047_services_seed.sql
-- MODULE: Seed Data
-- PURPOSE: Default service categories
-- RUN AFTER: All schema + RLS files
-- =========================================================

INSERT INTO public.services (
    name,
    description,
    is_active
)
SELECT
    'Car Wash',
    'Professional doorstep exterior car wash service',
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM public.services
    WHERE LOWER(name) = LOWER('Car Wash')
);


INSERT INTO public.services (
    name,
    description,
    is_active
)
SELECT
    'Interior Cleaning',
    'Professional interior vacuuming and cleaning service',
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM public.services
    WHERE LOWER(name) = LOWER('Interior Cleaning')
);


INSERT INTO public.services (
    name,
    description,
    is_active
)
SELECT
    'Car Detailing',
    'Complete interior and exterior car detailing service',
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM public.services
    WHERE LOWER(name) = LOWER('Car Detailing')
);

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

-- =========================================================
-- FILE: 049_service_checklist_seed.sql
-- MODULE: Seed Data
-- PURPOSE: Default service completion checklist
-- RUN AFTER: 047_services_seed.sql
-- =========================================================


-- =========================================================
-- CAR WASH CHECKLIST
-- =========================================================

INSERT INTO public.service_checklist_items (
    service_id,
    title,
    sort_order,
    active
)
SELECT
    s.id,
    item.title,
    item.sort_order,
    TRUE
FROM public.services s
CROSS JOIN (
    VALUES
        ('Vehicle condition checked', 1),
        ('Before service photos uploaded', 2),
        ('Exterior water wash completed', 3),
        ('Car shampoo applied', 4),
        ('Tyres and wheels cleaned', 5),
        ('Exterior body cleaned', 6),
        ('Vehicle dried', 7),
        ('Windows cleaned', 8),
        ('Final inspection completed', 9),
        ('After service photos uploaded', 10)
) AS item(title, sort_order)

WHERE LOWER(s.name) = LOWER('Car Wash')

AND NOT EXISTS (
    SELECT 1
    FROM public.service_checklist_items sci
    WHERE sci.service_id = s.id
      AND LOWER(sci.title) = LOWER(item.title)
);


-- =========================================================
-- INTERIOR CLEANING CHECKLIST
-- =========================================================

INSERT INTO public.service_checklist_items (
    service_id,
    title,
    sort_order,
    active
)
SELECT
    s.id,
    item.title,
    item.sort_order,
    TRUE
FROM public.services s
CROSS JOIN (
    VALUES
        ('Interior condition checked', 1),
        ('Before service photos uploaded', 2),
        ('Seats vacuumed', 3),
        ('Floor vacuumed', 4),
        ('Dashboard cleaned', 5),
        ('Door panels cleaned', 6),
        ('Interior glass cleaned', 7),
        ('Boot area cleaned', 8),
        ('Final interior inspection completed', 9),
        ('After service photos uploaded', 10)
) AS item(title, sort_order)

WHERE LOWER(s.name) = LOWER('Interior Cleaning')

AND NOT EXISTS (
    SELECT 1
    FROM public.service_checklist_items sci
    WHERE sci.service_id = s.id
      AND LOWER(sci.title) = LOWER(item.title)
);


-- =========================================================
-- CAR DETAILING CHECKLIST
-- =========================================================

INSERT INTO public.service_checklist_items (
    service_id,
    title,
    sort_order,
    active
)
SELECT
    s.id,
    item.title,
    item.sort_order,
    TRUE
FROM public.services s
CROSS JOIN (
    VALUES
        ('Vehicle inspection completed', 1),
        ('Before detailing photos uploaded', 2),
        ('Exterior deep cleaning completed', 3),
        ('Tyres and wheels detailed', 4),
        ('Interior vacuum completed', 5),
        ('Dashboard detailed', 6),
        ('Seats cleaned', 7),
        ('Glass cleaned', 8),
        ('Exterior polishing completed', 9),
        ('Final quality inspection completed', 10),
        ('After detailing photos uploaded', 11)
) AS item(title, sort_order)

WHERE LOWER(s.name) = LOWER('Car Detailing')

AND NOT EXISTS (
    SELECT 1
    FROM public.service_checklist_items sci
    WHERE sci.service_id = s.id
      AND LOWER(sci.title) = LOWER(item.title)
);

COMMIT;
NOTIFY pgrst, 'reload schema';
