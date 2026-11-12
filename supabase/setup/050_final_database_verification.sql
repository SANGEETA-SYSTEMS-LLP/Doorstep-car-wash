-- =========================================================
-- FILE: 050_final_database_verification.sql
-- MODULE: Verification
-- PURPOSE: Verify database installation
-- RUN LAST
-- =========================================================


-- =========================================================
-- 1. CHECK TABLES
-- =========================================================

SELECT
    table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'profiles',
    'customers',
    'customer_addresses',
    'vehicles',

    'societies',
    'society_towers',
    'service_zones',

    'services',
    'service_packages',
    'service_checklist_items',

    'washers',
    'washer_locations',
    'washer_availability',
    'washer_skills',

    'bookings',
    'booking_assignments',
    'booking_status_history',
    'booking_service_photos',
    'booking_service_checklist',

    'extra_charge_requests',

    'payments',

    'washer_earnings',
    'washer_settlements',

    'reviews',
    'notifications'
)
ORDER BY table_name;


-- =========================================================
-- 2. CHECK SERVICES
-- =========================================================

SELECT
    id,
    name,
    is_active
FROM public.services
ORDER BY name;


-- =========================================================
-- 3. CHECK PACKAGES
-- =========================================================

SELECT
    s.name AS service_name,
    sp.name AS package_name,
    sp.vehicle_type,
    sp.price,
    sp.duration_minutes,
    sp.washer_commission_percent,
    sp.is_active

FROM public.service_packages sp

JOIN public.services s
    ON s.id = sp.service_id

ORDER BY
    s.name,
    sp.vehicle_type,
    sp.price;


-- =========================================================
-- 4. CHECK SERVICE CHECKLIST
-- =========================================================

SELECT
    s.name AS service_name,
    sci.title,
    sci.sort_order,
    sci.active

FROM public.service_checklist_items sci

JOIN public.services s
    ON s.id = sci.service_id

ORDER BY
    s.name,
    sci.sort_order;


-- =========================================================
-- 5. CHECK ENUMS
-- =========================================================

SELECT
    n.nspname AS schema_name,
    t.typname AS enum_name,
    e.enumlabel AS enum_value

FROM pg_type t

JOIN pg_enum e
    ON t.oid = e.enumtypid

JOIN pg_namespace n
    ON n.oid = t.typnamespace

WHERE n.nspname = 'public'

AND t.typname IN (
    'user_role',
    'washer_status',
    'booking_status',
    'assignment_status',
    'payment_status',
    'payment_method',
    'extra_charge_status'
)

ORDER BY
    t.typname,
    e.enumsortorder;


-- =========================================================
-- 6. CHECK FUNCTIONS
-- =========================================================

SELECT
    routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'set_updated_at',
    'handle_new_user',
    'log_booking_status',
    'find_washer_for_booking',
    'accept_booking_assignment',
    'reject_booking_assignment'
)
ORDER BY routine_name;


-- =========================================================
-- 7. CHECK RLS STATUS
-- =========================================================

SELECT
    schemaname,
    tablename,
    rowsecurity

FROM pg_tables

WHERE schemaname = 'public'

ORDER BY tablename;


-- =========================================================
-- 8. CHECK POLICIES
-- =========================================================

SELECT
    schemaname,
    tablename,
    policyname,
    cmd

FROM pg_policies

WHERE schemaname = 'public'

ORDER BY
    tablename,
    policyname;


-- =========================================================
-- 9. CHECK PAYMENT PROVIDER COLUMNS
-- =========================================================

SELECT
    column_name,
    data_type

FROM information_schema.columns

WHERE table_schema = 'public'
AND table_name = 'payments'
AND column_name IN (
    'provider',
    'provider_order_id',
    'provider_payment_id',
    'provider_signature'
)

ORDER BY column_name;


-- =========================================================
-- 10. CHECK BOOKING PHOTO TABLE
-- =========================================================

SELECT
    column_name,
    data_type,
    is_nullable

FROM information_schema.columns

WHERE table_schema = 'public'
AND table_name = 'booking_service_photos'

ORDER BY ordinal_position;


