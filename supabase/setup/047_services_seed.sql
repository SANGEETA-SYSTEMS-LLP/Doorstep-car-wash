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


