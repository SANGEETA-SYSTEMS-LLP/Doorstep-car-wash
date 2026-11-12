-- =========================================================
-- FILE: 036_enable_rls.sql
-- MODULE: Security
-- PURPOSE: Enable Row Level Security
-- RUN AFTER: all required tables 001–028 have been created
-- =========================================================

-- Fail before changing any table if this is run out of order or a prior
-- schema script failed. In particular, washer_availability is created by 015.
DO $$
DECLARE
    missing_tables text;
BEGIN
    SELECT string_agg(required.table_name, ', ' ORDER BY required.table_name)
      INTO missing_tables
      FROM unnest(ARRAY[
        'profiles', 'customers', 'customer_addresses', 'vehicles',
        'societies', 'society_towers', 'service_zones',
        'services', 'service_packages', 'service_checklist_items',
        'washers', 'washer_locations', 'washer_availability', 'washer_skills',
        'bookings', 'booking_assignments', 'booking_status_history',
        'booking_service_photos', 'booking_service_checklist',
        'extra_charge_requests', 'payments', 'washer_earnings',
        'washer_settlements', 'reviews', 'notifications'
      ]) AS required(table_name)
     WHERE to_regclass(format('public.%I', required.table_name)) IS NULL;

    IF missing_tables IS NOT NULL THEN
        RAISE EXCEPTION 'Cannot enable RLS; required tables are missing: %. Run the earlier supabase/setup SQL files in numeric order first (washer_availability is created by 015_washer_availability.sql).', missing_tables;
    END IF;
END
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.societies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.society_towers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_zones ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_checklist_items ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.washers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.washer_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.washer_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.washer_skills ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_service_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_service_checklist ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.extra_charge_requests ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.washer_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.washer_settlements ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;


