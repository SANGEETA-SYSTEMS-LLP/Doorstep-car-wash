-- GENERATED FILE. New, empty Supabase projects only. Do not replay on a live database.

-- Source of truth: setup/*.sql, then migrations/*.sql in filename order.



-- ===== setup/001_extensions.sql =====

-- =========================================================
-- FILE: 001_extensions.sql
-- PURPOSE: PostgreSQL extensions used by the application
-- RUN: FIRST
-- =========================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";





-- ===== setup/002_enums.sql =====

-- =========================================================
-- FILE: 002_enums.sql
-- PURPOSE: Common enums used throughout the application
-- RUN: AFTER 001_extensions.sql
-- =========================================================
-- USER ROLES
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'user_role'
    ) THEN
        CREATE TYPE public.user_role AS ENUM (
            'customer',
            'washer',
            'supervisor',
            'support',
            'accountant',
            'sub_admin',
            'super_admin'
        );
    END IF;
END
$$;

-- ---------------------------------------------------------
-- WASHER STATUS
-- ---------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'washer_status'
    ) THEN
        CREATE TYPE public.washer_status AS ENUM (
            'offline',
            'available',
            'busy'
        );
    END IF;
END
$$;


-- ---------------------------------------------------------
-- BOOKING STATUS
-- ---------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'booking_status'
    ) THEN
        CREATE TYPE public.booking_status AS ENUM (
            'pending',
            'confirmed',
            'finding_washer',
            'washer_assigned',
            'washer_on_the_way',
            'washer_arrived',
            'otp_verified',
            'service_started',
            'service_completed',
            'customer_confirmed',
            'payment_completed',
            'closed',
            'cancelled',
            'refund_requested',
            'refunded',
            'disputed',
            'support_escalated'
        );
    END IF;
END
$$;


-- ---------------------------------------------------------
-- BOOKING ASSIGNMENT STATUS
-- ---------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'assignment_status'
    ) THEN
        CREATE TYPE public.assignment_status AS ENUM (
            'pending',
            'accepted',
            'rejected',
            'expired',
            'cancelled'
        );
    END IF;
END
$$;


-- ---------------------------------------------------------
-- PAYMENT STATUS
-- ---------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'payment_status'
    ) THEN
        CREATE TYPE public.payment_status AS ENUM (
            'pending',
            'created',
            'paid',
            'failed',
            'refunded'
        );
    END IF;
END
$$;


-- ---------------------------------------------------------
-- PAYMENT METHOD
-- ---------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'payment_method'
    ) THEN
        CREATE TYPE public.payment_method AS ENUM (
            'online',
            'cod'
        );
    END IF;
END
$$;


-- ---------------------------------------------------------
-- EXTRA CHARGE STATUS
-- ---------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'extra_charge_status'
    ) THEN
        CREATE TYPE public.extra_charge_status AS ENUM (
            'pending',
            'approved',
            'rejected',
            'customer_approved',
            'customer_rejected',
            'cancelled'
        );
    END IF;
END
$$;





-- ===== setup/003_profiles.sql =====

-- =========================================================
-- FILE: 003_profiles.sql
-- PURPOSE: Main application user profile
-- RUN: AFTER 002_enums.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    full_name TEXT,

    phone TEXT,

    avatar_url TEXT,

    role public.user_role
        NOT NULL
        DEFAULT 'customer',

    is_active BOOLEAN
        NOT NULL
        DEFAULT TRUE,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW()
);


-- ---------------------------------------------------------
-- INDEX: ROLE
-- ---------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_profiles_role
ON public.profiles(role);


-- ---------------------------------------------------------
-- INDEX: ACTIVE USERS
-- ---------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_profiles_active
ON public.profiles(is_active);


-- ---------------------------------------------------------
-- INDEX: ROLE + ACTIVE
-- Useful for admin dashboards
-- ---------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_profiles_role_active
ON public.profiles(role, is_active);





-- ===== setup/004_customers.sql =====

-- =========================================================
-- FILE: 004_customers.sql
-- PURPOSE: Customer-specific information
-- RUN: AFTER 003_profiles.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    user_id UUID
        NOT NULL
        UNIQUE
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    date_of_birth DATE,

    gender TEXT,

    preferred_language TEXT
        DEFAULT 'English',

    total_bookings INTEGER
        NOT NULL
        DEFAULT 0,

    total_spent NUMERIC(12,2)
        NOT NULL
        DEFAULT 0,

    is_active BOOLEAN
        NOT NULL
        DEFAULT TRUE,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    CHECK (total_bookings >= 0),

    CHECK (total_spent >= 0)
);


-- ---------------------------------------------------------
-- USER LOOKUP
-- ---------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_customers_user
ON public.customers(user_id);


-- ---------------------------------------------------------
-- ACTIVE CUSTOMER LOOKUP
-- ---------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_customers_active
ON public.customers(is_active);





-- ===== setup/005_societies.sql =====

-- =========================================================
-- FILE: 005_societies.sql
-- PURPOSE: Societies / apartments serviced by the platform
-- RUN: AFTER 004_customers.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.societies (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,

    formatted_address TEXT NOT NULL,

    -- Google Maps / Places ID
    place_id TEXT UNIQUE,

    area TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,

    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,

    service_radius_km NUMERIC(8,2)
        NOT NULL
        DEFAULT 5,

    is_active BOOLEAN
        NOT NULL
        DEFAULT TRUE,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    CHECK (latitude BETWEEN -90 AND 90),

    CHECK (longitude BETWEEN -180 AND 180),

    CHECK (service_radius_km > 0)
);


-- Location lookup
CREATE INDEX IF NOT EXISTS idx_societies_location
ON public.societies(latitude, longitude);


-- Active societies
CREATE INDEX IF NOT EXISTS idx_societies_active
ON public.societies(is_active);


-- City lookup
CREATE INDEX IF NOT EXISTS idx_societies_city
ON public.societies(city);





-- ===== setup/006_society_towers.sql =====

-- =========================================================
-- FILE: 006_society_towers.sql
-- PURPOSE: Towers / blocks belonging to societies
-- RUN: AFTER 005_societies.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.society_towers (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    society_id UUID
        NOT NULL
        REFERENCES public.societies(id)
        ON DELETE CASCADE,

    name TEXT NOT NULL,

    is_active BOOLEAN
        NOT NULL
        DEFAULT TRUE,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    UNIQUE (society_id, name)
);


CREATE INDEX IF NOT EXISTS idx_society_towers_society
ON public.society_towers(society_id);


CREATE INDEX IF NOT EXISTS idx_society_towers_active
ON public.society_towers(society_id, is_active);





-- ===== setup/007_service_zones.sql =====

-- =========================================================
-- FILE: 007_service_zones.sql
-- PURPOSE: Geographic areas where service is available
-- RUN: AFTER 005_societies.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.service_zones (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,

    society_id UUID
        REFERENCES public.societies(id)
        ON DELETE SET NULL,

    latitude DOUBLE PRECISION NOT NULL,

    longitude DOUBLE PRECISION NOT NULL,

    radius_km NUMERIC(8,2)
        NOT NULL
        DEFAULT 5,

    is_active BOOLEAN
        NOT NULL
        DEFAULT TRUE,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    CHECK (latitude BETWEEN -90 AND 90),

    CHECK (longitude BETWEEN -180 AND 180),

    CHECK (radius_km > 0)
);


CREATE INDEX IF NOT EXISTS idx_service_zones_society
ON public.service_zones(society_id);


CREATE INDEX IF NOT EXISTS idx_service_zones_location
ON public.service_zones(latitude, longitude);


CREATE INDEX IF NOT EXISTS idx_service_zones_active
ON public.service_zones(is_active);





-- ===== setup/008_customer_addresses.sql =====

-- =========================================================
-- FILE: 008_customer_addresses.sql
-- PURPOSE: Customer saved service addresses
-- RUN: AFTER 005_societies.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    customer_id UUID
        NOT NULL
        REFERENCES public.customers(id)
        ON DELETE CASCADE,

    label TEXT
        NOT NULL
        DEFAULT 'Home',

    address_line TEXT NOT NULL,

    society_id UUID
        REFERENCES public.societies(id)
        ON DELETE SET NULL,

    tower TEXT,

    flat_number TEXT,

    landmark TEXT,

    city TEXT,

    state TEXT,

    postal_code TEXT,

    latitude DOUBLE PRECISION NOT NULL,

    longitude DOUBLE PRECISION NOT NULL,

    is_default BOOLEAN
        NOT NULL
        DEFAULT FALSE,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    CHECK (latitude BETWEEN -90 AND 90),

    CHECK (longitude BETWEEN -180 AND 180)
);


CREATE INDEX IF NOT EXISTS idx_addresses_customer
ON public.customer_addresses(customer_id);


CREATE INDEX IF NOT EXISTS idx_addresses_society
ON public.customer_addresses(society_id);


CREATE INDEX IF NOT EXISTS idx_addresses_location
ON public.customer_addresses(latitude, longitude);


CREATE INDEX IF NOT EXISTS idx_addresses_customer_default
ON public.customer_addresses(customer_id, is_default);





-- ===== setup/009_customer_vehicles.sql =====

-- =========================================================
-- FILE: 009_customer_vehicles.sql
-- PURPOSE: Customer vehicles
-- RUN: AFTER 004_customers.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    customer_id UUID
        NOT NULL
        REFERENCES public.customers(id)
        ON DELETE CASCADE,

    vehicle_number TEXT NOT NULL,

    vehicle_type TEXT NOT NULL,

    brand TEXT,

    model TEXT,

    colour TEXT,

    is_default BOOLEAN
        NOT NULL
        DEFAULT FALSE,

    is_active BOOLEAN
        NOT NULL
        DEFAULT TRUE,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    UNIQUE (customer_id, vehicle_number)
);


CREATE INDEX IF NOT EXISTS idx_vehicles_customer
ON public.vehicles(customer_id);


CREATE INDEX IF NOT EXISTS idx_vehicles_customer_active
ON public.vehicles(customer_id, is_active);


CREATE INDEX IF NOT EXISTS idx_vehicles_customer_default
ON public.vehicles(customer_id, is_default);





-- ===== setup/010_services.sql =====

-- =========================================================
-- FILE: 010_services.sql
-- MODULE: Services
-- PURPOSE: Main car-wash service categories
-- RUN AFTER: 009_customer_vehicles.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,

    description TEXT,

    image_url TEXT,

    is_active BOOLEAN
        NOT NULL
        DEFAULT TRUE,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW()
);


CREATE INDEX IF NOT EXISTS idx_services_active
ON public.services(is_active);


CREATE INDEX IF NOT EXISTS idx_services_name
ON public.services(name);





-- ===== setup/011_service_packages.sql =====

-- =========================================================
-- FILE: 011_service_packages.sql
-- MODULE: Services
-- PURPOSE: Packages, pricing and duration
-- RUN AFTER: 010_services.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.service_packages (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    service_id UUID
        NOT NULL
        REFERENCES public.services(id)
        ON DELETE CASCADE,

    name TEXT NOT NULL,

    description TEXT,

    vehicle_type TEXT NOT NULL,

    price NUMERIC(12,2)
        NOT NULL,

    duration_minutes INTEGER
        NOT NULL
        DEFAULT 60,

    washer_commission_percent NUMERIC(5,2)
        NOT NULL
        DEFAULT 70,

    is_active BOOLEAN
        NOT NULL
        DEFAULT TRUE,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    CHECK (price >= 0),

    CHECK (duration_minutes > 0),

    CHECK (
        washer_commission_percent >= 0
        AND washer_commission_percent <= 100
    )
);


CREATE INDEX IF NOT EXISTS idx_service_packages_service
ON public.service_packages(service_id);


CREATE INDEX IF NOT EXISTS idx_service_packages_active
ON public.service_packages(is_active);


CREATE INDEX IF NOT EXISTS idx_service_packages_vehicle_type
ON public.service_packages(vehicle_type);


CREATE INDEX IF NOT EXISTS idx_service_packages_service_active
ON public.service_packages(service_id, is_active);





-- ===== setup/012_service_checklist_items.sql =====

-- =========================================================
-- FILE: 012_service_checklist_items.sql
-- MODULE: Services
-- PURPOSE: Checklist steps for each service
-- RUN AFTER: 010_services.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.service_checklist_items (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    service_id UUID
        NOT NULL
        REFERENCES public.services(id)
        ON DELETE CASCADE,

    title TEXT NOT NULL,

    sort_order INTEGER
        NOT NULL
        DEFAULT 0,

    active BOOLEAN
        NOT NULL
        DEFAULT TRUE,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    UNIQUE (service_id, title)
);


CREATE INDEX IF NOT EXISTS idx_service_checklist_service
ON public.service_checklist_items(service_id);


CREATE INDEX IF NOT EXISTS idx_service_checklist_active
ON public.service_checklist_items(service_id, active);


CREATE INDEX IF NOT EXISTS idx_service_checklist_sort
ON public.service_checklist_items(service_id, sort_order);





-- ===== setup/013_washers.sql =====

-- =========================================================
-- FILE: 013_washers.sql
-- MODULE: Washer
-- PURPOSE: Washer profile and operational information
-- RUN AFTER:
--   003_profiles.sql
--   002_enums.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.washers (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    user_id UUID
        NOT NULL
        UNIQUE
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    supervisor_id UUID
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    current_address TEXT,

    status public.washer_status
        NOT NULL
        DEFAULT 'offline',

    service_radius_km NUMERIC(8,2)
        NOT NULL
        DEFAULT 5,

    rating NUMERIC(3,2)
        NOT NULL
        DEFAULT 0,

    jobs_completed INTEGER
        NOT NULL
        DEFAULT 0,

    cancellation_rate NUMERIC(5,2)
        NOT NULL
        DEFAULT 0,

    total_earnings NUMERIC(12,2)
        NOT NULL
        DEFAULT 0,

    pending_settlement NUMERIC(12,2)
        NOT NULL
        DEFAULT 0,

    is_verified BOOLEAN
        NOT NULL
        DEFAULT FALSE,

    is_active BOOLEAN
        NOT NULL
        DEFAULT TRUE,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    CHECK (rating BETWEEN 0 AND 5),

    CHECK (service_radius_km > 0),

    CHECK (jobs_completed >= 0),

    CHECK (
        cancellation_rate >= 0
        AND cancellation_rate <= 100
    ),

    CHECK (total_earnings >= 0),

    CHECK (pending_settlement >= 0)
);


CREATE INDEX IF NOT EXISTS idx_washers_user
ON public.washers(user_id);


CREATE INDEX IF NOT EXISTS idx_washers_supervisor
ON public.washers(supervisor_id);


CREATE INDEX IF NOT EXISTS idx_washers_status
ON public.washers(status);


CREATE INDEX IF NOT EXISTS idx_washers_active_status
ON public.washers(is_active, status);


CREATE INDEX IF NOT EXISTS idx_washers_verified_available
ON public.washers(is_verified, is_active, status);





-- ===== setup/014_washer_locations.sql =====

-- =========================================================
-- FILE: 014_washer_locations.sql
-- MODULE: Washer
-- PURPOSE: Current real-time washer location
-- RUN AFTER: 013_washers.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.washer_locations (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    washer_id UUID
        NOT NULL
        UNIQUE
        REFERENCES public.washers(id)
        ON DELETE CASCADE,

    latitude DOUBLE PRECISION
        NOT NULL,

    longitude DOUBLE PRECISION
        NOT NULL,

    heading DOUBLE PRECISION,

    speed DOUBLE PRECISION,

    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    CHECK (latitude BETWEEN -90 AND 90),

    CHECK (longitude BETWEEN -180 AND 180),

    CHECK (
        heading IS NULL
        OR heading BETWEEN 0 AND 360
    ),

    CHECK (
        speed IS NULL
        OR speed >= 0
    )
);


CREATE INDEX IF NOT EXISTS idx_washer_locations_washer
ON public.washer_locations(washer_id);


CREATE INDEX IF NOT EXISTS idx_washer_locations_coordinates
ON public.washer_locations(latitude, longitude);


CREATE INDEX IF NOT EXISTS idx_washer_locations_updated
ON public.washer_locations(updated_at);





-- ===== setup/015_washer_availability.sql =====

-- =========================================================
-- FILE: 015_washer_availability.sql
-- MODULE: Washer
-- PURPOSE: Weekly washer availability schedule
-- RUN AFTER: 013_washers.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.washer_availability (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    washer_id UUID
        NOT NULL
        REFERENCES public.washers(id)
        ON DELETE CASCADE,

    day_of_week INTEGER
        NOT NULL,

    start_time TIME
        NOT NULL,

    end_time TIME
        NOT NULL,

    is_available BOOLEAN
        NOT NULL
        DEFAULT TRUE,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    CHECK (
        day_of_week BETWEEN 0 AND 6
    ),

    CHECK (
        end_time > start_time
    ),

    UNIQUE (
        washer_id,
        day_of_week,
        start_time,
        end_time
    )
);


CREATE INDEX IF NOT EXISTS idx_washer_availability_washer
ON public.washer_availability(washer_id);


CREATE INDEX IF NOT EXISTS idx_washer_availability_day
ON public.washer_availability(day_of_week);


CREATE INDEX IF NOT EXISTS idx_washer_availability_lookup
ON public.washer_availability(
    washer_id,
    day_of_week,
    is_available
);





-- ===== setup/016_washer_skills.sql =====

-- =========================================================
-- FILE: 016_washer_skills.sql
-- MODULE: Washer
-- PURPOSE: Services that a washer can perform
-- RUN AFTER:
--   010_services.sql
--   013_washers.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.washer_skills (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    washer_id UUID
        NOT NULL
        REFERENCES public.washers(id)
        ON DELETE CASCADE,

    service_id UUID
        NOT NULL
        REFERENCES public.services(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    UNIQUE (
        washer_id,
        service_id
    )
);


CREATE INDEX IF NOT EXISTS idx_washer_skills_washer
ON public.washer_skills(washer_id);


CREATE INDEX IF NOT EXISTS idx_washer_skills_service
ON public.washer_skills(service_id);





-- ===== setup/017_booking_sequence.sql =====

-- =========================================================
-- FILE: 017_booking_sequence.sql
-- MODULE: Booking
-- PURPOSE: Sequence used for human-readable booking numbers
-- RUN AFTER: 016_washer_skills.sql
-- =========================================================

CREATE SEQUENCE IF NOT EXISTS public.booking_number_seq
START WITH 10001
INCREMENT BY 1
MINVALUE 10001
NO MAXVALUE
CACHE 1;





-- ===== setup/018_bookings.sql =====

-- =========================================================
-- FILE: 018_bookings.sql
-- MODULE: Booking
-- PURPOSE: Main customer service booking
-- RUN AFTER:
--   008_customer_addresses.sql
--   009_customer_vehicles.sql
--   011_service_packages.sql
--   013_washers.sql
--   017_booking_sequence.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    booking_number TEXT
        NOT NULL
        UNIQUE
        DEFAULT (
            'CW-' ||
            TO_CHAR(CURRENT_DATE, 'YYYY') ||
            '-' ||
            LPAD(
                NEXTVAL('public.booking_number_seq')::TEXT,
                6,
                '0'
            )
        ),

    customer_id UUID
        NOT NULL
        REFERENCES public.customers(id)
        ON DELETE RESTRICT,

    address_id UUID
        NOT NULL
        REFERENCES public.customer_addresses(id)
        ON DELETE RESTRICT,

    vehicle_id UUID
        NOT NULL
        REFERENCES public.vehicles(id)
        ON DELETE RESTRICT,

    package_id UUID
        NOT NULL
        REFERENCES public.service_packages(id)
        ON DELETE RESTRICT,

    assigned_washer_id UUID
        REFERENCES public.washers(id)
        ON DELETE SET NULL,

    scheduled_date DATE
        NOT NULL,

    scheduled_start_time TIME
        NOT NULL,

    status public.booking_status
        NOT NULL
        DEFAULT 'pending',

    base_amount NUMERIC(12,2)
        NOT NULL,

    additional_amount NUMERIC(12,2)
        NOT NULL
        DEFAULT 0,

    extra_charge NUMERIC(12,2)
        NOT NULL
        DEFAULT 0,

    discount_amount NUMERIC(12,2)
        NOT NULL
        DEFAULT 0,

    tax_amount NUMERIC(12,2)
        NOT NULL
        DEFAULT 0,

    total_amount NUMERIC(12,2)
        NOT NULL,

    requires_supervisor BOOLEAN
        NOT NULL
        DEFAULT FALSE,

    service_otp TEXT,

    customer_notes TEXT,

    cancellation_reason TEXT,

    service_started_at TIMESTAMPTZ,

    service_completed_at TIMESTAMPTZ,

    customer_confirmed_at TIMESTAMPTZ,

    closed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    CHECK (base_amount >= 0),

    CHECK (additional_amount >= 0),

    CHECK (extra_charge >= 0),

    CHECK (discount_amount >= 0),

    CHECK (tax_amount >= 0),

    CHECK (total_amount >= 0)
);


CREATE INDEX IF NOT EXISTS idx_bookings_customer
ON public.bookings(customer_id);


CREATE INDEX IF NOT EXISTS idx_bookings_washer
ON public.bookings(assigned_washer_id);


CREATE INDEX IF NOT EXISTS idx_bookings_status
ON public.bookings(status);


CREATE INDEX IF NOT EXISTS idx_bookings_schedule
ON public.bookings(
    scheduled_date,
    scheduled_start_time
);


CREATE INDEX IF NOT EXISTS idx_bookings_customer_status
ON public.bookings(
    customer_id,
    status
);


CREATE INDEX IF NOT EXISTS idx_bookings_washer_status
ON public.bookings(
    assigned_washer_id,
    status
);





-- ===== setup/019_booking_assignments.sql =====

-- =========================================================
-- FILE: 019_booking_assignments.sql
-- MODULE: Booking / Washer
-- PURPOSE: Offer bookings to washers
-- RUN AFTER:
--   013_washers.sql
--   018_bookings.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.booking_assignments (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    booking_id UUID
        NOT NULL
        REFERENCES public.bookings(id)
        ON DELETE CASCADE,

    washer_id UUID
        NOT NULL
        REFERENCES public.washers(id)
        ON DELETE CASCADE,

    status public.assignment_status
        NOT NULL
        DEFAULT 'pending',

    distance_km NUMERIC(8,2),

    attempt_number INTEGER
        NOT NULL
        DEFAULT 1,

    rejection_reason TEXT,

    offered_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    responded_at TIMESTAMPTZ,

    expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    UNIQUE (
        booking_id,
        washer_id
    ),

    CHECK (
        distance_km IS NULL
        OR distance_km >= 0
    ),

    CHECK (
        attempt_number > 0
    )
);


CREATE INDEX IF NOT EXISTS idx_booking_assignments_washer_status
ON public.booking_assignments(
    washer_id,
    status
);


CREATE INDEX IF NOT EXISTS idx_booking_assignments_booking
ON public.booking_assignments(booking_id);


CREATE INDEX IF NOT EXISTS idx_booking_assignments_status
ON public.booking_assignments(status);


CREATE INDEX IF NOT EXISTS idx_booking_assignments_expires
ON public.booking_assignments(expires_at);





-- ===== setup/020_booking_status_history.sql =====

-- =========================================================
-- FILE: 020_booking_status_history.sql
-- MODULE: Booking
-- PURPOSE: Booking status audit/history
-- RUN AFTER:
--   003_profiles.sql
--   018_bookings.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.booking_status_history (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    booking_id UUID
        NOT NULL
        REFERENCES public.bookings(id)
        ON DELETE CASCADE,

    status public.booking_status
        NOT NULL,

    changed_by UUID
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    notes TEXT,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW()
);


CREATE INDEX IF NOT EXISTS idx_booking_history_booking
ON public.booking_status_history(
    booking_id,
    created_at
);


CREATE INDEX IF NOT EXISTS idx_booking_history_status
ON public.booking_status_history(status);


CREATE INDEX IF NOT EXISTS idx_booking_history_changed_by
ON public.booking_status_history(changed_by);





-- ===== setup/021_booking_service_photos.sql =====

-- =========================================================
-- FILE: 021_booking_service_photos.sql
-- MODULE: Booking / Service
-- PURPOSE: Before / during / after service photos
-- RUN AFTER: 018_bookings.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.booking_service_photos (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    booking_id UUID
        NOT NULL
        REFERENCES public.bookings(id)
        ON DELETE CASCADE,

    photo_type TEXT
        NOT NULL,

    photo_url TEXT
        NOT NULL,

    uploaded_by UUID
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    notes TEXT,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    CHECK (
        photo_type IN (
            'before',
            'during',
            'after',
            'damage',
            'other'
        )
    )
);


CREATE INDEX IF NOT EXISTS booking_service_photos_booking_idx
ON public.booking_service_photos(
    booking_id,
    photo_type
);


CREATE INDEX IF NOT EXISTS idx_booking_service_photos_uploaded_by
ON public.booking_service_photos(uploaded_by);





-- ===== setup/022_booking_service_checklist.sql =====

-- =========================================================
-- FILE: 022_booking_service_checklist.sql
-- MODULE: Booking / Service
-- PURPOSE: Track checklist completion for each booking
-- RUN AFTER:
--   012_service_checklist_items.sql
--   018_bookings.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.booking_service_checklist (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    booking_id UUID
        NOT NULL
        REFERENCES public.bookings(id)
        ON DELETE CASCADE,

    checklist_item_id UUID
        NOT NULL
        REFERENCES public.service_checklist_items(id)
        ON DELETE CASCADE,

    completed BOOLEAN
        NOT NULL
        DEFAULT FALSE,

    completed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    UNIQUE (
        booking_id,
        checklist_item_id
    )
);


CREATE INDEX IF NOT EXISTS idx_booking_checklist_booking
ON public.booking_service_checklist(booking_id);


CREATE INDEX IF NOT EXISTS idx_booking_checklist_item
ON public.booking_service_checklist(checklist_item_id);


CREATE INDEX IF NOT EXISTS idx_booking_checklist_completed
ON public.booking_service_checklist(
    booking_id,
    completed
);





-- ===== setup/023_extra_charge_requests.sql =====

-- =========================================================
-- FILE: 023_extra_charge_requests.sql
-- MODULE: Supervisor
-- PURPOSE: Additional charge approval workflow
-- RUN AFTER:
--   002_enums.sql
--   013_washers.sql
--   018_bookings.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.extra_charge_requests (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    booking_id UUID
        NOT NULL
        REFERENCES public.bookings(id)
        ON DELETE CASCADE,

    washer_id UUID
        NOT NULL
        REFERENCES public.washers(id)
        ON DELETE RESTRICT,

    reason TEXT
        NOT NULL,

    requested_amount NUMERIC(12,2)
        NOT NULL,

    status public.extra_charge_status
        NOT NULL
        DEFAULT 'pending',

    supervisor_id UUID
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    supervisor_note TEXT,

    customer_note TEXT,

    reviewed_at TIMESTAMPTZ,

    customer_responded_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    CHECK (requested_amount > 0)
);


CREATE INDEX IF NOT EXISTS idx_extra_charge_booking
ON public.extra_charge_requests(booking_id);


CREATE INDEX IF NOT EXISTS idx_extra_charge_washer
ON public.extra_charge_requests(washer_id);


CREATE INDEX IF NOT EXISTS idx_extra_charge_supervisor
ON public.extra_charge_requests(supervisor_id);


CREATE INDEX IF NOT EXISTS idx_extra_charge_status
ON public.extra_charge_requests(status);


CREATE INDEX IF NOT EXISTS idx_extra_charge_supervisor_status
ON public.extra_charge_requests(
    supervisor_id,
    status
);





-- ===== setup/024_payments.sql =====

-- =========================================================
-- FILE: 024_payments.sql
-- MODULE: Payment
-- PURPOSE: Customer booking payments
-- RUN AFTER:
--   002_enums.sql
--   004_customers.sql
--   018_bookings.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    booking_id UUID
        NOT NULL
        REFERENCES public.bookings(id)
        ON DELETE CASCADE,

    customer_id UUID
        NOT NULL
        REFERENCES public.customers(id)
        ON DELETE RESTRICT,

    amount NUMERIC(12,2)
        NOT NULL,

    payment_method public.payment_method
        NOT NULL,

    status public.payment_status
        NOT NULL
        DEFAULT 'pending',

    -- Example:
    -- razorpay
    -- stripe
    -- cash
    provider TEXT,

    provider_order_id TEXT,

    provider_payment_id TEXT,

    provider_signature TEXT,

    failure_reason TEXT,

    paid_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    CHECK (amount >= 0)
);


-- Booking payment lookup
CREATE INDEX IF NOT EXISTS idx_payments_booking
ON public.payments(booking_id);


-- Customer payment history
CREATE INDEX IF NOT EXISTS idx_payments_customer
ON public.payments(customer_id);


-- Payment status lookup
CREATE INDEX IF NOT EXISTS idx_payments_status
ON public.payments(status);


-- Booking + payment status
CREATE INDEX IF NOT EXISTS idx_payments_booking_status
ON public.payments(
    booking_id,
    status
);


-- Prevent duplicate provider order IDs
CREATE UNIQUE INDEX IF NOT EXISTS
idx_payments_provider_order_unique
ON public.payments(provider_order_id)
WHERE provider_order_id IS NOT NULL;


-- Prevent duplicate payment IDs
CREATE UNIQUE INDEX IF NOT EXISTS
idx_payments_provider_payment_unique
ON public.payments(provider_payment_id)
WHERE provider_payment_id IS NOT NULL;





-- ===== setup/025_washer_earnings.sql =====

-- =========================================================
-- FILE: 025_washer_earnings.sql
-- MODULE: Earnings
-- PURPOSE: Earnings generated by completed washer jobs
-- RUN AFTER:
--   013_washers.sql
--   018_bookings.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.washer_earnings (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    washer_id UUID
        NOT NULL
        REFERENCES public.washers(id)
        ON DELETE RESTRICT,

    booking_id UUID
        NOT NULL
        UNIQUE
        REFERENCES public.bookings(id)
        ON DELETE RESTRICT,

    gross_amount NUMERIC(12,2)
        NOT NULL,

    platform_commission NUMERIC(12,2)
        NOT NULL
        DEFAULT 0,

    washer_amount NUMERIC(12,2)
        NOT NULL,

    status TEXT
        NOT NULL
        DEFAULT 'pending',

    settled_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    CHECK (gross_amount >= 0),

    CHECK (platform_commission >= 0),

    CHECK (washer_amount >= 0),

    CHECK (
        platform_commission <= gross_amount
    ),

    CHECK (
        status IN (
            'pending',
            'approved',
            'settled',
            'held'
        )
    )
);


CREATE INDEX IF NOT EXISTS idx_washer_earnings_washer
ON public.washer_earnings(washer_id);


CREATE INDEX IF NOT EXISTS idx_washer_earnings_status
ON public.washer_earnings(status);


CREATE INDEX IF NOT EXISTS idx_washer_earnings_washer_status
ON public.washer_earnings(
    washer_id,
    status
);





-- ===== setup/026_washer_settlements.sql =====

-- =========================================================
-- FILE: 026_washer_settlements.sql
-- MODULE: Accountant / Washer
-- PURPOSE: Washer payout / settlement management
-- RUN AFTER:
--   003_profiles.sql
--   013_washers.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.washer_settlements (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    washer_id UUID
        NOT NULL
        REFERENCES public.washers(id)
        ON DELETE RESTRICT,

    amount NUMERIC(12,2)
        NOT NULL,

    status TEXT
        NOT NULL
        DEFAULT 'pending',

    payment_reference TEXT,

    processed_by UUID
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    processed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    CHECK (amount > 0),

    CHECK (
        status IN (
            'pending',
            'processing',
            'paid',
            'failed'
        )
    )
);


CREATE INDEX IF NOT EXISTS idx_washer_settlements_washer
ON public.washer_settlements(washer_id);


CREATE INDEX IF NOT EXISTS idx_washer_settlements_status
ON public.washer_settlements(status);


CREATE INDEX IF NOT EXISTS idx_washer_settlements_washer_status
ON public.washer_settlements(
    washer_id,
    status
);


CREATE INDEX IF NOT EXISTS idx_washer_settlements_processed_by
ON public.washer_settlements(processed_by);





-- ===== setup/027_reviews.sql =====

-- =========================================================
-- FILE: 027_reviews.sql
-- MODULE: Customer / Washer
-- PURPOSE: Customer review after service
-- RUN AFTER:
--   004_customers.sql
--   013_washers.sql
--   018_bookings.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    booking_id UUID
        NOT NULL
        UNIQUE
        REFERENCES public.bookings(id)
        ON DELETE CASCADE,

    customer_id UUID
        NOT NULL
        REFERENCES public.customers(id)
        ON DELETE CASCADE,

    washer_id UUID
        NOT NULL
        REFERENCES public.washers(id)
        ON DELETE CASCADE,

    rating INTEGER
        NOT NULL,

    comment TEXT,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    CHECK (
        rating BETWEEN 1 AND 5
    )
);


CREATE INDEX IF NOT EXISTS idx_reviews_customer
ON public.reviews(customer_id);


CREATE INDEX IF NOT EXISTS idx_reviews_washer
ON public.reviews(washer_id);


CREATE INDEX IF NOT EXISTS idx_reviews_washer_rating
ON public.reviews(
    washer_id,
    rating
);





-- ===== setup/028_notifications.sql =====

-- =========================================================
-- FILE: 028_notifications.sql
-- MODULE: Common
-- PURPOSE: Notifications for all application users
-- RUN AFTER: 003_profiles.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    user_id UUID
        NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    title TEXT
        NOT NULL,

    message TEXT
        NOT NULL,

    type TEXT,

    reference_id UUID,

    is_read BOOLEAN
        NOT NULL
        DEFAULT FALSE,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW()
);


CREATE INDEX IF NOT EXISTS idx_notifications_user
ON public.notifications(user_id);


CREATE INDEX IF NOT EXISTS idx_notifications_user_read
ON public.notifications(
    user_id,
    is_read
);


CREATE INDEX IF NOT EXISTS idx_notifications_user_created
ON public.notifications(
    user_id,
    created_at DESC
);


CREATE INDEX IF NOT EXISTS idx_notifications_reference
ON public.notifications(reference_id);





-- ===== setup/029_updated_at_function.sql =====

-- =========================================================
-- FILE: 029_updated_at_function.sql
-- MODULE: Common
-- PURPOSE: Automatically maintain updated_at timestamps
-- RUN AFTER: All main tables
-- =========================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;





-- ===== setup/030_updated_at_triggers.sql =====

-- =========================================================
-- FILE: 030_updated_at_triggers.sql
-- MODULE: Common
-- PURPOSE: Attach updated_at function to relevant tables
-- RUN AFTER: 029_updated_at_function.sql
-- =========================================================


-- PROFILES
DROP TRIGGER IF EXISTS profiles_updated_at
ON public.profiles;

CREATE TRIGGER profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- CUSTOMERS
DROP TRIGGER IF EXISTS customers_updated_at
ON public.customers;

CREATE TRIGGER customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- SOCIETIES
DROP TRIGGER IF EXISTS societies_updated_at
ON public.societies;

CREATE TRIGGER societies_updated_at
BEFORE UPDATE ON public.societies
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- SERVICE ZONES
DROP TRIGGER IF EXISTS service_zones_updated_at
ON public.service_zones;

CREATE TRIGGER service_zones_updated_at
BEFORE UPDATE ON public.service_zones
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- CUSTOMER ADDRESSES
DROP TRIGGER IF EXISTS customer_addresses_updated_at
ON public.customer_addresses;

CREATE TRIGGER customer_addresses_updated_at
BEFORE UPDATE ON public.customer_addresses
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- VEHICLES
DROP TRIGGER IF EXISTS vehicles_updated_at
ON public.vehicles;

CREATE TRIGGER vehicles_updated_at
BEFORE UPDATE ON public.vehicles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- SERVICES
DROP TRIGGER IF EXISTS services_updated_at
ON public.services;

CREATE TRIGGER services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- SERVICE PACKAGES
DROP TRIGGER IF EXISTS service_packages_updated_at
ON public.service_packages;

CREATE TRIGGER service_packages_updated_at
BEFORE UPDATE ON public.service_packages
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- WASHERS
DROP TRIGGER IF EXISTS washers_updated_at
ON public.washers;

CREATE TRIGGER washers_updated_at
BEFORE UPDATE ON public.washers
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- BOOKINGS
DROP TRIGGER IF EXISTS bookings_updated_at
ON public.bookings;

CREATE TRIGGER bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- EXTRA CHARGE REQUESTS
DROP TRIGGER IF EXISTS extra_charge_requests_updated_at
ON public.extra_charge_requests;

CREATE TRIGGER extra_charge_requests_updated_at
BEFORE UPDATE ON public.extra_charge_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- PAYMENTS
DROP TRIGGER IF EXISTS payments_updated_at
ON public.payments;

CREATE TRIGGER payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();





-- ===== setup/031_handle_new_user.sql =====

-- =========================================================
-- FILE: 031_handle_new_user.sql
-- MODULE: Authentication
-- PURPOSE:
--   Automatically create profile + customer after signup
-- RUN AFTER:
--   003_profiles.sql
--   004_customers.sql
-- =========================================================


CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_role public.user_role;
BEGIN

    -- -----------------------------------------------------
    -- SECURITY:
    -- Public signup always creates a CUSTOMER.
    --
    -- Do not trust raw_user_meta_data for admin/washer roles.
    -- Washer/Admin/Supervisor roles should be assigned later
    -- by trusted backend/admin logic.
    -- -----------------------------------------------------

    v_role := 'customer';


    INSERT INTO public.profiles (
        id,
        full_name,
        phone,
        role
    )
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data ->> 'full_name',
            ''
        ),
        NEW.raw_user_meta_data ->> 'phone',
        v_role
    )
    ON CONFLICT (id)
    DO NOTHING;


    INSERT INTO public.customers (
        user_id
    )
    VALUES (
        NEW.id
    )
    ON CONFLICT (user_id)
    DO NOTHING;


    RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS on_auth_user_created
ON auth.users;


CREATE TRIGGER on_auth_user_created
AFTER INSERT
ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();





-- ===== setup/032_booking_status_history_function.sql =====

-- =========================================================
-- FILE: 032_booking_status_history_function.sql
-- MODULE: Booking
-- PURPOSE:
--   Automatically record booking status changes
-- RUN AFTER:
--   018_bookings.sql
--   020_booking_status_history.sql
-- =========================================================


CREATE OR REPLACE FUNCTION public.log_booking_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN

    -- Booking created
    IF TG_OP = 'INSERT' THEN

        INSERT INTO public.booking_status_history (
            booking_id,
            status,
            changed_by,
            notes
        )
        VALUES (
            NEW.id,
            NEW.status,
            auth.uid(),
            'Booking created'
        );


    -- Existing booking status changed
    ELSIF TG_OP = 'UPDATE'
       AND OLD.status IS DISTINCT FROM NEW.status
    THEN

        INSERT INTO public.booking_status_history (
            booking_id,
            status,
            changed_by,
            notes
        )
        VALUES (
            NEW.id,
            NEW.status,
            auth.uid(),
            'Booking status changed from '
            || OLD.status::TEXT
            || ' to '
            || NEW.status::TEXT
        );

    END IF;


    RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS booking_status_history_trigger
ON public.bookings;


CREATE TRIGGER booking_status_history_trigger
AFTER INSERT OR UPDATE OF status
ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.log_booking_status();





-- ===== setup/033_find_washer_function.sql =====

-- =========================================================
-- FILE: 033_find_washer_function.sql
-- MODULE: Booking / Washer
-- PURPOSE:
--   Find an available verified washer and create assignment
-- RUN AFTER:
--   013_washers.sql
--   018_bookings.sql
--   019_booking_assignments.sql
-- =========================================================


CREATE OR REPLACE FUNCTION public.find_washer_for_booking(
    p_booking_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_customer_id UUID;
    v_washer_id UUID;
    v_assignment_id UUID;
BEGIN

    -- -----------------------------------------------------
    -- Verify that the booking belongs to current customer
    -- -----------------------------------------------------

    SELECT b.customer_id
    INTO v_customer_id
    FROM public.bookings b
    JOIN public.customers c
        ON c.id = b.customer_id
    WHERE b.id = p_booking_id
      AND c.user_id = auth.uid();


    IF v_customer_id IS NULL THEN
        RAISE EXCEPTION
            'Booking not found or not authorized';
    END IF;


    -- -----------------------------------------------------
    -- Prevent washer search for invalid booking states
    -- -----------------------------------------------------

    IF NOT EXISTS (
        SELECT 1
        FROM public.bookings b
        WHERE b.id = p_booking_id
          AND b.status IN (
              'pending',
              'confirmed',
              'finding_washer'
          )
    ) THEN
        RAISE EXCEPTION
            'Booking is not eligible for washer assignment';
    END IF;


    -- -----------------------------------------------------
    -- Find available + active + verified washer
    --
    -- Exclude washers already rejected/cancelled for
    -- this booking.
    -- -----------------------------------------------------

    SELECT w.id
    INTO v_washer_id
    FROM public.washers w
    WHERE w.status = 'available'
      AND w.is_active = TRUE
      AND w.is_verified = TRUE

      AND NOT EXISTS (
          SELECT 1
          FROM public.booking_assignments ba
          WHERE ba.booking_id = p_booking_id
            AND ba.washer_id = w.id
            AND ba.status IN (
                'rejected',
                'cancelled'
            )
      )

    ORDER BY
        w.rating DESC,
        w.jobs_completed DESC

    LIMIT 1;


    IF v_washer_id IS NULL THEN
        RAISE EXCEPTION 'No available washer';
    END IF;


    -- -----------------------------------------------------
    -- Change booking state
    -- -----------------------------------------------------

    UPDATE public.bookings
    SET status = 'finding_washer'
    WHERE id = p_booking_id;


    -- -----------------------------------------------------
    -- Create/update washer assignment
    -- -----------------------------------------------------

    INSERT INTO public.booking_assignments (
        booking_id,
        washer_id,
        status,
        expires_at
    )
    VALUES (
        p_booking_id,
        v_washer_id,
        'pending',
        NOW() + INTERVAL '2 minutes'
    )

    ON CONFLICT (
        booking_id,
        washer_id
    )

    DO UPDATE SET
        status = 'pending',
        offered_at = NOW(),
        responded_at = NULL,
        rejection_reason = NULL,
        expires_at =
            NOW() + INTERVAL '2 minutes'

    RETURNING id
    INTO v_assignment_id;


    RETURN v_assignment_id;

END;
$$;





-- ===== setup/034_accept_assignment_function.sql =====

-- =========================================================
-- FILE: 034_accept_assignment_function.sql
-- MODULE: Washer
-- PURPOSE: Washer accepts booking assignment
-- RUN AFTER:
--   013_washers.sql
--   018_bookings.sql
--   019_booking_assignments.sql
-- =========================================================


CREATE OR REPLACE FUNCTION public.accept_booking_assignment(
    p_assignment_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_washer_id UUID;
    v_booking_id UUID;
    v_assignment_status public.assignment_status;
    v_expires_at TIMESTAMPTZ;
BEGIN

    -- Lock assignment
    SELECT
        ba.washer_id,
        ba.booking_id,
        ba.status,
        ba.expires_at

    INTO
        v_washer_id,
        v_booking_id,
        v_assignment_status,
        v_expires_at

    FROM public.booking_assignments ba

    JOIN public.washers w
        ON w.id = ba.washer_id

    WHERE ba.id = p_assignment_id
      AND w.user_id = auth.uid()

    FOR UPDATE;


    IF v_booking_id IS NULL THEN
        RAISE EXCEPTION
            'Assignment not found or not authorized';
    END IF;


    IF v_assignment_status <> 'pending' THEN
        RAISE EXCEPTION
            'Assignment is no longer pending';
    END IF;


    -- Check expiry
    IF v_expires_at IS NOT NULL
       AND v_expires_at < NOW()
    THEN

        UPDATE public.booking_assignments
        SET
            status = 'expired',
            responded_at = NOW()
        WHERE id = p_assignment_id;

        RAISE EXCEPTION
            'Assignment has expired';
    END IF;


    -- Make sure booking hasn't already been assigned
    IF EXISTS (
        SELECT 1
        FROM public.bookings b
        WHERE b.id = v_booking_id
          AND b.assigned_washer_id IS NOT NULL
    ) THEN
        RAISE EXCEPTION
            'Booking already has an assigned washer';
    END IF;


    -- Accept selected assignment
    UPDATE public.booking_assignments
    SET
        status = 'accepted',
        responded_at = NOW()
    WHERE id = p_assignment_id;


    -- Cancel any other pending assignment
    UPDATE public.booking_assignments
    SET
        status = 'cancelled',
        responded_at = NOW()
    WHERE booking_id = v_booking_id
      AND id <> p_assignment_id
      AND status = 'pending';


    -- Assign washer
    UPDATE public.bookings
    SET
        assigned_washer_id = v_washer_id,
        status = 'washer_assigned'
    WHERE id = v_booking_id;


    -- Washer becomes busy
    UPDATE public.washers
    SET status = 'busy'
    WHERE id = v_washer_id;


    RETURN v_booking_id;

END;
$$;





-- ===== setup/035_reject_assignment_function.sql =====

-- =========================================================
-- FILE: 035_reject_assignment_function.sql
-- MODULE: Washer
-- PURPOSE: Washer rejects a booking assignment
-- RUN AFTER: 019_booking_assignments.sql
-- =========================================================


CREATE OR REPLACE FUNCTION public.reject_booking_assignment(
    p_assignment_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_booking_id UUID;
BEGIN

    -- Verify assignment belongs to current washer
    SELECT ba.booking_id
    INTO v_booking_id

    FROM public.booking_assignments ba

    JOIN public.washers w
        ON w.id = ba.washer_id

    WHERE ba.id = p_assignment_id
      AND w.user_id = auth.uid()
      AND ba.status = 'pending';


    IF v_booking_id IS NULL THEN
        RAISE EXCEPTION
            'Pending assignment not found or not authorized';
    END IF;


    UPDATE public.booking_assignments
    SET
        status = 'rejected',
        rejection_reason = p_reason,
        responded_at = NOW()
    WHERE id = p_assignment_id;


    RETURN v_booking_id;

END;
$$;





-- ===== setup/036_enable_rls.sql =====

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





-- ===== setup/037_profile_customer_rls.sql =====

-- =========================================================
-- FILE: 037_profile_customer_rls.sql
-- MODULE: Security / Customer
-- PURPOSE: Profile and customer RLS
-- RUN AFTER: 036_enable_rls.sql
-- =========================================================


-- =========================================================
-- PROFILES
-- =========================================================

DROP POLICY IF EXISTS "profiles_select_own"
ON public.profiles;

CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    id = auth.uid()
);


DROP POLICY IF EXISTS "profiles_update_own"
ON public.profiles;

CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
    id = auth.uid()
)
WITH CHECK (
    id = auth.uid()
);


-- =========================================================
-- CUSTOMERS
-- =========================================================

DROP POLICY IF EXISTS "customers_select_own"
ON public.customers;

CREATE POLICY "customers_select_own"
ON public.customers
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
);


DROP POLICY IF EXISTS "customers_update_own"
ON public.customers;

CREATE POLICY "customers_update_own"
ON public.customers
FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid()
)
WITH CHECK (
    user_id = auth.uid()
);





-- ===== setup/038_customer_address_vehicle_rls.sql =====

-- =========================================================
-- FILE: 038_customer_address_vehicle_rls.sql
-- MODULE: Security / Customer
-- PURPOSE:
--   Customer address and vehicle permissions
-- RUN AFTER: 036_enable_rls.sql
-- =========================================================


-- =========================================================
-- CUSTOMER ADDRESSES
-- =========================================================

DROP POLICY IF EXISTS "customer_addresses_select_own"
ON public.customer_addresses;

CREATE POLICY "customer_addresses_select_own"
ON public.customer_addresses
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = customer_addresses.customer_id
          AND c.user_id = auth.uid()
    )
);


DROP POLICY IF EXISTS "customer_addresses_insert_own"
ON public.customer_addresses;

CREATE POLICY "customer_addresses_insert_own"
ON public.customer_addresses
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = customer_addresses.customer_id
          AND c.user_id = auth.uid()
    )
);


DROP POLICY IF EXISTS "customer_addresses_update_own"
ON public.customer_addresses;

CREATE POLICY "customer_addresses_update_own"
ON public.customer_addresses
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = customer_addresses.customer_id
          AND c.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = customer_addresses.customer_id
          AND c.user_id = auth.uid()
    )
);


DROP POLICY IF EXISTS "customer_addresses_delete_own"
ON public.customer_addresses;

CREATE POLICY "customer_addresses_delete_own"
ON public.customer_addresses
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = customer_addresses.customer_id
          AND c.user_id = auth.uid()
    )
);


-- =========================================================
-- VEHICLES
-- =========================================================

DROP POLICY IF EXISTS "vehicles_select_own"
ON public.vehicles;

CREATE POLICY "vehicles_select_own"
ON public.vehicles
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = vehicles.customer_id
          AND c.user_id = auth.uid()
    )
);


DROP POLICY IF EXISTS "vehicles_insert_own"
ON public.vehicles;

CREATE POLICY "vehicles_insert_own"
ON public.vehicles
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = vehicles.customer_id
          AND c.user_id = auth.uid()
    )
);


DROP POLICY IF EXISTS "vehicles_update_own"
ON public.vehicles;

CREATE POLICY "vehicles_update_own"
ON public.vehicles
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = vehicles.customer_id
          AND c.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = vehicles.customer_id
          AND c.user_id = auth.uid()
    )
);


DROP POLICY IF EXISTS "vehicles_delete_own"
ON public.vehicles;

CREATE POLICY "vehicles_delete_own"
ON public.vehicles
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = vehicles.customer_id
          AND c.user_id = auth.uid()
    )
);





-- ===== setup/039_customer_booking_rls.sql =====

-- =========================================================
-- FILE: 039_customer_booking_rls.sql
-- MODULE: Security / Booking
-- PURPOSE: Customer booking permissions
-- RUN AFTER: 036_enable_rls.sql
-- =========================================================


-- =========================================================
-- BOOKINGS
-- =========================================================

DROP POLICY IF EXISTS "customers_select_own_bookings"
ON public.bookings;

CREATE POLICY "customers_select_own_bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = bookings.customer_id
          AND c.user_id = auth.uid()
    )
);


DROP POLICY IF EXISTS "customers_create_own_bookings"
ON public.bookings;

CREATE POLICY "customers_create_own_bookings"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = bookings.customer_id
          AND c.user_id = auth.uid()
    )

    AND EXISTS (
        SELECT 1
        FROM public.customer_addresses ca
        JOIN public.customers c
            ON c.id = ca.customer_id
        WHERE ca.id = bookings.address_id
          AND c.user_id = auth.uid()
    )

    AND EXISTS (
        SELECT 1
        FROM public.vehicles v
        JOIN public.customers c
            ON c.id = v.customer_id
        WHERE v.id = bookings.vehicle_id
          AND c.user_id = auth.uid()
    )
);


-- Customers should NOT have unrestricted UPDATE permission
-- on bookings.
--
-- Status transitions should be handled through controlled
-- RPC/backend operations.


-- =========================================================
-- BOOKING STATUS HISTORY
-- =========================================================

DROP POLICY IF EXISTS "customers_select_booking_history"
ON public.booking_status_history;

CREATE POLICY "customers_select_booking_history"
ON public.booking_status_history
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.bookings b
        JOIN public.customers c
            ON c.id = b.customer_id
        WHERE b.id = booking_status_history.booking_id
          AND c.user_id = auth.uid()
    )
);


-- =========================================================
-- BOOKING CHECKLIST
-- =========================================================

DROP POLICY IF EXISTS "customers_select_booking_checklist"
ON public.booking_service_checklist;

CREATE POLICY "customers_select_booking_checklist"
ON public.booking_service_checklist
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.bookings b
        JOIN public.customers c
            ON c.id = b.customer_id
        WHERE b.id = booking_service_checklist.booking_id
          AND c.user_id = auth.uid()
    )
);


-- =========================================================
-- BOOKING PHOTOS
-- =========================================================

DROP POLICY IF EXISTS "customers_select_booking_photos"
ON public.booking_service_photos;

CREATE POLICY "customers_select_booking_photos"
ON public.booking_service_photos
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.bookings b
        JOIN public.customers c
            ON c.id = b.customer_id
        WHERE b.id = booking_service_photos.booking_id
          AND c.user_id = auth.uid()
    )
);





-- ===== setup/040_washer_rls.sql =====

-- ========================================================= 
-- FILE: 040_washer_rls.sql 
-- MODULE: Security / Washer 
-- PURPOSE: Washer-specific permissions 
-- RUN AFTER: 036_enable_rls.sql 
-- ========================================================= 
 
 
-- ========================================================= 
-- WASHER PROFILE 
-- ========================================================= 
 
DROP POLICY IF EXISTS "washers_select_own" 
ON public.washers; 
 
CREATE POLICY "washers_select_own" 
ON public.washers 
FOR SELECT 
TO authenticated 
USING ( 
    user_id = auth.uid() 
); 
 
 
DROP POLICY IF EXISTS "washers_update_own" 
ON public.washers; 
 
CREATE POLICY "washers_update_own" 
ON public.washers 
FOR UPDATE 
TO authenticated 
USING ( 
    user_id = auth.uid() 
) 
WITH CHECK ( 
    user_id = auth.uid() 
); 
 
 
-- ========================================================= 
-- WASHER LOCATION 
-- ========================================================= 
 
DROP POLICY IF EXISTS "washers_select_own_location" 
ON public.washer_locations; 
 
CREATE POLICY "washers_select_own_location" 
ON public.washer_locations 
FOR SELECT 
TO authenticated 
USING ( 
    EXISTS ( 
        SELECT 1 
        FROM public.washers w 
        WHERE w.id = washer_locations.washer_id 
          AND w.user_id = auth.uid() 
    ) 
); 
 
 
DROP POLICY IF EXISTS "washers_insert_own_location" 
ON public.washer_locations; 
 
CREATE POLICY "washers_insert_own_location" 
ON public.washer_locations 
FOR INSERT 
TO authenticated 
WITH CHECK ( 
    EXISTS ( 
        SELECT 1 
        FROM public.washers w 
        WHERE w.id = washer_locations.washer_id 
          AND w.user_id = auth.uid() 
    ) 
); 
 
 
DROP POLICY IF EXISTS "washers_update_own_location" 
ON public.washer_locations; 
 
CREATE POLICY "washers_update_own_location" 
ON public.washer_locations 
FOR UPDATE 
TO authenticated 
USING ( 
    EXISTS ( 
        SELECT 1 
        FROM public.washers w 
        WHERE w.id = washer_locations.washer_id 
          AND w.user_id = auth.uid() 
    ) 
) 
WITH CHECK ( 
    EXISTS ( 
        SELECT 1 
        FROM public.washers w 
        WHERE w.id = washer_locations.washer_id 
          AND w.user_id = auth.uid() 
    ) 
); 
 
 
-- ========================================================= 
-- WASHER AVAILABILITY 
-- ========================================================= 
 
DROP POLICY IF EXISTS "washers_manage_own_availability" 
ON public.washer_availability; 
 
CREATE POLICY "washers_manage_own_availability" 
ON public.washer_availability 
FOR ALL 
TO authenticated 
USING ( 
    EXISTS ( 
        SELECT 1 
        FROM public.washers w 
        WHERE w.id = washer_availability.washer_id 
          AND w.user_id = auth.uid() 
    ) 
) 
WITH CHECK ( 
    EXISTS ( 
        SELECT 1 
        FROM public.washers w 
        WHERE w.id = washer_availability.washer_id 
          AND w.user_id = auth.uid() 
    ) 
); 
 
 
-- ========================================================= 
-- WASHER SKILLS 
-- Read-only for washer. 
-- Admin will manage skill assignment. 
-- ========================================================= 
 
DROP POLICY IF EXISTS "washers_select_own_skills" 
ON public.washer_skills; 
 
CREATE POLICY "washers_select_own_skills" 
ON public.washer_skills 
FOR SELECT 
TO authenticated 
USING ( 
    EXISTS ( 
        SELECT 1 
        FROM public.washers w 
        WHERE w.id = washer_skills.washer_id 
          AND w.user_id = auth.uid() 
    ) 
); 
 
 
-- ========================================================= 
-- WASHER BOOKINGS 
-- ========================================================= 
 
DROP POLICY IF EXISTS "washers_select_assigned_bookings" 
ON public.bookings; 
 
CREATE POLICY "washers_select_assigned_bookings" 
ON public.bookings 
FOR SELECT 
TO authenticated 
USING ( 
    EXISTS ( 
        SELECT 1 
        FROM public.washers w 
        WHERE w.id = bookings.assigned_washer_id 
          AND w.user_id = auth.uid() 
    ) 
); 
 
 
-- ========================================================= 
-- BOOKING ASSIGNMENTS 
-- ========================================================= 
 
DROP POLICY IF EXISTS "washers_select_own_assignments" 
ON public.booking_assignments; 
 
CREATE POLICY "washers_select_own_assignments" 
ON public.booking_assignments 
FOR SELECT 
TO authenticated 
USING ( 
    EXISTS ( 
        SELECT 1 
        FROM public.washers w 
        WHERE w.id = booking_assignments.washer_id 
          AND w.user_id = auth.uid() 
    ) 
); 
 
 
-- Accept/reject is handled by: 
-- 
-- accept_booking_assignment() 
-- reject_booking_assignment() 
-- 
-- Therefore no unrestricted UPDATE policy is provided. 
 
 
-- ========================================================= 
-- BOOKING HISTORY 
-- ========================================================= 
 
DROP POLICY IF EXISTS "washers_select_booking_history" 
ON public.booking_status_history; 
 
CREATE POLICY "washers_select_booking_history" 
ON public.booking_status_history 
FOR SELECT 
TO authenticated 
USING ( 
    EXISTS ( 
        SELECT 1 
        FROM public.bookings b 
        JOIN public.washers w 
            ON w.id = b.assigned_washer_id 
        WHERE b.id = booking_status_history.booking_id 
          AND w.user_id = auth.uid() 
    ) 
); 
 
 
-- ========================================================= 
-- BOOKING CHECKLIST 
-- ========================================================= 
 
DROP POLICY IF EXISTS "washers_select_booking_checklist" 
ON public.booking_service_checklist; 
 
CREATE POLICY "washers_select_booking_checklist" 
ON public.booking_service_checklist 
FOR SELECT 
TO authenticated 
USING ( 
    EXISTS ( 
        SELECT 1 
        FROM public.bookings b 
        JOIN public.washers w 
            ON w.id = b.assigned_washer_id 
        WHERE b.id = booking_service_checklist.booking_id 
          AND w.user_id = auth.uid() 
    ) 
); 
 
 
DROP POLICY IF EXISTS "washers_update_booking_checklist" 
ON public.booking_service_checklist; 
 
CREATE POLICY "washers_update_booking_checklist" 
ON public.booking_service_checklist 
FOR UPDATE 
TO authenticated 
USING ( 
    EXISTS ( 
        SELECT 1 
        FROM public.bookings b 
        JOIN public.washers w 
            ON w.id = b.assigned_washer_id 
        WHERE b.id = booking_service_checklist.booking_id 
          AND w.user_id = auth.uid() 
    ) 
) 
WITH CHECK ( 
    EXISTS ( 
        SELECT 1 
        FROM public.bookings b 
        JOIN public.washers w 
            ON w.id = b.assigned_washer_id 
        WHERE b.id = booking_service_checklist.booking_id 
          AND w.user_id = auth.uid() 
    ) 
);





-- ===== setup/041_service_society_rls.sql =====

-- =========================================================
-- FILE: 041_service_society_rls.sql
-- MODULE: Security / Common
-- PURPOSE: Read access to master/catalog data
-- RUN AFTER: 036_enable_rls.sql
-- =========================================================


-- =========================================================
-- SERVICES
-- =========================================================

DROP POLICY IF EXISTS "authenticated_read_active_services"
ON public.services;

CREATE POLICY "authenticated_read_active_services"
ON public.services
FOR SELECT
TO authenticated
USING (
    is_active = TRUE
);


-- =========================================================
-- SERVICE PACKAGES
-- =========================================================

DROP POLICY IF EXISTS "authenticated_read_active_packages"
ON public.service_packages;

CREATE POLICY "authenticated_read_active_packages"
ON public.service_packages
FOR SELECT
TO authenticated
USING (
    is_active = TRUE
);


-- =========================================================
-- SERVICE CHECKLIST ITEMS
-- =========================================================

DROP POLICY IF EXISTS "authenticated_read_checklist_items"
ON public.service_checklist_items;

CREATE POLICY "authenticated_read_checklist_items"
ON public.service_checklist_items
FOR SELECT
TO authenticated
USING (
    active = TRUE
);


-- =========================================================
-- SOCIETIES
-- =========================================================

DROP POLICY IF EXISTS "authenticated_read_active_societies"
ON public.societies;

CREATE POLICY "authenticated_read_active_societies"
ON public.societies
FOR SELECT
TO authenticated
USING (
    is_active = TRUE
);


-- =========================================================
-- SOCIETY TOWERS
-- =========================================================

DROP POLICY IF EXISTS "authenticated_read_active_towers"
ON public.society_towers;

CREATE POLICY "authenticated_read_active_towers"
ON public.society_towers
FOR SELECT
TO authenticated
USING (
    is_active = TRUE
);


-- =========================================================
-- SERVICE ZONES
-- =========================================================

DROP POLICY IF EXISTS "authenticated_read_active_zones"
ON public.service_zones;

CREATE POLICY "authenticated_read_active_zones"
ON public.service_zones
FOR SELECT
TO authenticated
USING (
    is_active = TRUE
);





-- ===== setup/042_payment_review_notification_rls.sql =====

-- =========================================================
-- FILE: 042_payment_review_notification_rls.sql
-- MODULE: Security
-- PURPOSE:
--   Payment, review, earnings and notification access
-- RUN AFTER: 036_enable_rls.sql
-- =========================================================


-- =========================================================
-- PAYMENTS
-- =========================================================

DROP POLICY IF EXISTS "customers_select_own_payments"
ON public.payments;

CREATE POLICY "customers_select_own_payments"
ON public.payments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = payments.customer_id
          AND c.user_id = auth.uid()
    )
);


-- Payment creation/verification should normally happen
-- through the trusted backend/payment webhook.
-- Therefore customers receive no direct INSERT/UPDATE
-- policy here.


-- =========================================================
-- REVIEWS
-- =========================================================

DROP POLICY IF EXISTS "customers_select_own_reviews"
ON public.reviews;

CREATE POLICY "customers_select_own_reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = reviews.customer_id
          AND c.user_id = auth.uid()
    )
);


DROP POLICY IF EXISTS "customers_create_own_reviews"
ON public.reviews;

CREATE POLICY "customers_create_own_reviews"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = reviews.customer_id
          AND c.user_id = auth.uid()
    )

    AND EXISTS (
        SELECT 1
        FROM public.bookings b
        JOIN public.customers c
            ON c.id = b.customer_id
        WHERE b.id = reviews.booking_id
          AND b.assigned_washer_id = reviews.washer_id
          AND c.user_id = auth.uid()
          AND b.status IN (
              'service_completed',
              'customer_confirmed',
              'payment_completed',
              'closed'
          )
    )
);


-- =========================================================
-- WASHER REVIEWS
-- =========================================================

DROP POLICY IF EXISTS "washers_select_own_reviews"
ON public.reviews;

CREATE POLICY "washers_select_own_reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.washers w
        WHERE w.id = reviews.washer_id
          AND w.user_id = auth.uid()
    )
);


-- =========================================================
-- WASHER EARNINGS
-- =========================================================

DROP POLICY IF EXISTS "washers_select_own_earnings"
ON public.washer_earnings;

CREATE POLICY "washers_select_own_earnings"
ON public.washer_earnings
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.washers w
        WHERE w.id = washer_earnings.washer_id
          AND w.user_id = auth.uid()
    )
);


-- =========================================================
-- WASHER SETTLEMENTS
-- =========================================================

DROP POLICY IF EXISTS "washers_select_own_settlements"
ON public.washer_settlements;

CREATE POLICY "washers_select_own_settlements"
ON public.washer_settlements
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.washers w
        WHERE w.id = washer_settlements.washer_id
          AND w.user_id = auth.uid()
    )
);


-- =========================================================
-- NOTIFICATIONS
-- =========================================================

DROP POLICY IF EXISTS "users_select_own_notifications"
ON public.notifications;

CREATE POLICY "users_select_own_notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
);


DROP POLICY IF EXISTS "users_update_own_notifications"
ON public.notifications;

CREATE POLICY "users_update_own_notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid()
)
WITH CHECK (
    user_id = auth.uid()
);





-- ===== setup/043_supervisor_rls.sql =====

-- =========================================================
-- FILE: 043_supervisor_rls.sql
-- MODULE: Security / Supervisor
-- PURPOSE: Supervisor workflow permissions
-- RUN AFTER: 036_enable_rls.sql
-- =========================================================


-- =========================================================
-- EXTRA CHARGE REQUESTS
-- =========================================================

DROP POLICY IF EXISTS "supervisors_select_extra_charges"
ON public.extra_charge_requests;

CREATE POLICY "supervisors_select_extra_charges"
ON public.extra_charge_requests
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'supervisor'
          AND p.is_active = TRUE
    )
);


DROP POLICY IF EXISTS "supervisors_update_extra_charges"
ON public.extra_charge_requests;

CREATE POLICY "supervisors_update_extra_charges"
ON public.extra_charge_requests
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'supervisor'
          AND p.is_active = TRUE
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'supervisor'
          AND p.is_active = TRUE
    )
);


-- =========================================================
-- SUPERVISOR BOOKINGS
-- =========================================================

DROP POLICY IF EXISTS "supervisors_select_bookings"
ON public.bookings;

CREATE POLICY "supervisors_select_bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'supervisor'
          AND p.is_active = TRUE
    )
);


-- =========================================================
-- SUPERVISOR WASHERS
-- =========================================================

DROP POLICY IF EXISTS "supervisors_select_washers"
ON public.washers;

CREATE POLICY "supervisors_select_washers"
ON public.washers
FOR SELECT
TO authenticated
USING (
    supervisor_id = auth.uid()
);





-- ===== setup/044_support_rls.sql =====

-- =========================================================
-- FILE: 044_support_rls.sql
-- MODULE: Security / Customer Support
-- PURPOSE: Support staff read permissions
-- RUN AFTER: 036_enable_rls.sql
-- =========================================================


DROP POLICY IF EXISTS "support_select_profiles"
ON public.profiles;

CREATE POLICY "support_select_profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles current_user_profile
        WHERE current_user_profile.id = auth.uid()
          AND current_user_profile.role = 'support'
          AND current_user_profile.is_active = TRUE
    )
);


DROP POLICY IF EXISTS "support_select_customers"
ON public.customers;

CREATE POLICY "support_select_customers"
ON public.customers
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'support'
          AND p.is_active = TRUE
    )
);


DROP POLICY IF EXISTS "support_select_bookings"
ON public.bookings;

CREATE POLICY "support_select_bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'support'
          AND p.is_active = TRUE
    )
);


DROP POLICY IF EXISTS "support_select_booking_history"
ON public.booking_status_history;

CREATE POLICY "support_select_booking_history"
ON public.booking_status_history
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'support'
          AND p.is_active = TRUE
    )
);





-- ===== setup/045_accountant_rls.sql =====

-- =========================================================
-- FILE: 045_accountant_rls.sql
-- MODULE: Security / Accountant
-- PURPOSE: Financial management permissions
-- RUN AFTER: 036_enable_rls.sql
-- =========================================================


-- PAYMENTS

DROP POLICY IF EXISTS "accountants_select_payments"
ON public.payments;

CREATE POLICY "accountants_select_payments"
ON public.payments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN (
              'accountant',
              'sub_admin'
          )
          AND p.is_active = TRUE
    )
);


-- WASHER EARNINGS

DROP POLICY IF EXISTS "accountants_select_earnings"
ON public.washer_earnings;

CREATE POLICY "accountants_select_earnings"
ON public.washer_earnings
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN (
              'accountant',
              'sub_admin'
          )
          AND p.is_active = TRUE
    )
);


-- WASHER SETTLEMENTS

DROP POLICY IF EXISTS "accountants_select_settlements"
ON public.washer_settlements;

CREATE POLICY "accountants_select_settlements"
ON public.washer_settlements
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN (
              'accountant',
              'sub_admin'
          )
          AND p.is_active = TRUE
    )
);


DROP POLICY IF EXISTS "accountants_create_settlements"
ON public.washer_settlements;

CREATE POLICY "accountants_create_settlements"
ON public.washer_settlements
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN (
              'accountant',
              'sub_admin'
          )
          AND p.is_active = TRUE
    )

    AND processed_by = auth.uid()
);


DROP POLICY IF EXISTS "accountants_update_settlements"
ON public.washer_settlements;

CREATE POLICY "accountants_update_settlements"
ON public.washer_settlements
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN (
              'accountant',
              'sub_admin'
          )
          AND p.is_active = TRUE
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN (
              'accountant',
              'sub_admin'
          )
          AND p.is_active = TRUE
    )
);





-- ===== setup/046_admin_rls.sql =====

-- =========================================================
-- FILE: 046_admin_rls.sql
-- MODULE: Security / Admin
-- PURPOSE:
--   Super Admin / Sub Admin management permissions
-- RUN AFTER: All previous RLS files
-- =========================================================


DO $$
DECLARE
    table_name TEXT;
    policy_name TEXT;
BEGIN

    FOREACH table_name IN ARRAY ARRAY[
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
    ]
    LOOP

        policy_name :=
            'admins_manage_' || table_name;


        EXECUTE format(
            'DROP POLICY IF EXISTS %I ON public.%I',
            policy_name,
            table_name
        );


        EXECUTE format(
            $policy$

            CREATE POLICY %I
            ON public.%I
            FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1
                    FROM public.profiles p
                    WHERE p.id = auth.uid()
                      AND p.role IN (
                          'super_admin',
                          'sub_admin'
                      )
                      AND p.is_active = TRUE
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1
                    FROM public.profiles p
                    WHERE p.id = auth.uid()
                      AND p.role IN (
                          'super_admin',
                          'sub_admin'
                      )
                      AND p.is_active = TRUE
                )
            )

            $policy$,
            policy_name,
            table_name
        );

    END LOOP;

END;
$$;

DROP POLICY IF EXISTS "admins_select_profiles"
ON public.profiles;

CREATE POLICY "admins_select_profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN (
              'super_admin',
              'sub_admin'
          )
          AND p.is_active = TRUE
    )
);





-- ===== setup/047_services_seed.sql =====

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





-- ===== setup/048_service_packages_seed.sql =====

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





-- ===== setup/049_service_checklist_seed.sql =====

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





-- ===== setup/050_final_database_verification.sql =====

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





-- ===== setup/051_supervisor_manual_assignment.sql =====

-- =========================================================
-- FILE: 051_supervisor_manual_assignment.sql
-- MODULE: Supervisor
-- PURPOSE: Manually assign an available washer to a booking
-- RUN AFTER:
--   013_washers.sql
--   018_bookings.sql
--   019_booking_assignments.sql
--   020_booking_status_history.sql
-- =========================================================

CREATE OR REPLACE FUNCTION public.supervisor_assign_washer(
    p_booking_id UUID,
    p_washer_id UUID,
    p_supervisor_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_booking public.bookings%ROWTYPE;
    v_washer public.washers%ROWTYPE;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    IF p_supervisor_id IS NULL THEN
        RAISE EXCEPTION 'Supervisor ID is required';
    END IF;

    -- Lock the booking to prevent simultaneous assignments.
    SELECT b.*
    INTO v_booking
    FROM public.bookings b
    WHERE b.id = p_booking_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found';
    END IF;

    IF v_booking.assigned_washer_id IS NOT NULL THEN
        RAISE EXCEPTION 'Booking already has an assigned washer';
    END IF;

    IF v_booking.requires_supervisor IS NOT TRUE THEN
        RAISE EXCEPTION 'Booking does not require supervisor assignment';
    END IF;

    IF v_booking.status NOT IN (
        'pending',
        'confirmed',
        'finding_washer',
        'support_escalated'
    ) THEN
        RAISE EXCEPTION 'Booking status does not allow assignment';
    END IF;

    -- Lock and validate the selected washer.
    SELECT w.*
    INTO v_washer
    FROM public.washers w
    WHERE w.id = p_washer_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Washer not found';
    END IF;

    IF v_washer.is_active IS NOT TRUE
       OR v_washer.is_verified IS NOT TRUE
       OR v_washer.status <> 'available'
    THEN
        RAISE EXCEPTION 'Washer is not eligible for assignment';
    END IF;

    -- Cancel competing pending offers.
    UPDATE public.booking_assignments
    SET
        status = 'cancelled',
        responded_at = v_now
    WHERE booking_id = p_booking_id
      AND status = 'pending'
      AND washer_id <> p_washer_id;

    -- Create or update the selected washer's assignment.
    INSERT INTO public.booking_assignments (
        booking_id,
        washer_id,
        status,
        attempt_number,
        offered_at,
        responded_at
    )
    VALUES (
        p_booking_id,
        p_washer_id,
        'accepted',
        1,
        v_now,
        v_now
    )
    ON CONFLICT (booking_id, washer_id)
    DO UPDATE SET
        status = 'accepted',
        responded_at = v_now,
        rejection_reason = NULL,
        expires_at = NULL;

    -- Assign the washer to the booking.
    UPDATE public.bookings
    SET
        assigned_washer_id = p_washer_id,
        status = 'washer_assigned',
        requires_supervisor = FALSE,
        updated_at = v_now
    WHERE id = p_booking_id;

    -- Mark the washer busy.
    UPDATE public.washers
    SET
        status = 'busy',
        updated_at = v_now
    WHERE id = p_washer_id;

    -- Record the assignment in booking history.
    INSERT INTO public.booking_status_history (
        booking_id,
        status,
        changed_by,
        notes,
        created_at
    )
    VALUES (
        p_booking_id,
        'washer_assigned',
        p_supervisor_id,
        'Washer manually assigned by supervisor',
        v_now
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'booking_id', p_booking_id,
        'washer_id', p_washer_id,
        'status', 'washer_assigned'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.supervisor_assign_washer(
    UUID, UUID, UUID
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.supervisor_assign_washer(
    UUID, UUID, UUID
) TO service_role;



-- ===== migrations/20261012101500_add_washer_commission_percent.sql =====

alter table public.service_packages
add column if not exists washer_commission_percent numeric(5,2)
not null default 70;





-- ===== migrations/20261012170000_fix_profiles_rls_recursion.sql =====

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select profile.role::text
  from public.profiles as profile
  where profile.id = (select auth.uid())
  limit 1;
$$;

revoke all on function public.current_profile_role() from public;
grant execute on function public.current_profile_role() to authenticated;

do $$
declare
  recursive_policy record;
begin
  for recursive_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and cmd in ('SELECT', 'ALL')
      and (
        coalesce(qual, '') ilike '%profiles%'
        or coalesce(with_check, '') ilike '%profiles%'
      )
  loop
    execute format(
      'drop policy %I on public.profiles',
      recursive_policy.policyname
    );
  end loop;
end;
$$;

drop policy if exists profiles_select_own_or_supervisor
  on public.profiles;

create policy profiles_select_own_or_supervisor
  on public.profiles
  for select
  to authenticated
  using (
    (select auth.uid()) = id
    or (select public.current_profile_role()) = 'supervisor'
  );





-- ===== migrations/20261012171000_provision_profiles_for_auth_users.sql =====

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    phone,
    role
  )
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(new.email, '@', 1)
    ),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'phone', ''),
      ''
    ),
    (case
      when new.raw_app_meta_data ->> 'role' in (
        'customer',
        'washer',
        'supervisor',
        'support',
        'accountant',
        'sub_admin',
        'super_admin'
      )
        then new.raw_app_meta_data ->> 'role'
      else 'customer'
    end)::public.user_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public;

drop trigger if exists create_profile_for_new_auth_user
  on auth.users;

create trigger create_profile_for_new_auth_user
  after insert on auth.users
  for each row
  execute function public.handle_new_auth_user();

insert into public.profiles (
  id,
  full_name,
  phone,
  role
)
select
  auth_user.id,
  coalesce(
    nullif(auth_user.raw_user_meta_data ->> 'full_name', ''),
    split_part(auth_user.email, '@', 1)
  ),
  coalesce(
    nullif(auth_user.raw_user_meta_data ->> 'phone', ''),
    ''
  ),
  (case
    when auth_user.raw_app_meta_data ->> 'role' in (
      'customer',
      'washer',
      'supervisor',
      'support',
      'accountant',
      'sub_admin',
      'super_admin'
    )
      then auth_user.raw_app_meta_data ->> 'role'
    else 'customer'
  end)::public.user_role
from auth.users as auth_user
on conflict (id) do nothing;





-- ===== migrations/20261012172000_add_booking_flat_number.sql =====

alter table public.bookings
add column if not exists flat_number text;





-- ===== migrations/20261012173000_add_booking_landmark.sql =====

alter table public.bookings
add column if not exists landmark text;





-- ===== migrations/20261012174000_add_booking_coordinates.sql =====

alter table public.bookings
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;





-- ===== migrations/20261012175000_add_booking_payment_method.sql =====

alter table public.bookings
add column if not exists payment_method text;





-- ===== migrations/20261012180000_add_booking_platform_fee.sql =====

alter table public.bookings
add column if not exists platform_fee numeric(10, 2) not null default 0;





-- ===== migrations/20261012181000_add_booking_scheduled_time.sql =====

alter table public.bookings
add column if not exists scheduled_time time without time zone;





-- ===== migrations/20261012182000_add_booking_service_address.sql =====

alter table public.bookings
add column if not exists service_address text;





-- ===== migrations/20261012183000_add_booking_service_amount.sql =====

alter table public.bookings
  add column if not exists service_amount numeric(10, 2) not null default 0,
  add column if not exists discount_amount numeric(10, 2) not null default 0,
  add column if not exists total_amount numeric(10, 2) not null default 0;





-- ===== migrations/20261012184000_add_booking_tower.sql =====

alter table public.bookings
add column if not exists tower text;





-- ===== migrations/20261012185000_allow_customers_to_create_bookings.sql =====

drop policy if exists customers_insert_own_bookings
  on public.bookings;

create policy customers_insert_own_bookings
  on public.bookings
  for insert
  to authenticated
  with check (
    customer_id = (select auth.uid())
  );





-- ===== migrations/20261012190000_fix_customer_booking_insert_policy.sql =====

create or replace function public.current_customer_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select customer.id
  from public.customers as customer
  where customer.user_id = (select auth.uid())
  limit 1;
$$;

revoke all on function public.current_customer_id() from public;
grant execute on function public.current_customer_id() to authenticated;

drop policy if exists customers_insert_own_bookings
  on public.bookings;

create policy customers_insert_own_bookings
  on public.bookings
  for insert
  to authenticated
  with check (
    customer_id = (select public.current_customer_id())
  );





-- ===== migrations/20261012191000_make_booking_address_id_optional.sql =====

alter table public.bookings
alter column address_id drop not null;





-- ===== migrations/20261012192000_enable_customer_booking_realtime.sql =====

drop policy if exists customers_select_own_bookings
  on public.bookings;

create policy customers_select_own_bookings
  on public.bookings
  for select
  to authenticated
  using (
    customer_id = (select public.current_customer_id())
  );

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'bookings'
  ) then
    alter publication supabase_realtime
      add table public.bookings;
  end if;
end;
$$;





-- ===== migrations/20261013100000_add_booking_service_lifecycle_fields.sql =====

alter table public.bookings
  add column if not exists service_otp_hash text,
  add column if not exists service_otp_expires_at timestamptz,
  add column if not exists washer_arrived_at timestamptz,
  add column if not exists otp_verified_at timestamptz,
  add column if not exists service_started_at timestamptz,
  add column if not exists service_completed_at timestamptz,
  add column if not exists service_validated_at timestamptz,
  add column if not exists service_validated_by uuid,
  add column if not exists service_validated_role text,
  add column if not exists completed_at timestamptz;





-- ===== migrations/20261013110000_create_support_tickets.sql =====

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique default (
    'SUP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
  ),
  created_by uuid not null references auth.users(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  issue_type text not null check (
    issue_type in (
      'booking_issue',
      'washer_issue',
      'payment_issue',
      'refund_request',
      'service_quality',
      'additional_charge',
      'other'
    )
  ),
  subject text not null check (char_length(subject) between 3 and 160),
  description text not null check (char_length(description) between 10 and 5000),
  status text not null default 'open' check (
    status in ('open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed')
  ),
  priority text not null default 'normal' check (
    priority in ('low', 'normal', 'high', 'urgent')
  ),
  assigned_to uuid references auth.users(id) on delete set null,
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists support_tickets_created_by_created_at_idx
  on public.support_tickets (created_by, created_at desc);

create index if not exists support_tickets_status_created_at_idx
  on public.support_tickets (status, created_at desc);

create index if not exists support_tickets_booking_id_idx
  on public.support_tickets (booking_id)
  where booking_id is not null;

create function public.set_support_ticket_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  if new.status = 'resolved' and old.status is distinct from 'resolved' then
    new.resolved_at = now();
  elsif new.status <> 'resolved' then
    new.resolved_at = null;
  end if;
  return new;
end;
$$;

drop trigger if exists support_tickets_set_updated_at on public.support_tickets;
create trigger support_tickets_set_updated_at
  before update on public.support_tickets
  for each row execute function public.set_support_ticket_updated_at();

alter table public.support_tickets enable row level security;

drop policy if exists "Users can create their own support tickets" on public.support_tickets;
create policy "Users can create their own support tickets"
  on public.support_tickets for insert to authenticated
  with check (created_by = (select auth.uid()));

drop policy if exists "Users can read their own support tickets" on public.support_tickets;
create policy "Users can read their own support tickets"
  on public.support_tickets for select to authenticated
  using (
    created_by = (select auth.uid())
    or (select public.current_profile_role()) in ('support', 'supervisor', 'sub_admin', 'super_admin')
  );

drop policy if exists "Support staff can update support tickets" on public.support_tickets;
create policy "Support staff can update support tickets"
  on public.support_tickets for update to authenticated
  using ((select public.current_profile_role()) in ('support', 'supervisor', 'sub_admin', 'super_admin'))
  with check ((select public.current_profile_role()) in ('support', 'supervisor', 'sub_admin', 'super_admin'));

grant select, insert, update on public.support_tickets to authenticated;





-- ===== migrations/20261013120000_add_atomic_booking_assignment_rpcs.sql =====

-- Transactional replacement supports the supplied UUID-returning legacy RPC.
BEGIN;
DROP FUNCTION IF EXISTS public.accept_booking_assignment(uuid);
create or replace function public.booking_washer_is_eligible(
  p_booking_id uuid,
  p_washer_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_booking record;
  v_washer record;
  v_location record;
  v_package record;
  v_distance_km double precision;
  v_conflict boolean;
begin
  select id, status, assigned_washer_id, package_id, scheduled_date,
         scheduled_start_time, latitude, longitude
    into v_booking
    from public.bookings
   where id = p_booking_id;

  if not found
     or v_booking.assigned_washer_id is not null
     or v_booking.status not in ('pending', 'confirmed', 'finding_washer', 'support_escalated')
     or v_booking.scheduled_date is null
     or v_booking.scheduled_start_time is null
     or v_booking.latitude is null
     or v_booking.longitude is null then
    return false;
  end if;

  select id, status, is_active, is_verified, service_radius_km
    into v_washer
    from public.washers
   where id = p_washer_id;

  if not found or not v_washer.is_active or not v_washer.is_verified or v_washer.status <> 'available' then
    return false;
  end if;

  select latitude, longitude, updated_at
    into v_location
    from public.washer_locations
   where washer_id = p_washer_id;

  if not found
     or v_location.updated_at is null
     or v_location.latitude is null
     or v_location.longitude is null
     or v_location.latitude not between -90 and 90
     or v_location.longitude not between -180 and 180
     or v_location.updated_at < now() - interval '15 minutes' then
    return false;
  end if;

  v_distance_km := 2 * 6371 * asin(sqrt(least(1::double precision, greatest(0::double precision,
    power(sin(radians((v_location.latitude - v_booking.latitude) / 2)), 2) +
    cos(radians(v_booking.latitude)) * cos(radians(v_location.latitude)) *
    power(sin(radians((v_location.longitude - v_booking.longitude) / 2)), 2)
  ))));

  if v_distance_km > coalesce(nullif(v_washer.service_radius_km, 0), 5) then
    return false;
  end if;

  select service_id, duration_minutes
    into v_package
    from public.service_packages
   where id = v_booking.package_id;

  if found and v_package.service_id is not null and not exists (
    select 1 from public.washer_skills
     where washer_id = p_washer_id
       and service_id = v_package.service_id
  ) then
    return false;
  end if;

  if not exists (
    select 1 from public.washer_availability a
    where a.washer_id = p_washer_id and a.is_available
      and a.day_of_week = extract(dow from v_booking.scheduled_date)
      and a.start_time <= v_booking.scheduled_start_time
      and v_booking.scheduled_date + a.end_time >= v_booking.scheduled_date + v_booking.scheduled_start_time + make_interval(mins => coalesce(v_package.duration_minutes,60))
  ) then return false; end if;

  select exists (
    select 1
      from public.bookings existing
      left join public.service_packages existing_package
        on existing_package.id = existing.package_id
     where existing.assigned_washer_id = p_washer_id
       and existing.id <> p_booking_id
       and existing.status in (
         'washer_assigned', 'washer_on_the_way', 'washer_arrived',
         'otp_verified', 'service_started', 'service_completed'
       )
       and existing.scheduled_date is not null
       and existing.scheduled_start_time is not null
       and (
         v_booking.scheduled_date::date + v_booking.scheduled_start_time::time
       ) < (
         existing.scheduled_date::date + existing.scheduled_start_time::time
         + make_interval(mins => coalesce(existing_package.duration_minutes, 60))
       )
       and (
         existing.scheduled_date::date + existing.scheduled_start_time::time
       ) < (
         v_booking.scheduled_date::date + v_booking.scheduled_start_time::time
         + make_interval(mins => coalesce(v_package.duration_minutes, 60))
       )
  ) into v_conflict;

  return not v_conflict;
end;
$$;

create or replace function public.accept_booking_assignment(p_assignment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_washer_id uuid;
  v_assignment public.booking_assignments%rowtype;
  v_booking public.bookings%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required.' using errcode = '28000';
  end if;

  select id into v_washer_id
    from public.washers
   where user_id = v_user_id
     and is_active = true;
  if not found then
    raise exception 'Active washer profile not found.' using errcode = '42501';
  end if;

  -- Read the immutable booking reference, then lock booking -> washer -> offer.
  select * into v_assignment from public.booking_assignments where id = p_assignment_id;
  if not found or v_assignment.washer_id <> v_washer_id then
    raise exception 'Assignment not found.' using errcode = '42501';
  end if;
  select * into v_booking from public.bookings where id = v_assignment.booking_id for update;
  if v_booking.status::text = 'pending' then raise exception 'Supervisor review is required before washer acceptance.'; end if;
  perform 1 from public.washers where id = v_washer_id for update;
  select * into v_assignment from public.booking_assignments where id = p_assignment_id for update;
  if not found or v_assignment.status <> 'pending' or v_assignment.expires_at is null or v_assignment.expires_at <= now() then
    raise exception 'Assignment is no longer available.' using errcode = '40001';
  end if;
  if not public.booking_washer_is_eligible(v_booking.id, v_washer_id) then
    raise exception 'Booking is no longer eligible for this washer.' using errcode = '40001';
  end if;

  update public.bookings
     set assigned_washer_id = v_washer_id,
         status = 'washer_assigned',
         requires_supervisor = false,
         updated_at = now()
   where id = v_booking.id
   returning * into v_booking;

  update public.booking_assignments
     set status = 'accepted',
         responded_at = now()
   where id = v_assignment.id
   returning * into v_assignment;

  update public.washers set status = 'busy' where id = v_booking.assigned_washer_id;
  update public.booking_assignments set status = 'cancelled', responded_at = now()
    where booking_id = v_booking.id and id <> v_assignment.id and status = 'pending';
  return jsonb_build_object(
    'booking', to_jsonb(v_booking),
    'assignment', to_jsonb(v_assignment)
  );
end;
$$;

create or replace function public.supervisor_assign_washer(
  p_booking_id uuid,
  p_washer_id uuid,
  p_supervisor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_role text;
  v_booking public.bookings%rowtype;
  v_assignment public.booking_assignments%rowtype;
  v_has_assignment boolean := false;
  v_location record;
  v_distance_km double precision;
  v_attempt_number integer;
begin
  select role into v_role
    from public.profiles
   where id = p_supervisor_id and is_active = true;
  if v_role is null or v_role not in ('supervisor', 'sub_admin', 'super_admin') then
    raise exception 'Supervisor permission required.' using errcode = '42501';
  end if;

  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'Booking not found.' using errcode = 'P0002'; end if;
  perform 1 from public.washers where id = p_washer_id for update;
  if not found then raise exception 'Washer not found.' using errcode = 'P0002'; end if;
  select * into v_assignment from public.booking_assignments
    where booking_id = p_booking_id and washer_id = p_washer_id for update;
  v_has_assignment := found;

  if not public.booking_washer_is_eligible(p_booking_id, p_washer_id) then
    raise exception 'Washer is no longer eligible for this booking.' using errcode = '40001';
  end if;

  select latitude, longitude into v_location
    from public.washer_locations
   where washer_id = p_washer_id;
  v_distance_km := 2 * 6371 * asin(sqrt(
    power(sin(radians((v_location.latitude - v_booking.latitude) / 2)), 2) +
    cos(radians(v_booking.latitude)) * cos(radians(v_location.latitude)) *
    power(sin(radians((v_location.longitude - v_booking.longitude) / 2)), 2)
  ));

  update public.bookings
     set assigned_washer_id = p_washer_id,
         status = 'washer_assigned',
         requires_supervisor = false,
         updated_at = now()
   where id = p_booking_id
   returning * into v_booking;

  if v_has_assignment then
    update public.booking_assignments
       set status = 'accepted',
           responded_at = now(),
           rejection_reason = null
     where id = v_assignment.id
     returning * into v_assignment;
  else
    select coalesce(max(attempt_number), 0) + 1
      into v_attempt_number
      from public.booking_assignments
     where booking_id = p_booking_id;

    insert into public.booking_assignments (
      booking_id, washer_id, status, distance_km, attempt_number,
      offered_at, expires_at, responded_at, rejection_reason
    ) values (
      p_booking_id, p_washer_id, 'accepted', round(v_distance_km::numeric, 2),
      v_attempt_number, now(), now(), now(), null
    )
    returning * into v_assignment;
  end if;

  update public.washers set status = 'busy' where id = v_booking.assigned_washer_id;
  update public.booking_assignments set status = 'cancelled', responded_at = now()
    where booking_id = v_booking.id and id <> v_assignment.id and status = 'pending';
  return jsonb_build_object(
    'booking', to_jsonb(v_booking),
    'assignment', to_jsonb(v_assignment)
  );
end;
$$;

revoke all on function public.booking_washer_is_eligible(uuid, uuid) from public, anon, authenticated;
revoke all on function public.accept_booking_assignment(uuid) from public, anon;
revoke all on function public.supervisor_assign_washer(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.accept_booking_assignment(uuid) to authenticated;
grant execute on function public.booking_washer_is_eligible(uuid, uuid) to service_role;
grant execute on function public.supervisor_assign_washer(uuid, uuid, uuid) to service_role;

COMMIT;





-- ===== migrations/20261013130000_make_extra_charge_approval_atomic.sql =====

alter table public.extra_charge_requests
  add column if not exists customer_responded_at timestamptz,
  add column if not exists supervisor_id uuid references auth.users(id) on delete set null,
  add column if not exists supervisor_note text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.bookings
  add column if not exists extra_charge numeric(10, 2) not null default 0;

create or replace function public.respond_extra_charge(
  p_request_id uuid,
  p_booking_id uuid,
  p_customer_user_id uuid,
  p_action text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_customer_id uuid;
  v_request public.extra_charge_requests%rowtype;
  v_booking public.bookings%rowtype;
  v_extra numeric;
  v_total numeric;
begin
  if p_action not in ('approve', 'reject') then
    raise exception 'Invalid action.' using errcode = '22023';
  end if;

  select id into v_customer_id
    from public.customers
   where user_id = p_customer_user_id;
  if not found then
    raise exception 'Customer profile not found.' using errcode = '42501';
  end if;

  select * into v_request
    from public.extra_charge_requests
   where id = p_request_id
   for update;
  if not found then
    raise exception 'Extra charge request not found.' using errcode = 'P0002';
  end if;

  select * into v_booking
    from public.bookings
   where id = v_request.booking_id
   for update;
  if not found or v_booking.customer_id <> v_customer_id then
    raise exception 'Booking not found.' using errcode = '42501';
  end if;

  if v_request.booking_id <> p_booking_id then
    raise exception 'Extra charge request does not belong to this booking.' using errcode = '42501';
  end if;

  if v_request.status is distinct from 'approved' then
    raise exception 'Extra charge is no longer awaiting customer approval.' using errcode = '40001';
  end if;

  if p_action = 'reject' then
    update public.extra_charge_requests
       set status = 'customer_rejected',
           customer_responded_at = now(),
           updated_at = now()
     where id = p_request_id
     returning * into v_request;
    return jsonb_build_object('approved', false, 'request', to_jsonb(v_request));
  end if;

  if v_request.requested_amount is null or v_request.requested_amount <= 0 then
    raise exception 'Extra charge amount is invalid.' using errcode = '22023';
  end if;

  update public.bookings
     set extra_charge = coalesce(extra_charge, 0) + v_request.requested_amount,
         total_amount = coalesce(total_amount, 0) + v_request.requested_amount,
         updated_at = now()
   where id = v_booking.id
   returning extra_charge, total_amount into v_extra, v_total;

  update public.extra_charge_requests
     set status = 'customer_approved',
         customer_responded_at = now(),
         updated_at = now()
   where id = p_request_id
   returning * into v_request;

  return jsonb_build_object(
    'approved', true,
    'extraCharge', v_extra,
    'totalAmount', v_total,
    'request', to_jsonb(v_request)
  );
end;
$$;

revoke all on function public.respond_extra_charge(uuid, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.respond_extra_charge(uuid, uuid, uuid, text) to service_role;





-- ===== migrations/20261013150000_finance_operations.sql =====

-- New migration: apply after the previously supplied migrations.
create table if not exists public.finance_operations (
 id uuid primary key, kind text not null check(kind in ('refund','payout')),
 payment_id uuid references public.payments(id), washer_id uuid references public.washers(id),
 amount_paise bigint not null check(amount_paise > 0), currency text not null default 'INR',
 reason text not null, status text not null default 'reserved', provider_id text unique,
 provider_request jsonb not null, provider_status text, processed_at timestamptz, created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.finance_payout_items (
 operation_id uuid not null references public.finance_operations(id),
 earning_id uuid primary key references public.washer_earnings(id)
);
create table if not exists public.washer_payout_accounts (
 washer_id uuid primary key references public.washers(id), fund_account_id text not null,
 account_label text not null, updated_by uuid not null references auth.users(id), updated_at timestamptz not null default now()
);
create table if not exists public.booking_invoices (
 id uuid primary key default gen_random_uuid(), booking_id uuid not null unique references public.bookings(id),
 invoice_number bigint generated always as identity unique, snapshot jsonb not null,
 created_at timestamptz not null default now()
);
alter table public.finance_operations enable row level security;
alter table public.finance_payout_items enable row level security;
alter table public.washer_payout_accounts enable row level security;
alter table public.booking_invoices enable row level security;
revoke all on public.finance_operations, public.finance_payout_items, public.washer_payout_accounts, public.booking_invoices from anon, authenticated;
grant all on public.finance_operations, public.finance_payout_items, public.washer_payout_accounts, public.booking_invoices to service_role;
grant usage, select on sequence public.booking_invoices_invoice_number_seq to service_role;

create or replace function public.reserve_finance_operation(p_id uuid, p_kind text, p_target uuid, p_amount bigint, p_reason text, p_actor uuid, p_account_number text default null)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare op public.finance_operations%rowtype; pay public.payments%rowtype; total bigint; fund text; ids uuid[];
begin
 -- Serialize reservations and reconciliation across processes, not just one Express instance.
 perform pg_advisory_xact_lock(73619842);
 if not exists(select 1 from profiles where id=p_actor and role in ('accountant','sub_admin','super_admin') and is_active) then raise exception 'Finance role required.'; end if;
 if p_reason is null or length(trim(p_reason)) < 3 or length(p_reason)>500 then raise exception 'A reason is required.'; end if;
 select * into op from finance_operations where id=p_id;
 if found then
   if op.kind<>p_kind or op.reason<>p_reason or (p_kind='refund' and (op.payment_id<>p_target or op.amount_paise<>p_amount)) or (p_kind='payout' and op.washer_id<>p_target) then raise exception 'Idempotency key already used for another request.'; end if;
   return to_jsonb(op);
 end if;
 if p_kind='refund' then
   select * into pay from payments where id=p_target for update;
   if not found or pay.status<>'paid' or pay.provider<>'razorpay' or pay.provider_payment_id is null then raise exception 'A captured Razorpay payment is required.'; end if;
   if not exists(select 1 from bookings where id=pay.booking_id and status in ('completed','closed','payment_completed','customer_confirmed','cancelled')) then raise exception 'Cancel or complete the booking before refunding.'; end if;
   if exists(select 1 from finance_payout_items i join washer_earnings e on e.id=i.earning_id join finance_operations o on o.id=i.operation_id where e.booking_id=pay.booking_id and o.status<>'processed') then raise exception 'This booking has a payout reservation. Reconcile that payout before refunding.'; end if;
   select coalesce(sum(amount_paise),0) into total from finance_operations where payment_id=p_target and kind='refund' and status not in ('failed');
   if p_amount is null or p_amount<100 or p_amount+total>round(pay.amount*100) then raise exception 'Refund exceeds the remaining paid amount or is less than INR 1.'; end if;
   insert into finance_operations(id,kind,payment_id,amount_paise,reason,created_by,provider_request)
   values(p_id,p_kind,p_target,p_amount,p_reason,p_actor,jsonb_build_object('payment_id',pay.provider_payment_id,'amount',p_amount,'speed','normal','receipt',p_id::text)) returning * into op;
 elsif p_kind='payout' then
   select fund_account_id into fund from washer_payout_accounts where washer_id=p_target;
   if fund is null or p_account_number is null or length(p_account_number)<3 then raise exception 'Configure a verified fund account and RazorpayX account first.'; end if;
   if not exists(select 1 from washers where id=p_target and is_active and is_verified) then raise exception 'An active verified washer is required.'; end if;
   select array_agg(e.id),sum(round(e.washer_amount*100)) into ids,total
   from washer_earnings e join bookings b on b.id=e.booking_id
   where e.washer_id=p_target and e.status='pending' and e.washer_amount>0
   and b.status in ('completed','closed','payment_completed','customer_confirmed')
   and not exists(select 1 from finance_payout_items i where i.earning_id=e.id)
   and exists(select 1 from payments p where p.booking_id=b.id and p.status='paid' and p.provider='razorpay' and p.amount>=b.total_amount)
   and not exists(select 1 from finance_operations r join payments p on p.id=r.payment_id where p.booking_id=b.id and r.kind='refund' and r.status<>'failed');
   if total is null or total<100 then raise exception 'No eligible online-paid earnings (minimum INR 1). Cash collections are reconciled separately.'; end if;
   insert into finance_operations(id,kind,washer_id,amount_paise,reason,created_by,provider_request)
   values(p_id,p_kind,p_target,total,p_reason,p_actor,jsonb_build_object('account_number',p_account_number,'fund_account_id',fund,'amount',total,'currency','INR','mode','IMPS','purpose','payout','queue_if_low_balance',true,'reference_id',p_id::text)) returning * into op;
   insert into finance_payout_items(operation_id,earning_id) select p_id,unnest(ids);
 else raise exception 'Invalid operation.';
 end if;
 return to_jsonb(op);
end $$;

create or replace function public.reconcile_finance_operation(p_id uuid, p_provider_id text, p_status text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare op public.finance_operations%rowtype;
begin
 perform pg_advisory_xact_lock(73619842);
 select * into op from finance_operations where id=p_id for update;
 if not found then raise exception 'Operation not found.'; end if;
 if op.provider_id is not null and op.provider_id<>p_provider_id then raise exception 'Provider reference mismatch.'; end if;
 if op.status='failed' then return to_jsonb(op); end if;
 if op.status='processed' and not (op.kind='payout' and p_status='reversed') then return to_jsonb(op); end if;
 if p_status not in ('created','pending','queued','processing','processed','failed','rejected','cancelled','reversed') then raise exception 'Unknown provider status.'; end if;
 update finance_operations set provider_id=p_provider_id,provider_status=p_status,
 processed_at=case when p_status='processed' then coalesce(processed_at,now()) else processed_at end,
 status=case when p_status='processed' then 'processed' when p_status in ('failed','rejected','cancelled','reversed') then 'failed' else 'pending' end,updated_at=now() where id=p_id returning * into op;
 if op.kind='payout' then
   if p_status='processed' then
     update washer_earnings set status='settled',settled_at=now() where id in(select earning_id from finance_payout_items where operation_id=p_id);
   elsif p_status in ('failed','rejected','cancelled','reversed') then
     update washer_earnings set status='pending',settled_at=null where id in(select earning_id from finance_payout_items where operation_id=p_id);
     delete from finance_payout_items where operation_id=p_id;
   end if;
 end if;
 return to_jsonb(op);
end $$;
revoke all on function public.reserve_finance_operation(uuid,text,uuid,bigint,text,uuid,text) from public,anon,authenticated;
revoke all on function public.reconcile_finance_operation(uuid,text,text) from public,anon,authenticated;
grant execute on function public.reserve_finance_operation(uuid,text,uuid,bigint,text,uuid,text) to service_role;
grant execute on function public.reconcile_finance_operation(uuid,text,text) to service_role;

create or replace function public.begin_finance_operation(p_id uuid, p_cancel boolean default false)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare op public.finance_operations%rowtype;
begin
 perform pg_advisory_xact_lock(73619842);
 select * into op from finance_operations where id=p_id for update;
 if not found then raise exception 'Operation not found.'; end if;
 if p_cancel then
  if op.status<>'reserved' or op.provider_id is not null then raise exception 'Already submitted. Reconcile this request instead.'; end if;
  update finance_operations set status='failed',provider_status='cancelled',updated_at=now() where id=p_id returning * into op;
  delete from finance_payout_items where operation_id=p_id;
 else
  if op.status='failed' and op.provider_id is null then raise exception 'This draft was cancelled. Create a new request.'; end if;
  if op.status='reserved' then update finance_operations set status='submitting',updated_at=now() where id=p_id returning * into op; end if;
 end if;
 return to_jsonb(op);
end $$;
revoke all on function public.begin_finance_operation(uuid,boolean) from public,anon,authenticated;
grant execute on function public.begin_finance_operation(uuid,boolean) to service_role;





-- ===== migrations/20261013151000_require_server_booking_writes.sql =====

-- Deploy the matching backend booking endpoint before applying this migration.
-- Prevent clients bypassing server-side pricing and ownership validation.
revoke insert, update, delete on public.bookings from anon, authenticated;





-- ===== migrations/20261013152000_payment_idempotency.sql =====

-- Existing duplicate payment/earning records must be reconciled before these indexes can be created.
create unique index if not exists payments_one_active_order_per_booking on public.payments(booking_id) where status in ('created','paid');
create unique index if not exists washer_earnings_one_per_booking on public.washer_earnings(booking_id);
create or replace function public.record_cod_payment_once(p_booking_id uuid,p_washer_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare b public.bookings%rowtype; p public.payments%rowtype;
begin
 select * into b from bookings where id=p_booking_id for update;
 if not found or b.assigned_washer_id is distinct from p_washer_id or b.payment_method<>'cod' or b.status<>'completed' then raise exception 'A completed cash booking assigned to this washer is required.'; end if;
 select * into p from payments where booking_id=b.id and status='paid';
 if found then return to_jsonb(p); end if;
 if b.total_amount is null or b.total_amount<=0 then raise exception 'Invalid booking amount.'; end if;
 insert into payments(booking_id,customer_id,amount,payment_method,status,provider,paid_at) values(b.id,b.customer_id,b.total_amount,'cod','paid','cash',now()) returning * into p;
 return to_jsonb(p);
end $$;
revoke all on function public.record_cod_payment_once(uuid,uuid) from public,anon,authenticated;
grant execute on function public.record_cod_payment_once(uuid,uuid) to service_role;





-- ===== migrations/20261014130000_add_customer_booking_notifications.sql =====

create table if not exists public.customer_notifications (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  booking_number text,
  event_type text not null,
  title text not null,
  message text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists customer_notifications_customer_created_idx
  on public.customer_notifications (customer_id, created_at desc);

alter table public.customer_notifications enable row level security;

drop policy if exists "Customers can read their own notifications"
  on public.customer_notifications;
create policy "Customers can read their own notifications"
  on public.customer_notifications
  for select
  to authenticated
  using (customer_id = (select public.current_customer_id()));

drop policy if exists "Customers can mark their own notifications read"
  on public.customer_notifications;
create policy "Customers can mark their own notifications read"
  on public.customer_notifications
  for update
  to authenticated
  using (
    customer_id = (select public.current_customer_id())
    and read_at is null
  )
  with check (
    customer_id = (select public.current_customer_id())
    and read_at is not null
  );

grant select on public.customer_notifications to authenticated;
grant update (read_at) on public.customer_notifications to authenticated;
revoke insert, delete on public.customer_notifications from anon, authenticated;

create or replace function public.create_customer_booking_notification()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  notification_title text;
  notification_message text;
  notification_type text;
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return new;
  end if;

  notification_type := coalesce(new.status, 'booking_update');
  notification_title := case new.status
    when 'pending' then 'Booking received'
    when 'payment_completed' then 'Payment confirmed'
    when 'finding_washer' then 'Finding your washer'
    when 'washer_assigned' then 'Washer assigned'
    when 'washer_on_the_way' then 'Washer on the way'
    when 'washer_arrived' then 'Washer has arrived'
    when 'otp_verified' then 'Service verified'
    when 'service_started' then 'Service started'
    when 'service_completed' then 'Service completed'
    when 'completed' then 'Booking complete'
    when 'customer_approved' then 'Extra charge approved'
    when 'customer_rejected' then 'Extra charge declined'
    when 'customer_confirmed' then 'Booking complete'
    when 'rejected' then 'Booking update'
    when 'expired' then 'Booking update'
    when 'cancelled' then 'Booking cancelled'
    when 'payment_failed' then 'Payment unsuccessful'
    else 'Booking update'
  end;

  notification_message := case new.status
    when 'pending' then 'Your booking has been received. We will keep you updated.'
    when 'payment_completed' then 'Your payment was successful.'
    when 'finding_washer' then 'We are finding a washer for your booking.'
    when 'washer_assigned' then 'A washer has been assigned to your booking.'
    when 'washer_on_the_way' then 'Your washer is on the way to your location.'
    when 'washer_arrived' then 'Your washer has arrived at your location.'
    when 'otp_verified' then 'Your service verification is complete.'
    when 'service_started' then 'Your car wash service has started.'
    when 'service_completed' then 'Your service is complete and awaiting final review.'
    when 'completed' then 'Your booking is complete. Thank you!'
    when 'customer_approved' then 'You approved the additional service charge.'
    when 'customer_rejected' then 'You declined the additional service charge.'
    when 'customer_confirmed' then 'Your booking is complete. Thank you!'
    when 'rejected' then 'We could not assign a washer to this booking. Please check your booking for details.'
    when 'expired' then 'The washer assignment window expired. Please check your booking for the latest update.'
    when 'cancelled' then 'Your booking has been cancelled.'
    when 'payment_failed' then 'Your payment could not be completed. Please review your booking.'
    else 'Your booking status changed to ' ||
      replace(coalesce(new.status, 'updated'), '_', ' ') || '.'
  end;

  insert into public.customer_notifications (
    customer_id,
    booking_id,
    booking_number,
    event_type,
    title,
    message
  )
  values (
    new.customer_id,
    new.id,
    new.booking_number,
    notification_type,
    notification_title,
    case
      when new.booking_number is not null
        then 'Booking ' || new.booking_number || ': ' || notification_message
      else notification_message
    end
  );

  return new;
end;
$$;

drop trigger if exists bookings_create_customer_notification
  on public.bookings;
drop trigger if exists bookings_create_customer_notification_insert
  on public.bookings;
create trigger bookings_create_customer_notification_insert
  after insert on public.bookings
  for each row execute function public.create_customer_booking_notification();

drop trigger if exists bookings_create_customer_notification_status
  on public.bookings;
create trigger bookings_create_customer_notification_status
  after update of status on public.bookings
  for each row execute function public.create_customer_booking_notification();

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'customer_notifications'
  ) then
    alter publication supabase_realtime
      add table public.customer_notifications;
  end if;
end;
$$;





-- ===== migrations/20261015090000_harden_client_profile_updates.sql =====

-- Apply after the supplied base schema. No records are deleted.
-- Profile changes use the authenticated backend; browser clients cannot edit roles.
BEGIN;
CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid() AND is_active = true LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.current_profile_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_profile_role() TO authenticated;
DROP POLICY IF EXISTS support_select_profiles ON public.profiles;
DROP POLICY IF EXISTS admins_select_profiles ON public.profiles;
CREATE POLICY support_select_profiles ON public.profiles FOR SELECT TO authenticated
USING (public.current_profile_role() = 'support');
CREATE POLICY admins_select_profiles ON public.profiles FOR SELECT TO authenticated
USING (public.current_profile_role() IN ('super_admin', 'sub_admin'));
-- RLS checks rows, not which columns a client updates.
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon, authenticated;
REVOKE UPDATE, DELETE ON public.customers FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.washers FROM anon, authenticated;
-- Also remove column-level grants if previously added.
DO $$ DECLARE item record; BEGIN
  FOR item IN SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name IN ('profiles', 'customers', 'washers')
  LOOP
    EXECUTE format('REVOKE UPDATE (%I) ON public.%I FROM anon, authenticated', item.column_name, item.table_name);
    IF item.table_name <> 'customers' THEN
      EXECUTE format('REVOKE INSERT (%I) ON public.%I FROM anon, authenticated', item.column_name, item.table_name);
    END IF;
  END LOOP;
END $$;
COMMIT;





-- ===== migrations/20261015100000_restrict_direct_workflow_writes.sql =====

-- Backend-mediated financial/workflow updates only; keeps existing SELECT policies.
BEGIN;
DO $$ DECLARE t text; col record; BEGIN
  FOREACH t IN ARRAY ARRAY['bookings','booking_assignments','booking_status_history','payments','washer_earnings','washer_settlements','extra_charge_requests'] LOOP
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE ON public.%I FROM anon, authenticated', t);
    FOR col IN SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=t LOOP
      EXECUTE format('REVOKE INSERT (%I), UPDATE (%I) ON public.%I FROM anon, authenticated', col.column_name, col.column_name, t);
    END LOOP;
  END LOOP;
END $$;
-- Old finder bypasses the server eligibility/payment checks.
REVOKE ALL ON FUNCTION public.find_washer_for_booking(uuid) FROM PUBLIC, anon, authenticated;
-- Sequence formatting must never truncate a booking number after six digits.
CREATE OR REPLACE FUNCTION public.next_booking_number() RETURNS text
LANGUAGE plpgsql SET search_path='' AS $$
DECLARE n text := nextval('public.booking_number_seq')::text;
BEGIN
 RETURN 'CW-' || to_char(now() AT TIME ZONE 'Asia/Kolkata','YYYY') || '-' || lpad(n,greatest(6,length(n)),'0');
END $$;
ALTER TABLE public.bookings ALTER COLUMN booking_number SET DEFAULT public.next_booking_number();
COMMIT;





-- ===== migrations/20261015110000_refresh_assignment_contract.sql =====

-- Transactional replacement supports the supplied UUID-returning legacy RPC.
BEGIN;
DROP FUNCTION IF EXISTS public.accept_booking_assignment(uuid);
create or replace function public.booking_washer_is_eligible(
  p_booking_id uuid,
  p_washer_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_booking record;
  v_washer record;
  v_location record;
  v_package record;
  v_distance_km double precision;
  v_conflict boolean;
begin
  select id, status, assigned_washer_id, package_id, scheduled_date,
         scheduled_start_time, latitude, longitude
    into v_booking
    from public.bookings
   where id = p_booking_id;

  if not found
     or v_booking.assigned_washer_id is not null
     or v_booking.status not in ('pending', 'confirmed', 'finding_washer', 'support_escalated')
     or v_booking.scheduled_date is null
     or v_booking.scheduled_start_time is null
     or v_booking.latitude is null
     or v_booking.longitude is null then
    return false;
  end if;

  select id, status, is_active, is_verified, service_radius_km
    into v_washer
    from public.washers
   where id = p_washer_id;

  if not found or not v_washer.is_active or not v_washer.is_verified or v_washer.status <> 'available' then
    return false;
  end if;

  select latitude, longitude, updated_at
    into v_location
    from public.washer_locations
   where washer_id = p_washer_id;

  if not found
     or v_location.updated_at is null
     or v_location.latitude is null
     or v_location.longitude is null
     or v_location.latitude not between -90 and 90
     or v_location.longitude not between -180 and 180
     or v_location.updated_at < now() - interval '15 minutes' then
    return false;
  end if;

  v_distance_km := 2 * 6371 * asin(sqrt(least(1::double precision, greatest(0::double precision,
    power(sin(radians((v_location.latitude - v_booking.latitude) / 2)), 2) +
    cos(radians(v_booking.latitude)) * cos(radians(v_location.latitude)) *
    power(sin(radians((v_location.longitude - v_booking.longitude) / 2)), 2)
  ))));

  if v_distance_km > coalesce(nullif(v_washer.service_radius_km, 0), 5) then
    return false;
  end if;

  select service_id, duration_minutes
    into v_package
    from public.service_packages
   where id = v_booking.package_id;

  if found and v_package.service_id is not null and not exists (
    select 1 from public.washer_skills
     where washer_id = p_washer_id
       and service_id = v_package.service_id
  ) then
    return false;
  end if;

  if not exists (
    select 1 from public.washer_availability a
    where a.washer_id = p_washer_id and a.is_available
      and a.day_of_week = extract(dow from v_booking.scheduled_date)
      and a.start_time <= v_booking.scheduled_start_time
      and v_booking.scheduled_date + a.end_time >= v_booking.scheduled_date + v_booking.scheduled_start_time + make_interval(mins => coalesce(v_package.duration_minutes,60))
  ) then return false; end if;

  select exists (
    select 1
      from public.bookings existing
      left join public.service_packages existing_package
        on existing_package.id = existing.package_id
     where existing.assigned_washer_id = p_washer_id
       and existing.id <> p_booking_id
       and existing.status in (
         'washer_assigned', 'washer_on_the_way', 'washer_arrived',
         'otp_verified', 'service_started', 'service_completed'
       )
       and existing.scheduled_date is not null
       and existing.scheduled_start_time is not null
       and (
         v_booking.scheduled_date::date + v_booking.scheduled_start_time::time
       ) < (
         existing.scheduled_date::date + existing.scheduled_start_time::time
         + make_interval(mins => coalesce(existing_package.duration_minutes, 60))
       )
       and (
         existing.scheduled_date::date + existing.scheduled_start_time::time
       ) < (
         v_booking.scheduled_date::date + v_booking.scheduled_start_time::time
         + make_interval(mins => coalesce(v_package.duration_minutes, 60))
       )
  ) into v_conflict;

  return not v_conflict;
end;
$$;

create or replace function public.accept_booking_assignment(p_assignment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_washer_id uuid;
  v_assignment public.booking_assignments%rowtype;
  v_booking public.bookings%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required.' using errcode = '28000';
  end if;

  select id into v_washer_id
    from public.washers
   where user_id = v_user_id
     and is_active = true;
  if not found then
    raise exception 'Active washer profile not found.' using errcode = '42501';
  end if;

  -- Read the immutable booking reference, then lock booking -> washer -> offer.
  select * into v_assignment from public.booking_assignments where id = p_assignment_id;
  if not found or v_assignment.washer_id <> v_washer_id then
    raise exception 'Assignment not found.' using errcode = '42501';
  end if;
  select * into v_booking from public.bookings where id = v_assignment.booking_id for update;
  if v_booking.status::text = 'pending' then raise exception 'Supervisor review is required before washer acceptance.'; end if;
  perform 1 from public.washers where id = v_washer_id for update;
  select * into v_assignment from public.booking_assignments where id = p_assignment_id for update;
  if not found or v_assignment.status <> 'pending' or v_assignment.expires_at is null or v_assignment.expires_at <= now() then
    raise exception 'Assignment is no longer available.' using errcode = '40001';
  end if;
  if not public.booking_washer_is_eligible(v_booking.id, v_washer_id) then
    raise exception 'Booking is no longer eligible for this washer.' using errcode = '40001';
  end if;

  update public.bookings
     set assigned_washer_id = v_washer_id,
         status = 'washer_assigned',
         requires_supervisor = false,
         updated_at = now()
   where id = v_booking.id
   returning * into v_booking;

  update public.booking_assignments
     set status = 'accepted',
         responded_at = now()
   where id = v_assignment.id
   returning * into v_assignment;

  update public.washers set status = 'busy' where id = v_booking.assigned_washer_id;
  update public.booking_assignments set status = 'cancelled', responded_at = now()
    where booking_id = v_booking.id and id <> v_assignment.id and status = 'pending';
  return jsonb_build_object(
    'booking', to_jsonb(v_booking),
    'assignment', to_jsonb(v_assignment)
  );
end;
$$;

create or replace function public.supervisor_assign_washer(
  p_booking_id uuid,
  p_washer_id uuid,
  p_supervisor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_role text;
  v_booking public.bookings%rowtype;
  v_assignment public.booking_assignments%rowtype;
  v_has_assignment boolean := false;
  v_location record;
  v_distance_km double precision;
  v_attempt_number integer;
begin
  select role into v_role
    from public.profiles
   where id = p_supervisor_id and is_active = true;
  if v_role is null or v_role not in ('supervisor', 'sub_admin', 'super_admin') then
    raise exception 'Supervisor permission required.' using errcode = '42501';
  end if;

  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'Booking not found.' using errcode = 'P0002'; end if;
  perform 1 from public.washers where id = p_washer_id for update;
  if not found then raise exception 'Washer not found.' using errcode = 'P0002'; end if;
  select * into v_assignment from public.booking_assignments
    where booking_id = p_booking_id and washer_id = p_washer_id for update;
  v_has_assignment := found;

  if not public.booking_washer_is_eligible(p_booking_id, p_washer_id) then
    raise exception 'Washer is no longer eligible for this booking.' using errcode = '40001';
  end if;

  select latitude, longitude into v_location
    from public.washer_locations
   where washer_id = p_washer_id;
  v_distance_km := 2 * 6371 * asin(sqrt(
    power(sin(radians((v_location.latitude - v_booking.latitude) / 2)), 2) +
    cos(radians(v_booking.latitude)) * cos(radians(v_location.latitude)) *
    power(sin(radians((v_location.longitude - v_booking.longitude) / 2)), 2)
  ));

  update public.bookings
     set assigned_washer_id = p_washer_id,
         status = 'washer_assigned',
         requires_supervisor = false,
         updated_at = now()
   where id = p_booking_id
   returning * into v_booking;

  if v_has_assignment then
    update public.booking_assignments
       set status = 'accepted',
           responded_at = now(),
           rejection_reason = null
     where id = v_assignment.id
     returning * into v_assignment;
  else
    select coalesce(max(attempt_number), 0) + 1
      into v_attempt_number
      from public.booking_assignments
     where booking_id = p_booking_id;

    insert into public.booking_assignments (
      booking_id, washer_id, status, distance_km, attempt_number,
      offered_at, expires_at, responded_at, rejection_reason
    ) values (
      p_booking_id, p_washer_id, 'accepted', round(v_distance_km::numeric, 2),
      v_attempt_number, now(), now(), now(), null
    )
    returning * into v_assignment;
  end if;

  update public.washers set status = 'busy' where id = v_booking.assigned_washer_id;
  update public.booking_assignments set status = 'cancelled', responded_at = now()
    where booking_id = v_booking.id and id <> v_assignment.id and status = 'pending';
  return jsonb_build_object(
    'booking', to_jsonb(v_booking),
    'assignment', to_jsonb(v_assignment)
  );
end;
$$;

revoke all on function public.booking_washer_is_eligible(uuid, uuid) from public, anon, authenticated;
revoke all on function public.accept_booking_assignment(uuid) from public, anon;
revoke all on function public.supervisor_assign_washer(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.accept_booking_assignment(uuid) to authenticated;
grant execute on function public.booking_washer_is_eligible(uuid, uuid) to service_role;
grant execute on function public.supervisor_assign_washer(uuid, uuid, uuid) to service_role;

COMMIT;





-- ===== migrations/20261015120000_customer_confirmation_lifecycle.sql =====

-- Requires lifecycle fields and payment-idempotency migrations first.
BEGIN;
CREATE OR REPLACE FUNCTION public.confirm_customer_service(p_booking_id uuid, p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE b public.bookings%rowtype;
BEGIN
 SELECT b0.* INTO b FROM public.bookings b0 JOIN public.customers c ON c.id=b0.customer_id
 WHERE b0.id=p_booking_id AND c.user_id=p_user_id FOR UPDATE OF b0;
 IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found.'; END IF;
 IF b.status::text IN ('customer_confirmed','payment_completed','closed') THEN RETURN to_jsonb(b); END IF;
 IF b.status::text <> 'service_completed' OR b.service_validated_at IS NULL THEN
 RAISE EXCEPTION 'Service photos must be validated before customer confirmation.'; END IF;
 UPDATE public.bookings SET status='customer_confirmed', customer_confirmed_at=now() WHERE id=b.id RETURNING * INTO b;
 IF EXISTS(SELECT 1 FROM public.payments WHERE booking_id=b.id AND status='paid' AND amount>=b.total_amount) THEN
 UPDATE public.bookings SET status='payment_completed' WHERE id=b.id RETURNING * INTO b;
 END IF;
 RETURN to_jsonb(b);
END $$;
REVOKE ALL ON FUNCTION public.confirm_customer_service(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_customer_service(uuid,uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.complete_confirmed_paid_booking() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.status::text='paid' THEN
 UPDATE public.bookings SET status='payment_completed'
 WHERE id=NEW.booking_id AND status='customer_confirmed' AND total_amount<=NEW.amount;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS complete_confirmed_paid_booking ON public.payments;
CREATE TRIGGER complete_confirmed_paid_booking AFTER INSERT OR UPDATE OF status ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.complete_confirmed_paid_booking();
COMMIT;

create or replace function public.record_cod_payment_once(p_booking_id uuid,p_washer_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare b public.bookings%rowtype; p public.payments%rowtype;
begin
 select * into b from bookings where id=p_booking_id for update;
 if not found or b.assigned_washer_id is distinct from p_washer_id or b.payment_method<>'cod' or b.status::text not in ('customer_confirmed','payment_completed') then raise exception 'A customer-confirmed cash booking assigned to this washer is required.'; end if;
 select * into p from payments where booking_id=b.id and status='paid';
 if found then return to_jsonb(p); end if;
 if b.total_amount is null or b.total_amount<=0 then raise exception 'Invalid booking amount.'; end if;
 insert into payments(booking_id,customer_id,amount,payment_method,status,provider,paid_at) values(b.id,b.customer_id,b.total_amount,'cod','paid','cash',now()) returning * into p;
 return to_jsonb(p);
end $$;
revoke all on function public.record_cod_payment_once(uuid,uuid) from public,anon,authenticated;
grant execute on function public.record_cod_payment_once(uuid,uuid) to service_role;





-- ===== migrations/20261015130000_supervisor_add_washer.sql =====

BEGIN;
CREATE OR REPLACE FUNCTION public.supervisor_add_washer(p_actor_id uuid,p_user_id uuid,p_radius numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor public.profiles%rowtype; target public.profiles%rowtype; w public.washers%rowtype;
BEGIN
 SELECT * INTO actor FROM public.profiles WHERE id=p_actor_id;
 IF NOT FOUND OR NOT actor.is_active OR actor.role::text NOT IN ('supervisor','sub_admin','super_admin') THEN RAISE EXCEPTION 'Supervisor permission required.'; END IF;
 IF p_actor_id=p_user_id OR p_radius IS NULL OR p_radius<=0 OR p_radius>100 THEN RAISE EXCEPTION 'Invalid washer details.'; END IF;
 SELECT * INTO target FROM public.profiles WHERE id=p_user_id FOR UPDATE;
 IF NOT FOUND OR NOT target.is_active THEN RAISE EXCEPTION 'Active registered account not found.'; END IF;
 IF target.role::text NOT IN ('customer','washer') THEN RAISE EXCEPTION 'This account has another staff role.'; END IF;
 IF target.role::text='customer' AND NOT EXISTS(SELECT 1 FROM auth.users WHERE id=p_user_id AND raw_user_meta_data->>'requested_role'='washer') THEN RAISE EXCEPTION 'The person must register using Washer sign up first.'; END IF;
 SELECT * INTO w FROM public.washers WHERE user_id=p_user_id FOR UPDATE;
 IF FOUND THEN
   IF w.supervisor_id IS DISTINCT FROM p_actor_id THEN RAISE EXCEPTION 'Washer already belongs to another supervisor. Contact an administrator.'; END IF;
   RETURN to_jsonb(w);
 END IF;
 INSERT INTO public.washers(user_id,supervisor_id,service_radius_km,status,is_active,is_verified)
 VALUES(p_user_id,p_actor_id,p_radius,'offline',true,false) RETURNING * INTO w;
 UPDATE public.profiles SET role='washer' WHERE id=p_user_id;
 RETURN to_jsonb(w);
END $$;
REVOKE ALL ON FUNCTION public.supervisor_add_washer(uuid,uuid,numeric) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.supervisor_add_washer(uuid,uuid,numeric) TO service_role;
COMMIT;





-- ===== migrations/20261015140000_require_supervisor_review.sql =====

-- Transactional replacement supports the supplied UUID-returning legacy RPC.
BEGIN;
DROP FUNCTION IF EXISTS public.accept_booking_assignment(uuid);
create or replace function public.booking_washer_is_eligible(
  p_booking_id uuid,
  p_washer_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_booking record;
  v_washer record;
  v_location record;
  v_package record;
  v_distance_km double precision;
  v_conflict boolean;
begin
  select id, status, assigned_washer_id, package_id, scheduled_date,
         scheduled_start_time, latitude, longitude
    into v_booking
    from public.bookings
   where id = p_booking_id;

  if not found
     or v_booking.assigned_washer_id is not null
     or v_booking.status not in ('pending', 'confirmed', 'finding_washer', 'support_escalated')
     or v_booking.scheduled_date is null
     or v_booking.scheduled_start_time is null
     or v_booking.latitude is null
     or v_booking.longitude is null then
    return false;
  end if;

  select id, status, is_active, is_verified, service_radius_km
    into v_washer
    from public.washers
   where id = p_washer_id;

  if not found or not v_washer.is_active or not v_washer.is_verified or v_washer.status <> 'available' then
    return false;
  end if;

  select latitude, longitude, updated_at
    into v_location
    from public.washer_locations
   where washer_id = p_washer_id;

  if not found
     or v_location.updated_at is null
     or v_location.latitude is null
     or v_location.longitude is null
     or v_location.latitude not between -90 and 90
     or v_location.longitude not between -180 and 180
     or v_location.updated_at < now() - interval '15 minutes' then
    return false;
  end if;

  v_distance_km := 2 * 6371 * asin(sqrt(least(1::double precision, greatest(0::double precision,
    power(sin(radians((v_location.latitude - v_booking.latitude) / 2)), 2) +
    cos(radians(v_booking.latitude)) * cos(radians(v_location.latitude)) *
    power(sin(radians((v_location.longitude - v_booking.longitude) / 2)), 2)
  ))));

  if v_distance_km > coalesce(nullif(v_washer.service_radius_km, 0), 5) then
    return false;
  end if;

  select service_id, duration_minutes
    into v_package
    from public.service_packages
   where id = v_booking.package_id;

  if found and v_package.service_id is not null and not exists (
    select 1 from public.washer_skills
     where washer_id = p_washer_id
       and service_id = v_package.service_id
  ) then
    return false;
  end if;

  if not exists (
    select 1 from public.washer_availability a
    where a.washer_id = p_washer_id and a.is_available
      and a.day_of_week = extract(dow from v_booking.scheduled_date)
      and a.start_time <= v_booking.scheduled_start_time
      and v_booking.scheduled_date + a.end_time >= v_booking.scheduled_date + v_booking.scheduled_start_time + make_interval(mins => coalesce(v_package.duration_minutes,60))
  ) then return false; end if;

  select exists (
    select 1
      from public.bookings existing
      left join public.service_packages existing_package
        on existing_package.id = existing.package_id
     where existing.assigned_washer_id = p_washer_id
       and existing.id <> p_booking_id
       and existing.status in (
         'washer_assigned', 'washer_on_the_way', 'washer_arrived',
         'otp_verified', 'service_started', 'service_completed'
       )
       and existing.scheduled_date is not null
       and existing.scheduled_start_time is not null
       and (
         v_booking.scheduled_date::date + v_booking.scheduled_start_time::time
       ) < (
         existing.scheduled_date::date + existing.scheduled_start_time::time
         + make_interval(mins => coalesce(existing_package.duration_minutes, 60))
       )
       and (
         existing.scheduled_date::date + existing.scheduled_start_time::time
       ) < (
         v_booking.scheduled_date::date + v_booking.scheduled_start_time::time
         + make_interval(mins => coalesce(v_package.duration_minutes, 60))
       )
  ) into v_conflict;

  return not v_conflict;
end;
$$;

create or replace function public.accept_booking_assignment(p_assignment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_washer_id uuid;
  v_assignment public.booking_assignments%rowtype;
  v_booking public.bookings%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required.' using errcode = '28000';
  end if;

  select id into v_washer_id
    from public.washers
   where user_id = v_user_id
     and is_active = true;
  if not found then
    raise exception 'Active washer profile not found.' using errcode = '42501';
  end if;

  -- Read the immutable booking reference, then lock booking -> washer -> offer.
  select * into v_assignment from public.booking_assignments where id = p_assignment_id;
  if not found or v_assignment.washer_id <> v_washer_id then
    raise exception 'Assignment not found.' using errcode = '42501';
  end if;
  select * into v_booking from public.bookings where id = v_assignment.booking_id for update;
  if v_booking.status::text = 'pending' then raise exception 'Supervisor review is required before washer acceptance.'; end if;
  perform 1 from public.washers where id = v_washer_id for update;
  select * into v_assignment from public.booking_assignments where id = p_assignment_id for update;
  if not found or v_assignment.status <> 'pending' or v_assignment.expires_at is null or v_assignment.expires_at <= now() then
    raise exception 'Assignment is no longer available.' using errcode = '40001';
  end if;
  if not public.booking_washer_is_eligible(v_booking.id, v_washer_id) then
    raise exception 'Booking is no longer eligible for this washer.' using errcode = '40001';
  end if;

  update public.bookings
     set assigned_washer_id = v_washer_id,
         status = 'washer_assigned',
         requires_supervisor = false,
         updated_at = now()
   where id = v_booking.id
   returning * into v_booking;

  update public.booking_assignments
     set status = 'accepted',
         responded_at = now()
   where id = v_assignment.id
   returning * into v_assignment;

  update public.washers set status = 'busy' where id = v_booking.assigned_washer_id;
  update public.booking_assignments set status = 'cancelled', responded_at = now()
    where booking_id = v_booking.id and id <> v_assignment.id and status = 'pending';
  return jsonb_build_object(
    'booking', to_jsonb(v_booking),
    'assignment', to_jsonb(v_assignment)
  );
end;
$$;

create or replace function public.supervisor_assign_washer(
  p_booking_id uuid,
  p_washer_id uuid,
  p_supervisor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_role text;
  v_booking public.bookings%rowtype;
  v_assignment public.booking_assignments%rowtype;
  v_has_assignment boolean := false;
  v_location record;
  v_distance_km double precision;
  v_attempt_number integer;
begin
  select role into v_role
    from public.profiles
   where id = p_supervisor_id and is_active = true;
  if v_role is null or v_role not in ('supervisor', 'sub_admin', 'super_admin') then
    raise exception 'Supervisor permission required.' using errcode = '42501';
  end if;

  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'Booking not found.' using errcode = 'P0002'; end if;
  perform 1 from public.washers where id = p_washer_id for update;
  if not found then raise exception 'Washer not found.' using errcode = 'P0002'; end if;
  select * into v_assignment from public.booking_assignments
    where booking_id = p_booking_id and washer_id = p_washer_id for update;
  v_has_assignment := found;

  if not public.booking_washer_is_eligible(p_booking_id, p_washer_id) then
    raise exception 'Washer is no longer eligible for this booking.' using errcode = '40001';
  end if;

  select latitude, longitude into v_location
    from public.washer_locations
   where washer_id = p_washer_id;
  v_distance_km := 2 * 6371 * asin(sqrt(
    power(sin(radians((v_location.latitude - v_booking.latitude) / 2)), 2) +
    cos(radians(v_booking.latitude)) * cos(radians(v_location.latitude)) *
    power(sin(radians((v_location.longitude - v_booking.longitude) / 2)), 2)
  ));

  update public.bookings
     set assigned_washer_id = p_washer_id,
         status = 'washer_assigned',
         requires_supervisor = false,
         updated_at = now()
   where id = p_booking_id
   returning * into v_booking;

  if v_has_assignment then
    update public.booking_assignments
       set status = 'accepted',
           responded_at = now(),
           rejection_reason = null
     where id = v_assignment.id
     returning * into v_assignment;
  else
    select coalesce(max(attempt_number), 0) + 1
      into v_attempt_number
      from public.booking_assignments
     where booking_id = p_booking_id;

    insert into public.booking_assignments (
      booking_id, washer_id, status, distance_km, attempt_number,
      offered_at, expires_at, responded_at, rejection_reason
    ) values (
      p_booking_id, p_washer_id, 'accepted', round(v_distance_km::numeric, 2),
      v_attempt_number, now(), now(), now(), null
    )
    returning * into v_assignment;
  end if;

  update public.washers set status = 'busy' where id = v_booking.assigned_washer_id;
  update public.booking_assignments set status = 'cancelled', responded_at = now()
    where booking_id = v_booking.id and id <> v_assignment.id and status = 'pending';
  return jsonb_build_object(
    'booking', to_jsonb(v_booking),
    'assignment', to_jsonb(v_assignment)
  );
end;
$$;

revoke all on function public.booking_washer_is_eligible(uuid, uuid) from public, anon, authenticated;
revoke all on function public.accept_booking_assignment(uuid) from public, anon;
revoke all on function public.supervisor_assign_washer(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.accept_booking_assignment(uuid) to authenticated;
grant execute on function public.booking_washer_is_eligible(uuid, uuid) to service_role;
grant execute on function public.supervisor_assign_washer(uuid, uuid, uuid) to service_role;

COMMIT;





-- ===== migrations/20261015150000_customer_signup_address.sql =====

-- Run after base auth.users, customers and customer_addresses tables.
-- Save the optional signup address when the existing signup trigger creates its customer.
BEGIN;
CREATE OR REPLACE FUNCTION public.save_customer_signup_address()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  metadata jsonb;
  address jsonb;
  lat double precision;
  lng double precision;
BEGIN
  SELECT raw_user_meta_data INTO metadata FROM auth.users WHERE id = NEW.user_id;
  IF COALESCE(metadata->>'requested_role', 'customer') <> 'customer' THEN RETURN NEW; END IF;
  address := metadata->'signup_address';
  IF jsonb_typeof(address) IS DISTINCT FROM 'object' THEN RETURN NEW; END IF;
  -- Treat metadata as untrusted: malformed optional data must not break signup.
  IF jsonb_typeof(address->'latitude') IS DISTINCT FROM 'number'
     OR jsonb_typeof(address->'longitude') IS DISTINCT FROM 'number' THEN RETURN NEW; END IF;
  lat := (address->>'latitude')::double precision;
  lng := (address->>'longitude')::double precision;
  IF NOT (lat BETWEEN -90 AND 90 AND lng BETWEEN -180 AND 180)
     OR length(btrim(COALESCE(address->>'address',''))) NOT BETWEEN 10 AND 500
     OR length(btrim(COALESCE(address->>'city',''))) NOT BETWEEN 1 AND 100
     OR length(btrim(COALESCE(address->>'state',''))) NOT BETWEEN 1 AND 100
     OR COALESCE(address->>'postalCode','') !~ '^[0-9]{6}$'
  THEN RETURN NEW; END IF;
  INSERT INTO public.customer_addresses(customer_id, label, address_line, latitude, longitude,
    city, state, postal_code, flat_number, landmark, is_default)
  VALUES (NEW.id, 'Home', btrim(address->>'address'), lat, lng,
    btrim(address->>'city'), btrim(address->>'state'), address->>'postalCode',
    NULLIF(left(btrim(address->>'flatNumber'),100),''),
    NULLIF(left(btrim(address->>'landmark'),200),''),
    NOT EXISTS (SELECT 1 FROM public.customer_addresses WHERE customer_id = NEW.id));
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.save_customer_signup_address() FROM PUBLIC;
DROP TRIGGER IF EXISTS customer_signup_address ON public.customers;
CREATE TRIGGER customer_signup_address AFTER INSERT ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.save_customer_signup_address();
COMMIT;





-- ===== migrations/20261015160000_reconcile_auth_provisioning.sql =====

-- Consolidate the two signup triggers from baseline 031 and the earlier provisioning migration.
BEGIN;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    phone,
    role
  )
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(new.email, '@', 1)
    ),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'phone', ''),
      ''
    ),
    (case
      when new.raw_app_meta_data ->> 'role' in (
        'customer',
        'washer',
        'supervisor',
        'support',
        'accountant',
        'sub_admin',
        'super_admin'
      )
        then new.raw_app_meta_data ->> 'role'
      else 'customer'
    end)::public.user_role
  )
  on conflict (id) do nothing;

  insert into public.customers(user_id)
  select id from public.profiles where id = new.id and role = 'customer'
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public;

drop trigger if exists create_profile_for_new_auth_user
  on auth.users;

create trigger create_profile_for_new_auth_user
  after insert on auth.users
  for each row
  execute function public.handle_new_auth_user();

insert into public.profiles (
  id,
  full_name,
  phone,
  role
)
select
  auth_user.id,
  coalesce(
    nullif(auth_user.raw_user_meta_data ->> 'full_name', ''),
    split_part(auth_user.email, '@', 1)
  ),
  coalesce(
    nullif(auth_user.raw_user_meta_data ->> 'phone', ''),
    ''
  ),
  (case
    when auth_user.raw_app_meta_data ->> 'role' in (
      'customer',
      'washer',
      'supervisor',
      'support',
      'accountant',
      'sub_admin',
      'super_admin'
    )
      then auth_user.raw_app_meta_data ->> 'role'
    else 'customer'
  end)::public.user_role
from auth.users as auth_user
on conflict (id) do nothing;

INSERT INTO public.customers(user_id)
SELECT id FROM public.profiles WHERE role = 'customer'
ON CONFLICT (user_id) DO NOTHING;
COMMIT;





-- ===== migrations/20261015170000_complete_service_storage_and_otp.sql =====

-- Required by washerJobController and servicePhotoController.
BEGIN;
ALTER TABLE public.booking_service_photos
 ADD COLUMN IF NOT EXISTS washer_id uuid REFERENCES public.washers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_service_photos_washer ON public.booking_service_photos(washer_id);

-- Resolve pgcrypto's installed schema (public or extensions on Supabase).
CREATE OR REPLACE FUNCTION public.hash_service_otp(p_otp text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE crypto_schema text; result text;
BEGIN
 IF p_otp IS NULL OR p_otp !~ '^[0-9]{6}$' THEN RAISE EXCEPTION 'A six-digit OTP is required'; END IF;
 SELECT n.nspname INTO crypto_schema FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace WHERE e.extname='pgcrypto';
 IF crypto_schema IS NULL THEN RAISE EXCEPTION 'pgcrypto extension is required'; END IF;
 EXECUTE format('SELECT %I.crypt($1, %I.gen_salt(''bf'', 10))',crypto_schema,crypto_schema) INTO result USING p_otp;
 RETURN result;
END;
$$;
CREATE OR REPLACE FUNCTION public.verify_service_otp_hash(p_otp text,p_hash text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE crypto_schema text; result boolean;
BEGIN
 IF p_otp IS NULL OR p_otp !~ '^[0-9]{6}$' OR p_hash IS NULL OR length(p_hash) <> 60 THEN RETURN false; END IF;
 SELECT n.nspname INTO crypto_schema FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace WHERE e.extname='pgcrypto';
 IF crypto_schema IS NULL THEN RAISE EXCEPTION 'pgcrypto extension is required'; END IF;
 EXECUTE format('SELECT %I.crypt($1,$2) = $2',crypto_schema) INTO result USING p_otp,p_hash;
 RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.hash_service_otp(text),public.verify_service_otp_hash(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.hash_service_otp(text),public.verify_service_otp_hash(text,text) TO service_role;

-- Supabase manages storage.buckets. Private uploads and signed URLs use backend service_role.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES ('service-photos','service-photos',false,10485760,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT(id) DO UPDATE SET public=false,file_size_limit=EXCLUDED.file_size_limit,allowed_mime_types=EXCLUDED.allowed_mime_types;
COMMIT;





-- ===== migrations/20261015180000_repair_profile_read_policies.sql =====

-- Repair stale/recursive profile read policies after older baseline scripts were replayed.
-- Apply as the database owner in Supabase SQL Editor. No user records are modified.
BEGIN;
CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT p.role::text FROM public.profiles p
 WHERE p.id = (SELECT auth.uid()) AND p.is_active = true LIMIT 1;
$$;
-- Ensure the helper is owned by the table owner so its read does not recurse through RLS.
DO $$
DECLARE owner_name text; policy record;
BEGIN
 SELECT pg_get_userbyid(relowner) INTO owner_name FROM pg_class WHERE oid='public.profiles'::regclass;
 EXECUTE format('ALTER FUNCTION public.current_profile_role() OWNER TO %I',owner_name);
 FOR policy IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND cmd IN ('SELECT','ALL') LOOP
  EXECUTE format('DROP POLICY %I ON public.profiles',policy.policyname);
 END LOOP;
END;
$$;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles NO FORCE ROW LEVEL SECURITY;
REVOKE ALL ON FUNCTION public.current_profile_role() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.current_profile_role() TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.profiles FROM anon,authenticated;
DO $$ DECLARE c record; BEGIN
 FOR c IN SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' LOOP
  EXECUTE format('REVOKE INSERT (%I), UPDATE (%I) ON public.profiles FROM anon, authenticated',c.column_name,c.column_name);
 END LOOP;
END $$;
CREATE POLICY profiles_read_authorized ON public.profiles FOR SELECT TO authenticated
USING (id=(SELECT auth.uid()) OR (SELECT public.current_profile_role()) IN ('super_admin','sub_admin','support','supervisor'));
COMMIT;
NOTIFY pgrst, 'reload schema';





-- ===== migrations/20261015190000_repair_customer_notifications.sql =====

-- Targeted repair: requires public.customers and public.bookings. Safe to rerun.
BEGIN;
create table if not exists public.customer_notifications (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  booking_number text,
  event_type text not null,
  title text not null,
  message text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists customer_notifications_customer_created_idx
  on public.customer_notifications (customer_id, created_at desc);

alter table public.customer_notifications enable row level security;

drop policy if exists "Customers can read their own notifications"
  on public.customer_notifications;
create policy "Customers can read their own notifications"
  on public.customer_notifications
  for select
  to authenticated
  using (EXISTS (SELECT 1 FROM public.customers c WHERE c.id = customer_notifications.customer_id AND c.user_id = (SELECT auth.uid())));

drop policy if exists "Customers can mark their own notifications read"
  on public.customer_notifications;
create policy "Customers can mark their own notifications read"
  on public.customer_notifications
  for update
  to authenticated
  using (
    EXISTS (SELECT 1 FROM public.customers c WHERE c.id = customer_notifications.customer_id AND c.user_id = (SELECT auth.uid()))
    and read_at is null
  )
  with check (
    EXISTS (SELECT 1 FROM public.customers c WHERE c.id = customer_notifications.customer_id AND c.user_id = (SELECT auth.uid()))
    and read_at is not null
  );

grant select on public.customer_notifications to authenticated;
revoke update on public.customer_notifications from anon, authenticated;
grant update (read_at) on public.customer_notifications to authenticated;
revoke insert, delete on public.customer_notifications from anon, authenticated;

create or replace function public.create_customer_booking_notification()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  notification_title text;
  notification_message text;
  notification_type text;
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return new;
  end if;

  notification_type := coalesce(new.status::text, 'booking_update');
  notification_title := case new.status::text
    when 'pending' then 'Booking received'
    when 'payment_completed' then 'Payment confirmed'
    when 'finding_washer' then 'Finding your washer'
    when 'washer_assigned' then 'Washer assigned'
    when 'washer_on_the_way' then 'Washer on the way'
    when 'washer_arrived' then 'Washer has arrived'
    when 'otp_verified' then 'Service verified'
    when 'service_started' then 'Service started'
    when 'service_completed' then 'Service completed'
    when 'completed' then 'Booking complete'
    when 'customer_approved' then 'Extra charge approved'
    when 'customer_rejected' then 'Extra charge declined'
    when 'customer_confirmed' then 'Booking complete'
    when 'rejected' then 'Booking update'
    when 'expired' then 'Booking update'
    when 'cancelled' then 'Booking cancelled'
    when 'payment_failed' then 'Payment unsuccessful'
    else 'Booking update'
  end;

  notification_message := case new.status::text
    when 'pending' then 'Your booking has been received. We will keep you updated.'
    when 'payment_completed' then 'Your payment was successful.'
    when 'finding_washer' then 'We are finding a washer for your booking.'
    when 'washer_assigned' then 'A washer has been assigned to your booking.'
    when 'washer_on_the_way' then 'Your washer is on the way to your location.'
    when 'washer_arrived' then 'Your washer has arrived at your location.'
    when 'otp_verified' then 'Your service verification is complete.'
    when 'service_started' then 'Your car wash service has started.'
    when 'service_completed' then 'Your service is complete and awaiting final review.'
    when 'completed' then 'Your booking is complete. Thank you!'
    when 'customer_approved' then 'You approved the additional service charge.'
    when 'customer_rejected' then 'You declined the additional service charge.'
    when 'customer_confirmed' then 'Your booking is complete. Thank you!'
    when 'rejected' then 'We could not assign a washer to this booking. Please check your booking for details.'
    when 'expired' then 'The washer assignment window expired. Please check your booking for the latest update.'
    when 'cancelled' then 'Your booking has been cancelled.'
    when 'payment_failed' then 'Your payment could not be completed. Please review your booking.'
    else 'Your booking status changed to ' ||
      replace(coalesce(new.status::text, 'updated'), '_', ' ') || '.'
  end;

  insert into public.customer_notifications (
    customer_id,
    booking_id,
    booking_number,
    event_type,
    title,
    message
  )
  values (
    new.customer_id,
    new.id,
    new.booking_number,
    notification_type,
    notification_title,
    case
      when new.booking_number is not null
        then 'Booking ' || new.booking_number || ': ' || notification_message
      else notification_message
    end
  );

  return new;
end;
$$;

drop trigger if exists bookings_create_customer_notification
  on public.bookings;
drop trigger if exists bookings_create_customer_notification_insert
  on public.bookings;
create trigger bookings_create_customer_notification_insert
  after insert on public.bookings
  for each row execute function public.create_customer_booking_notification();

drop trigger if exists bookings_create_customer_notification_status
  on public.bookings;
create trigger bookings_create_customer_notification_status
  after update of status on public.bookings
  for each row execute function public.create_customer_booking_notification();

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'customer_notifications'
  ) then
    alter publication supabase_realtime
      add table public.customer_notifications;
  end if;
end;
$$;

REVOKE ALL ON FUNCTION public.create_customer_booking_notification() FROM PUBLIC;
COMMIT;
NOTIFY pgrst, 'reload schema';





-- ===== migrations/20261015200000_restore_default_package_catalog.sql =====

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



-- ===== migrations/20261016010000_add_booking_expired_status.sql =====

-- Allow unpaid online bookings to move out of the active booking state after
-- the 30-minute payment window closes. Safe to run more than once.
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'expired';

NOTIFY pgrst, 'reload schema';





-- ===== migrations/20261016020000_add_payment_provider_method.sql =====

-- Store the method actually used in Razorpay Checkout for each payment.
-- Refund routing continues to use payments.provider_payment_id.
BEGIN;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS provider_method text;

COMMIT;
NOTIFY pgrst, 'reload schema';





-- ===== migrations/20261016030000_add_encrypted_washer_payout_destinations.sql =====

-- Allow washers to save payout instructions before RazorpayX is enabled.
-- The full destination is AES-256-GCM encrypted by the backend; account_label
-- remains masked and fund_account_id is populated only when a provider account
-- has been created and verified.
alter table public.washer_payout_accounts
  alter column fund_account_id drop not null;

alter table public.washer_payout_accounts
  add column if not exists destination_encrypted text;





-- ===== migrations/20261016040000_add_supervisor_commissions_and_payouts.sql =====

-- Supervisor commission mirrors the package rate on the amount remaining
-- after platform fee and GST. Those two charge amounts remain with the admin.
BEGIN;

CREATE TABLE IF NOT EXISTS public.supervisor_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE RESTRICT,
  supervisor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  washer_id uuid NOT NULL REFERENCES public.washers(id) ON DELETE RESTRICT,
  gross_amount numeric(12,2) NOT NULL CHECK (gross_amount >= 0),
  platform_fee_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (platform_fee_amount >= 0),
  gst_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (gst_amount >= 0),
  commission_base_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (commission_base_amount >= 0),
  supervisor_amount numeric(12,2) NOT NULL CHECK (supervisor_amount >= 0),
  commission_percent numeric(5,2) NOT NULL CHECK (commission_percent BETWEEN 0 AND 100),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','settled')),
  settled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supervisor_earnings_payable_idx
  ON public.supervisor_earnings (supervisor_id, status, created_at);
ALTER TABLE public.supervisor_earnings
  ADD COLUMN IF NOT EXISTS platform_fee_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (platform_fee_amount >= 0);
ALTER TABLE public.supervisor_earnings
  ADD COLUMN IF NOT EXISTS gst_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (gst_amount >= 0);
ALTER TABLE public.supervisor_earnings
  ADD COLUMN IF NOT EXISTS commission_base_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (commission_base_amount >= 0);
CREATE TABLE IF NOT EXISTS public.supervisor_payout_accounts (
  supervisor_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  fund_account_id text,
  destination_encrypted text,
  account_label text NOT NULL,
  updated_by uuid REFERENCES public.profiles(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT supervisor_payout_account_has_destination
    CHECK (fund_account_id IS NOT NULL OR destination_encrypted IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.supervisor_payout_operations (
  id uuid PRIMARY KEY,
  supervisor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount_paise bigint NOT NULL CHECK (amount_paise > 0),
  currency text NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved','pending','processed','failed','reversed','cancelled')),
  provider_id text UNIQUE,
  provider_status text,
  provider_request jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
ALTER TABLE public.supervisor_earnings
  ADD COLUMN IF NOT EXISTS payout_operation_id uuid REFERENCES public.supervisor_payout_operations(id);

-- Recalculate unpaid supervisor earnings after all referenced columns exist.
UPDATE public.supervisor_earnings earning
   SET platform_fee_amount = greatest(coalesce(booking.platform_fee, 0), 0),
       gst_amount = greatest(coalesce(booking.tax_amount, 0), 0),
       commission_base_amount = greatest(coalesce(booking.total_amount, 0)
         - greatest(coalesce(booking.platform_fee, 0), 0)
         - greatest(coalesce(booking.tax_amount, 0), 0), 0),
       supervisor_amount = round(greatest(coalesce(booking.total_amount, 0)
         - greatest(coalesce(booking.platform_fee, 0), 0)
         - greatest(coalesce(booking.tax_amount, 0), 0), 0) * earning.commission_percent / 100, 2)
  FROM public.bookings booking
 WHERE booking.id = earning.booking_id AND earning.status = 'pending'
   AND earning.payout_operation_id IS NULL;

CREATE OR REPLACE FUNCTION public.reserve_supervisor_payout(
  p_id uuid, p_supervisor_id uuid, p_actor uuid, p_reason text, p_account_number text
) RETURNS public.supervisor_payout_operations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $function$
DECLARE v_operation public.supervisor_payout_operations%rowtype; v_amount bigint;
BEGIN
  -- This function is service-role-only, so p_actor is supplied by the API.
  -- Validate that actor at the database boundary instead of trusting caller
  -- role checks alone; a mismatched/inactive actor cannot reserve a payout.
  IF p_actor IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_actor AND role IN ('accountant','super_admin') AND is_active = true) THEN
    RAISE EXCEPTION 'Finance role required.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_supervisor_id AND role = 'supervisor' AND is_active = true) THEN
    RAISE EXCEPTION 'Active supervisor not found.';
  END IF;
  SELECT * INTO v_operation FROM public.supervisor_payout_operations WHERE id = p_id;
  IF FOUND THEN
    IF v_operation.supervisor_id <> p_supervisor_id OR v_operation.created_by <> p_actor THEN RAISE EXCEPTION 'Payout request ID is already used.'; END IF;
    RETURN v_operation;
  END IF;
  PERFORM id FROM public.supervisor_earnings WHERE supervisor_id = p_supervisor_id AND status = 'pending' AND payout_operation_id IS NULL FOR UPDATE;
  SELECT round(sum(supervisor_amount) * 100)::bigint INTO v_amount FROM public.supervisor_earnings
   WHERE supervisor_id = p_supervisor_id AND status = 'pending' AND payout_operation_id IS NULL;
  IF coalesce(v_amount, 0) < 100 THEN RAISE EXCEPTION 'No eligible supervisor earnings are available.'; END IF;
  INSERT INTO public.supervisor_payout_operations(id, supervisor_id, amount_paise, reason, created_by,
    provider_request) VALUES (p_id, p_supervisor_id, v_amount, p_reason, p_actor,
      jsonb_build_object('account_number', p_account_number)) RETURNING * INTO v_operation;
  UPDATE public.supervisor_earnings SET payout_operation_id = p_id
   WHERE supervisor_id = p_supervisor_id AND status = 'pending' AND payout_operation_id IS NULL;
  RETURN v_operation;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reconcile_supervisor_payout(
  p_id uuid, p_provider_id text, p_status text
) RETURNS public.supervisor_payout_operations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $function$
DECLARE v_operation public.supervisor_payout_operations%rowtype; v_status text;
BEGIN
  SELECT * INTO v_operation FROM public.supervisor_payout_operations WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Supervisor payout not found.'; END IF;
  IF p_provider_id IS NULL OR p_provider_id = '' THEN RAISE EXCEPTION 'Provider payout ID is required.'; END IF;
  IF v_operation.provider_id IS NOT NULL AND v_operation.provider_id <> p_provider_id THEN
    RAISE EXCEPTION 'Provider payout ID does not match the reserved operation.';
  END IF;
  v_status := CASE lower(p_status)
    WHEN 'pending' THEN 'pending' WHEN 'queued' THEN 'pending' WHEN 'processing' THEN 'pending' WHEN 'initiated' THEN 'pending'
    WHEN 'processed' THEN 'processed' WHEN 'failed' THEN 'failed' WHEN 'reversed' THEN 'reversed'
    WHEN 'cancelled' THEN 'failed' WHEN 'rejected' THEN 'failed' ELSE NULL END;
  IF v_status IS NULL THEN RAISE EXCEPTION 'Unsupported payout status.'; END IF;
  -- Terminal results are monotonic: stale provider reads/events must never
  -- reopen a completed or failed transfer. Only failed may advance to a later
  -- processed result after a fresh provider reconciliation.
  IF v_operation.status IN ('processed','reversed','cancelled') THEN RETURN v_operation; END IF;
  IF v_operation.status = 'failed' AND v_status <> 'processed' THEN RETURN v_operation; END IF;
  UPDATE public.supervisor_payout_operations SET provider_id = coalesce(provider_id, p_provider_id),
    provider_status = p_status, status = v_status, updated_at = now(),
    processed_at = CASE WHEN v_status = 'processed' THEN coalesce(processed_at, now()) ELSE processed_at END
   WHERE id = p_id RETURNING * INTO v_operation;
  IF v_status = 'processed' THEN
    UPDATE public.supervisor_earnings SET status = 'settled', settled_at = coalesce(settled_at, now()) WHERE payout_operation_id = p_id;
  ELSIF v_status IN ('failed','reversed') THEN
    UPDATE public.supervisor_earnings SET payout_operation_id = NULL WHERE payout_operation_id = p_id AND status = 'pending';
  END IF;
  RETURN v_operation;
END;
$function$;

REVOKE ALL ON FUNCTION public.reserve_supervisor_payout(uuid,uuid,uuid,text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reconcile_supervisor_payout(uuid,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_supervisor_payout(uuid,uuid,uuid,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.reconcile_supervisor_payout(uuid,text,text) TO service_role;

ALTER TABLE public.supervisor_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervisor_payout_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervisor_payout_operations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.supervisor_earnings, public.supervisor_payout_accounts, public.supervisor_payout_operations FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.supervisor_earnings, public.supervisor_payout_accounts, public.supervisor_payout_operations TO service_role;

COMMIT;





-- ===== migrations/20261016050000_add_customer_booking_history_visibility.sql =====

-- Let customers remove terminal bookings from their own history without
-- deleting payment, service, assignment, or audit records.
BEGIN;
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS customer_hidden_at timestamptz;

CREATE INDEX IF NOT EXISTS bookings_customer_visible_history_idx
  ON public.bookings (customer_id, created_at DESC)
  WHERE customer_hidden_at IS NULL;
COMMIT;

NOTIFY pgrst, 'reload schema';





-- ===== migrations/20261016060000_add_customer_booking_cancellation_refunds.sql =====

-- Customer cancellation with a retained audit row and refund amount excluding
-- the platform fee. Run once in Supabase SQL Editor as database owner.
BEGIN;

CREATE TABLE IF NOT EXISTS public.booking_cancellations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings(id),
  customer_id uuid NOT NULL REFERENCES public.customers(id),
  payment_id uuid REFERENCES public.payments(id),
  refund_amount_paise bigint NOT NULL DEFAULT 0 CHECK (refund_amount_paise >= 0),
  platform_fee_paise bigint NOT NULL DEFAULT 0 CHECK (platform_fee_paise >= 0),
  status text NOT NULL CHECK (status IN ('cancelled', 'refund_pending', 'refund_processed', 'refund_failed')),
  provider_refund_id text,
  provider_status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS booking_cancellations_provider_refund_idx
  ON public.booking_cancellations (provider_refund_id)
  WHERE provider_refund_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS booking_cancellations_pending_idx
  ON public.booking_cancellations (updated_at)
  WHERE status = 'refund_pending';

CREATE OR REPLACE FUNCTION public.cancel_customer_booking(
  p_booking_id uuid,
  p_customer_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_customer_id uuid;
  v_booking public.bookings%rowtype;
  v_payment public.payments%rowtype;
  v_cancel public.booking_cancellations%rowtype;
  v_has_payment boolean := false;
  v_payment_paid boolean := false;
  v_paid_paise bigint := 0;
  v_fee_paise bigint := 0;
  v_refund_paise bigint := 0;
BEGIN
  SELECT id INTO v_customer_id FROM public.customers WHERE user_id = p_customer_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Customer profile not found.' USING errcode = '42501'; END IF;

  SELECT * INTO v_booking FROM public.bookings
   WHERE id = p_booking_id AND customer_id = v_customer_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found.' USING errcode = 'P0002'; END IF;

  SELECT * INTO v_cancel FROM public.booking_cancellations WHERE booking_id = p_booking_id;
  IF FOUND THEN RETURN to_jsonb(v_cancel); END IF;

  IF v_booking.status::text NOT IN (
    'pending', 'confirmed', 'finding_washer', 'support_escalated', 'washer_assigned',
    'washer_on_the_way', 'washer_arrived', 'otp_verified'
  ) THEN
    RAISE EXCEPTION 'This booking can no longer be cancelled online.' USING errcode = '55000';
  END IF;

  SELECT * INTO v_payment FROM public.payments
   WHERE booking_id = p_booking_id AND status IN ('created', 'paid')
     AND lower(coalesce(payment_method::text, '')) NOT IN ('cod', 'cash')
   ORDER BY paid_at DESC NULLS LAST, created_at DESC
   LIMIT 1 FOR UPDATE;
  v_has_payment := FOUND;
  v_payment_paid := v_has_payment AND v_payment.status = 'paid';
  IF v_payment_paid THEN
    IF nullif(v_payment.provider_payment_id, '') IS NULL THEN
      RAISE EXCEPTION 'Paid payment is missing its provider reference; contact support before cancelling.' USING errcode = '55000';
    END IF;
    v_paid_paise := round(v_payment.amount * 100)::bigint;
    v_fee_paise := round(greatest(coalesce(v_booking.platform_fee, 0), 0) * 100)::bigint;
    v_refund_paise := greatest(v_paid_paise - v_fee_paise, 0);
  END IF;

  INSERT INTO public.booking_cancellations (
    booking_id, customer_id, payment_id, refund_amount_paise,
    platform_fee_paise, status, provider_status
  ) VALUES (
    p_booking_id, v_customer_id,
    CASE WHEN v_has_payment THEN v_payment.id ELSE NULL END,
    v_refund_paise, v_fee_paise,
    CASE WHEN v_payment_paid AND v_refund_paise > 0 THEN 'refund_pending' ELSE 'cancelled' END,
    CASE WHEN v_has_payment AND NOT v_payment_paid THEN 'awaiting_payment' ELSE NULL END
  ) RETURNING * INTO v_cancel;

  UPDATE public.bookings SET status = 'cancelled', updated_at = now()
   WHERE id = p_booking_id;
  UPDATE public.booking_assignments
     SET status = 'cancelled', responded_at = now(),
         rejection_reason = 'Booking cancelled by customer.'
   WHERE booking_id = p_booking_id AND status IN ('pending', 'accepted');

  IF v_booking.assigned_washer_id IS NOT NULL THEN
    UPDATE public.washers w SET status = 'available', updated_at = now()
     WHERE w.id = v_booking.assigned_washer_id AND w.status = 'busy'
       AND NOT EXISTS (
         SELECT 1 FROM public.bookings b
          WHERE b.assigned_washer_id = w.id AND b.id <> p_booking_id
            AND b.status::text IN ('washer_assigned', 'washer_on_the_way', 'washer_arrived', 'otp_verified', 'service_started', 'service_completed')
       );
  END IF;

  RETURN to_jsonb(v_cancel);
END;
$function$;

REVOKE ALL ON FUNCTION public.cancel_customer_booking(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_customer_booking(uuid, uuid) TO service_role;
REVOKE ALL ON TABLE public.booking_cancellations FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.booking_cancellations TO service_role;

COMMIT;
NOTIFY pgrst, 'reload schema';





-- ===== migrations/20261016070000_repair_customer_cancellation_pending_payments.sql =====

-- Allow cancellation while a Razorpay order is awaiting payment. If the open
-- checkout captures after cancellation, the payment webhook/verification flow
-- starts a refund for the amount less the platform fee.
-- Run in Supabase SQL Editor after add_customer_booking_cancellation_refunds.sql.
BEGIN;

CREATE OR REPLACE FUNCTION public.cancel_customer_booking(
  p_booking_id uuid,
  p_customer_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_customer_id uuid;
  v_booking public.bookings%rowtype;
  v_payment public.payments%rowtype;
  v_cancel public.booking_cancellations%rowtype;
  v_has_payment boolean := false;
  v_payment_paid boolean := false;
  v_paid_paise bigint := 0;
  v_fee_paise bigint := 0;
  v_refund_paise bigint := 0;
BEGIN
  SELECT id INTO v_customer_id FROM public.customers WHERE user_id = p_customer_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Customer profile not found.' USING errcode = '42501'; END IF;

  SELECT * INTO v_booking FROM public.bookings
   WHERE id = p_booking_id AND customer_id = v_customer_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found.' USING errcode = 'P0002'; END IF;

  SELECT * INTO v_cancel FROM public.booking_cancellations WHERE booking_id = p_booking_id;
  IF FOUND THEN RETURN to_jsonb(v_cancel); END IF;

  IF v_booking.status::text NOT IN (
    'pending', 'confirmed', 'finding_washer', 'support_escalated', 'washer_assigned',
    'washer_on_the_way', 'washer_arrived', 'otp_verified'
  ) THEN
    RAISE EXCEPTION 'This booking can no longer be cancelled online.' USING errcode = '55000';
  END IF;

  -- Lock the active online payment. If it is still created, record the payment
  -- against the cancellation and wait for its final provider outcome instead
  -- of blocking cancellation. Capture handlers refund any late successful pay.
  SELECT * INTO v_payment FROM public.payments
   WHERE booking_id = p_booking_id AND status IN ('created', 'paid')
     AND lower(coalesce(payment_method::text, '')) NOT IN ('cod', 'cash')
   ORDER BY paid_at DESC NULLS LAST, created_at DESC
   LIMIT 1 FOR UPDATE;
  v_has_payment := FOUND;
  v_payment_paid := v_has_payment AND v_payment.status = 'paid';
  v_fee_paise := round(greatest(coalesce(v_booking.platform_fee, 0), 0) * 100)::bigint;

  IF v_payment_paid THEN
    IF nullif(v_payment.provider_payment_id, '') IS NULL THEN
      RAISE EXCEPTION 'Paid payment is missing its provider reference; contact support before cancelling.' USING errcode = '55000';
    END IF;
    v_paid_paise := round(v_payment.amount * 100)::bigint;
    v_refund_paise := greatest(v_paid_paise - v_fee_paise, 0);
  END IF;

  INSERT INTO public.booking_cancellations (
    booking_id, customer_id, payment_id, refund_amount_paise,
    platform_fee_paise, status, provider_status
  ) VALUES (
    p_booking_id, v_customer_id,
    CASE WHEN v_has_payment THEN v_payment.id ELSE NULL END,
    v_refund_paise, v_fee_paise,
    CASE WHEN v_payment_paid AND v_refund_paise > 0 THEN 'refund_pending' ELSE 'cancelled' END,
    CASE WHEN v_has_payment AND NOT v_payment_paid THEN 'awaiting_payment' ELSE NULL END
  ) RETURNING * INTO v_cancel;

  UPDATE public.bookings SET status = 'cancelled', updated_at = now()
   WHERE id = p_booking_id;
  UPDATE public.booking_assignments
     SET status = 'cancelled', responded_at = now(),
         rejection_reason = 'Booking cancelled by customer.'
   WHERE booking_id = p_booking_id AND status IN ('pending', 'accepted');

  IF v_booking.assigned_washer_id IS NOT NULL THEN
    UPDATE public.washers w SET status = 'available', updated_at = now()
     WHERE w.id = v_booking.assigned_washer_id AND w.status = 'busy'
       AND NOT EXISTS (
         SELECT 1 FROM public.bookings b
          WHERE b.assigned_washer_id = w.id AND b.id <> p_booking_id
            AND b.status::text IN ('washer_assigned', 'washer_on_the_way', 'washer_arrived', 'otp_verified', 'service_started', 'service_completed')
       );
  END IF;

  RETURN to_jsonb(v_cancel);
END;
$function$;

REVOKE ALL ON FUNCTION public.cancel_customer_booking(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_customer_booking(uuid, uuid) TO service_role;

COMMIT;
NOTIFY pgrst, 'reload schema';





-- ===== migrations/20261016080000_add_unique_review_per_booking.sql =====

-- Enforce one customer review per booking, including concurrent requests.
-- Before running, resolve any existing duplicate booking_id values in reviews.
BEGIN;

DO $block$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.reviews
     GROUP BY booking_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate reviews already exist. Resolve duplicate booking_id rows before applying this migration.';
  END IF;
END;
$block$;

CREATE UNIQUE INDEX IF NOT EXISTS reviews_one_per_booking_idx
  ON public.reviews (booking_id);

COMMIT;





-- ===== migrations/20261016090000_repair_booking_location_fields.sql =====

-- Run once in the existing project's Supabase SQL Editor as database owner.
-- Adds the booking address snapshot fields required by checkout. No rows are deleted.
BEGIN;
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS flat_number text,
  ADD COLUMN IF NOT EXISTS landmark text;
COMMIT;
NOTIFY pgrst, 'reload schema';

-- All four fields should appear below after applying the repair.
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'bookings'
  AND column_name IN ('latitude', 'longitude', 'flat_number', 'landmark')
ORDER BY column_name;





-- ===== migrations/20261016100000_repair_customer_offers.sql =====

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





-- ===== migrations/20261016110000_repair_vehicle_seating_capacity.sql =====

-- Add vehicle seating capacity for vehicle-specific package pricing.
-- Existing rows remain nullable so no seat counts are guessed or fabricated.
-- Safe to re-run in the Supabase SQL Editor as database owner.
BEGIN;

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS seating_capacity integer;

DO $block$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conrelid = 'public.vehicles'::regclass
       AND conname = 'vehicles_seating_capacity_range_check'
  ) THEN
    ALTER TABLE public.vehicles
      ADD CONSTRAINT vehicles_seating_capacity_range_check
      CHECK (seating_capacity IS NULL OR seating_capacity BETWEEN 2 AND 20);
  END IF;
END;
$block$;

NOTIFY pgrst, 'reload schema';
COMMIT;





-- ===== migrations/20261016120000_repair_service_photo_uploads.sql =====

-- Configure the private storage bucket and metadata table used by washer photos.
-- Safe to run again in the Supabase SQL Editor as a database owner.
BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-photos',
  'service-photos',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE TABLE IF NOT EXISTS public.booking_service_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  photo_type text NOT NULL CHECK (photo_type IN ('before', 'after')),
  photo_url text NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_service_photos
  ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS booking_id uuid,
  ADD COLUMN IF NOT EXISTS photo_type text,
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS uploaded_by uuid,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE public.booking_service_photos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.booking_service_photos FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_service_photos TO service_role;

CREATE INDEX IF NOT EXISTS booking_service_photos_booking_created_idx
  ON public.booking_service_photos (booking_id, created_at);

COMMIT;





-- ===== migrations/20261016130000_disable_automatic_washer_assignment.sql =====

-- Disable the old nearest-washer auto-offer RPC. Supervisors must review the
-- live nearby washer list and explicitly select a washer before an offer exists.
BEGIN;
DROP FUNCTION IF EXISTS public.auto_assign_booking_to_nearest_washer(uuid);
COMMIT;
NOTIFY pgrst, 'reload schema';





-- ===== migrations/20261016140000_repair_washer_assignment_acceptance.sql =====

-- Washer assignments follow this lifecycle:
-- signup -> complete profile -> supervisor verification -> washer goes online
-- -> receives an eligible offer -> accepts and confirms that offer.
-- Run in Supabase SQL Editor as database owner. Safe to re-run.
BEGIN;

-- Keep the registered service pin separate from the changing live GPS pin.
ALTER TABLE public.washer_locations
  ADD COLUMN IF NOT EXISTS service_latitude double precision,
  ADD COLUMN IF NOT EXISTS service_longitude double precision;

CREATE OR REPLACE FUNCTION public.booking_washer_is_eligible(
  p_booking_id uuid,
  p_washer_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_booking record;
  v_washer record;
  v_location record;
  v_package record;
  v_distance_km double precision;
  v_washer_latitude double precision;
  v_washer_longitude double precision;
  v_conflict boolean;
BEGIN
  SELECT id, status, assigned_washer_id, package_id, scheduled_date,
         scheduled_start_time, latitude, longitude, service_address
    INTO v_booking
    FROM public.bookings
   WHERE id = p_booking_id;

  IF NOT FOUND OR v_booking.assigned_washer_id IS NOT NULL
     OR v_booking.status NOT IN ('pending', 'confirmed', 'finding_washer', 'support_escalated')
     OR v_booking.scheduled_date IS NULL OR v_booking.scheduled_start_time IS NULL
     OR v_booking.latitude IS NULL OR v_booking.longitude IS NULL THEN
    RETURN false;
  END IF;

  SELECT id, status, is_active, is_verified, current_address
    INTO v_washer
    FROM public.washers
   WHERE id = p_washer_id;

  IF NOT FOUND OR v_washer.is_active IS DISTINCT FROM true OR v_washer.is_verified IS DISTINCT FROM true
     OR v_washer.status IS DISTINCT FROM 'available' THEN
    RETURN false;
  END IF;

  -- A saved, encrypted payout destination is required before any job offer can
  -- be sent or accepted. Provider credentials are not needed for this check.
  IF NOT EXISTS (
    SELECT 1 FROM public.washer_payout_accounts payout
     WHERE payout.washer_id = p_washer_id
       AND payout.account_label IS NOT NULL
       AND (payout.destination_encrypted IS NOT NULL OR payout.fund_account_id IS NOT NULL)
  ) THEN
    RETURN false;
  END IF;

  SELECT latitude, longitude, updated_at, service_latitude, service_longitude
    INTO v_location
    FROM public.washer_locations
   WHERE washer_id = p_washer_id;

  IF NOT FOUND OR v_location.updated_at IS NULL OR v_location.latitude IS NULL
     OR v_location.longitude IS NULL OR v_location.latitude NOT BETWEEN -90 AND 90
     OR v_location.longitude NOT BETWEEN -180 AND 180
     OR v_location.updated_at < now() - interval '15 minutes' THEN
    RETURN false;
  END IF;

  v_washer_latitude := coalesce(v_location.service_latitude, v_location.latitude);
  v_washer_longitude := coalesce(v_location.service_longitude, v_location.longitude);
  v_distance_km := 2 * 6371 * asin(sqrt(least(1::double precision, greatest(0::double precision,
    power(sin(radians((v_washer_latitude - v_booking.latitude) / 2)), 2) +
    cos(radians(v_booking.latitude)) * cos(radians(v_washer_latitude)) *
    power(sin(radians((v_washer_longitude - v_booking.longitude) / 2)), 2)
  ))));

  -- Identical saved street addresses are treated as the same service location;
  -- this handles legacy GPS pins that were overwritten while a washer was online.
  IF nullif(regexp_replace(lower(coalesce(v_booking.service_address, '')), '[^[:alnum:]]', '', 'g'), '')
     = nullif(regexp_replace(lower(coalesce(v_washer.current_address, '')), '[^[:alnum:]]', '', 'g'), '') THEN
    v_distance_km := 0;
  END IF;

  -- Washer distance is shown to supervisors for context. Do not block offers
  -- by the profile radius; online status, live location, payout, and schedule
  -- checks below still apply.

  SELECT duration_minutes INTO v_package
    FROM public.service_packages WHERE id = v_booking.package_id;

  SELECT EXISTS (
    SELECT 1
      FROM public.bookings existing
      LEFT JOIN public.service_packages existing_package ON existing_package.id = existing.package_id
     WHERE existing.assigned_washer_id = p_washer_id AND existing.id <> p_booking_id
       AND existing.status IN ('washer_assigned', 'washer_on_the_way', 'washer_arrived',
                               'otp_verified', 'service_started', 'service_completed')
       AND existing.scheduled_date IS NOT NULL AND existing.scheduled_start_time IS NOT NULL
       AND (v_booking.scheduled_date::date + v_booking.scheduled_start_time::time) <
           (existing.scheduled_date::date + existing.scheduled_start_time::time
             + make_interval(mins => coalesce(existing_package.duration_minutes, 60)))
       AND (existing.scheduled_date::date + existing.scheduled_start_time::time) <
           (v_booking.scheduled_date::date + v_booking.scheduled_start_time::time
             + make_interval(mins => coalesce(v_package.duration_minutes, 60)))
  ) INTO v_conflict;

  RETURN NOT v_conflict;
END;
$function$;

-- Drop first so this repair also works when an older deployment returned UUID.
DROP FUNCTION IF EXISTS public.accept_booking_assignment(uuid);

CREATE FUNCTION public.accept_booking_assignment(p_assignment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_washer public.washers%rowtype;
  v_assignment public.booking_assignments%rowtype;
  v_booking public.bookings%rowtype;
  v_profile_role text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING errcode = '28000';
  END IF;

  SELECT role INTO v_profile_role FROM public.profiles
   WHERE id = v_user_id AND is_active = true;
  IF NOT FOUND OR v_profile_role IS DISTINCT FROM 'washer' THEN
    RAISE EXCEPTION 'Active washer account required.' USING errcode = '42501';
  END IF;

  SELECT * INTO v_washer FROM public.washers
   WHERE user_id = v_user_id AND is_active = true
   FOR UPDATE;
  IF NOT FOUND OR v_washer.is_verified IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Supervisor verification is required before accepting jobs.' USING errcode = '42501';
  END IF;
  IF v_washer.status IS DISTINCT FROM 'available' THEN
    RAISE EXCEPTION 'Go online before accepting a booking.' USING errcode = '40001';
  END IF;

  SELECT * INTO v_assignment FROM public.booking_assignments
   WHERE id = p_assignment_id;
  IF NOT FOUND OR v_assignment.washer_id <> v_washer.id THEN
    RAISE EXCEPTION 'Assignment not found.' USING errcode = '42501';
  END IF;
  IF v_assignment.status <> 'pending' OR v_assignment.expires_at IS NULL
     OR v_assignment.expires_at <= now() THEN
    RAISE EXCEPTION 'Assignment is no longer available.' USING errcode = '40001';
  END IF;

  SELECT * INTO v_booking FROM public.bookings
   WHERE id = v_assignment.booking_id FOR UPDATE;
  IF NOT FOUND OR NOT public.booking_washer_is_eligible(v_booking.id, v_washer.id) THEN
    RAISE EXCEPTION 'Booking is no longer eligible for this washer.' USING errcode = '40001';
  END IF;

  SELECT * INTO v_assignment FROM public.booking_assignments
   WHERE id = p_assignment_id FOR UPDATE;
  IF NOT FOUND OR v_assignment.washer_id IS DISTINCT FROM v_washer.id
     OR v_assignment.status IS DISTINCT FROM 'pending'
     OR v_assignment.expires_at IS NULL OR v_assignment.expires_at <= now() THEN
    RAISE EXCEPTION 'Assignment is no longer available.' USING errcode = '40001';
  END IF;

  UPDATE public.bookings
     SET assigned_washer_id = v_washer.id,
         status = 'washer_assigned',
         requires_supervisor = false,
         updated_at = now()
   WHERE id = v_booking.id RETURNING * INTO v_booking;

  UPDATE public.booking_assignments
     SET status = 'accepted', responded_at = now()
   WHERE id = v_assignment.id RETURNING * INTO v_assignment;

  -- A booking has one confirmed washer; clear every other outstanding offer.
  UPDATE public.booking_assignments
     SET status = 'cancelled', responded_at = now(),
         rejection_reason = 'Another washer accepted this booking.'
   WHERE booking_id = v_booking.id AND id <> v_assignment.id AND status = 'pending';

  UPDATE public.washers SET status = 'busy', updated_at = now()
   WHERE id = v_washer.id;

  RETURN jsonb_build_object('booking', to_jsonb(v_booking), 'assignment', to_jsonb(v_assignment));
END;
$function$;

-- Backend wrapper for the service-role API. The API resolves p_washer_id from
-- the authenticated user before calling this function. Do not grant this to
-- anon or authenticated because those roles could choose arbitrary washer IDs.
CREATE OR REPLACE FUNCTION public.accept_booking_assignment_for_user(
  p_assignment_id uuid,
  p_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_washer public.washers%rowtype;
  v_assignment public.booking_assignments%rowtype;
  v_booking public.bookings%rowtype;
BEGIN
  IF p_user_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND role = 'washer' AND is_active = true) THEN
    RAISE EXCEPTION 'Active washer account required.' USING errcode = '42501';
  END IF;
  SELECT * INTO v_washer FROM public.washers WHERE user_id = p_user_id AND is_active = true FOR UPDATE;
  IF NOT FOUND OR v_washer.is_verified IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Supervisor verification is required before accepting jobs.' USING errcode = '42501';
  END IF;
  IF v_washer.status IS DISTINCT FROM 'available' THEN
    RAISE EXCEPTION 'Go online before accepting a booking.' USING errcode = '40001';
  END IF;
  SELECT * INTO v_assignment FROM public.booking_assignments WHERE id = p_assignment_id;
  IF NOT FOUND OR v_assignment.washer_id <> v_washer.id THEN
    RAISE EXCEPTION 'Assignment not found.' USING errcode = '42501';
  END IF;
  IF v_assignment.status <> 'pending' OR v_assignment.expires_at IS NULL OR v_assignment.expires_at <= now() THEN
    RAISE EXCEPTION 'Assignment is no longer available.' USING errcode = '40001';
  END IF;
  SELECT * INTO v_booking FROM public.bookings WHERE id = v_assignment.booking_id FOR UPDATE;
  IF NOT FOUND OR NOT public.booking_washer_is_eligible(v_booking.id, v_washer.id) THEN
    RAISE EXCEPTION 'Booking is no longer eligible for this washer.' USING errcode = '40001';
  END IF;
  SELECT * INTO v_assignment FROM public.booking_assignments WHERE id = p_assignment_id FOR UPDATE;
  IF NOT FOUND OR v_assignment.washer_id IS DISTINCT FROM v_washer.id
     OR v_assignment.status IS DISTINCT FROM 'pending' OR v_assignment.expires_at IS NULL OR v_assignment.expires_at <= now() THEN
    RAISE EXCEPTION 'Assignment is no longer available.' USING errcode = '40001';
  END IF;
  UPDATE public.bookings SET assigned_washer_id = v_washer.id, status = 'washer_assigned',
    requires_supervisor = false, updated_at = now()
   WHERE id = v_booking.id RETURNING * INTO v_booking;
  UPDATE public.booking_assignments SET status = 'accepted', responded_at = now()
   WHERE id = v_assignment.id RETURNING * INTO v_assignment;
  UPDATE public.booking_assignments SET status = 'cancelled', responded_at = now(),
    rejection_reason = 'Another washer accepted this booking.'
   WHERE booking_id = v_booking.id AND id <> v_assignment.id AND status = 'pending';
  UPDATE public.washers SET status = 'busy', updated_at = now() WHERE id = v_washer.id;
  RETURN jsonb_build_object('booking', to_jsonb(v_booking), 'assignment', to_jsonb(v_assignment));
END;
$function$;

CREATE OR REPLACE FUNCTION public.accept_booking_assignment_for_washer(
  p_assignment_id uuid,
  p_washer_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE v_user_id uuid;
BEGIN
  SELECT user_id INTO v_user_id FROM public.washers
   WHERE id = p_washer_id AND is_active = true AND is_verified = true;
  IF NOT FOUND OR v_user_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id AND role = 'washer' AND is_active = true) THEN
    RAISE EXCEPTION 'Active verified washer account required.' USING errcode = '42501';
  END IF;
  RETURN public.accept_booking_assignment_for_user(p_assignment_id, v_user_id);
END;
$function$;

-- Supervisor selection creates an offer only. Acceptance confirms the washer.
DROP FUNCTION IF EXISTS public.supervisor_assign_washer(uuid, uuid, uuid);
CREATE FUNCTION public.supervisor_assign_washer(
  p_booking_id uuid, p_washer_id uuid, p_supervisor_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $function$
DECLARE
  v_assignment public.booking_assignments%rowtype;
  v_attempt integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_supervisor_id
    AND role = 'supervisor' AND is_active = true) THEN
    RAISE EXCEPTION 'Active supervisor account required.' USING errcode = '42501';
  END IF;
  -- Match acceptance lock order: washer, then booking, then offers.
  PERFORM 1 FROM public.washers WHERE id = p_washer_id FOR UPDATE;
  PERFORM 1 FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT public.booking_washer_is_eligible(p_booking_id, p_washer_id) THEN
    RAISE EXCEPTION 'Washer is no longer eligible for this booking.' USING errcode = '40001';
  END IF;
  IF EXISTS (SELECT 1 FROM public.booking_assignments WHERE booking_id = p_booking_id
    AND status = 'pending' AND expires_at > now()) THEN
    RAISE EXCEPTION 'An offer is already waiting for washer acceptance.' USING errcode = '40001';
  END IF;
  SELECT coalesce(max(attempt_number), 0) + 1 INTO v_attempt
    FROM public.booking_assignments WHERE booking_id = p_booking_id;
  UPDATE public.booking_assignments SET status = 'expired', responded_at = now()
    WHERE booking_id = p_booking_id AND status = 'pending';
  SELECT * INTO v_assignment FROM public.booking_assignments
    WHERE booking_id = p_booking_id AND washer_id = p_washer_id FOR UPDATE;
  IF FOUND THEN
    UPDATE public.booking_assignments SET status = 'pending', offered_at = now(),
      expires_at = now() + interval '2 minutes', responded_at = null,
      rejection_reason = null, attempt_number = v_attempt
      WHERE id = v_assignment.id RETURNING * INTO v_assignment;
  ELSE
    INSERT INTO public.booking_assignments
      (id, booking_id, washer_id, status, offered_at, expires_at, attempt_number)
    VALUES (gen_random_uuid(), p_booking_id, p_washer_id, 'pending', now(),
      now() + interval '2 minutes', v_attempt) RETURNING * INTO v_assignment;
  END IF;
  UPDATE public.bookings SET status = 'finding_washer', requires_supervisor = false,
    updated_at = now() WHERE id = p_booking_id;
  RETURN to_jsonb(v_assignment);
END;
$function$;
REVOKE ALL ON FUNCTION public.supervisor_assign_washer(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.supervisor_assign_washer(uuid, uuid, uuid) TO service_role;

REVOKE ALL ON FUNCTION public.booking_washer_is_eligible(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.accept_booking_assignment(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_booking_assignment(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.accept_booking_assignment_for_washer(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_booking_assignment_for_washer(uuid, uuid) TO service_role;
REVOKE ALL ON FUNCTION public.accept_booking_assignment_for_user(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.booking_washer_is_eligible(uuid, uuid) TO service_role;

COMMIT;
NOTIFY pgrst, 'reload schema';

-- Confirmation: accept RPC must now return jsonb.
SELECT p.proname, pg_get_function_result(p.oid) AS result_type
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.proname = 'accept_booking_assignment';





-- ===== migrations/20261016150000_carwash_payment_and_supervisor_assignment.sql =====

-- Consolidated feature migration for the existing Car Wash application.
-- This upgrades an existing schema. It is NOT a clean-install/baseline script.
-- Prerequisites: profiles, washers, bookings, booking_assignments,
-- washer_locations, washer_payout_accounts, service_packages, washer_skills,
-- washer_availability, payments, customers, and auth.uid() already exist.
-- Review duplicate active payment rows before applying this script.

BEGIN;

-- A booking paid before assignment stays payment_completed until an offer is
-- accepted. Add the label before installing RPCs that store it. PostgreSQL
-- commits this enum addition separately from transactional migration work.
DO $migration$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
      WHERE n.nspname='public' AND t.typname='booking_status' AND t.typtype='e') THEN
    ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'payment_completed';
  END IF;
END;
$migration$;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS requires_supervisor boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS service_completed_at timestamptz;

ALTER TABLE public.washer_locations
  ADD COLUMN IF NOT EXISTS service_latitude double precision,
  ADD COLUMN IF NOT EXISTS service_longitude double precision;

CREATE TABLE IF NOT EXISTS public.supervisor_service_areas (
  supervisor_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  address text NOT NULL CHECK (char_length(btrim(address)) BETWEEN 10 AND 500),
  latitude double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.supervisor_service_areas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.supervisor_service_areas FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supervisor_service_areas TO service_role;

-- Do not silently delete/reconcile live financial records to make this index.
DO $migration$
BEGIN
  IF EXISTS (
    SELECT booking_id FROM public.payments
     WHERE booking_id IS NOT NULL AND status IN ('created', 'paid')
     GROUP BY booking_id HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Multiple active payments exist for a booking. Reconcile them before applying this migration.';
  END IF;
END;
$migration$;
CREATE UNIQUE INDEX IF NOT EXISTS payments_one_active_per_booking_idx
  ON public.payments (booking_id)
  WHERE booking_id IS NOT NULL AND status IN ('created', 'paid');

CREATE OR REPLACE FUNCTION public.complete_booking_payment(
  p_payment_id uuid,
  p_provider_payment_id text,
  p_provider_method text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $function$
DECLARE
  v_payment public.payments%rowtype;
  v_booking public.bookings%rowtype;
  v_outcome text;
BEGIN
  SELECT * INTO v_payment FROM public.payments
   WHERE id = p_payment_id AND lower(coalesce(provider, '')) = 'razorpay';
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found.' USING errcode = 'P0002'; END IF;
  SELECT * INTO v_booking FROM public.bookings WHERE id = v_payment.booking_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found.' USING errcode = 'P0002'; END IF;
  SELECT * INTO v_payment FROM public.payments WHERE id = p_payment_id FOR UPDATE;
  IF v_payment.status = 'paid' THEN
    IF v_payment.provider_payment_id IS DISTINCT FROM p_provider_payment_id THEN
      RAISE EXCEPTION 'Payment was completed with a different provider payment.' USING errcode = '23505';
    END IF;
  ELSE
    IF v_payment.status <> 'created' OR p_provider_payment_id IS NULL OR btrim(p_provider_payment_id) = '' THEN
      RAISE EXCEPTION 'Payment is not an active captured payment.' USING errcode = '55000';
    END IF;
    UPDATE public.payments SET status = 'paid', provider_payment_id = p_provider_payment_id,
      provider_method = coalesce(nullif(p_provider_method, ''), provider_method),
      paid_at = coalesce(paid_at, now()), updated_at = now()
     WHERE id = p_payment_id RETURNING * INTO v_payment;
  END IF;

  IF v_booking.status::text = 'cancelled' THEN
    v_outcome := 'cancelled';
  ELSE
    IF v_booking.status::text NOT IN (
      'pending','confirmed','finding_washer','support_escalated','washer_assigned',
      'washer_on_the_way','washer_arrived','otp_verified','service_started',
      'service_completed','customer_confirmed','payment_completed','closed'
    ) THEN RAISE EXCEPTION 'Booking cannot be completed for payment.' USING errcode = '55000'; END IF;
    IF abs(v_payment.amount - v_booking.total_amount) > 0.01 THEN
      RAISE EXCEPTION 'Payment amount does not match the booking.' USING errcode = '22023';
    END IF;
    IF v_booking.status::text NOT IN ('customer_confirmed','payment_completed','closed') THEN
      UPDATE public.bookings SET status = 'payment_completed', requires_supervisor = true, updated_at = now()
       WHERE id = v_booking.id RETURNING * INTO v_booking;
    END IF;
    v_outcome := 'completed';
  END IF;
  RETURN jsonb_build_object('success', true, 'outcome', v_outcome,
    'booking_id', v_booking.id, 'status', v_booking.status);
END;
$function$;
REVOKE ALL ON FUNCTION public.complete_booking_payment(uuid,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_booking_payment(uuid,text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.reserve_razorpay_payment_order(p_booking_id uuid,p_customer_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $function$
DECLARE b public.bookings%rowtype; p public.payments%rowtype; made boolean:=false; online boolean;
BEGIN
  SELECT * INTO b FROM public.bookings WHERE id=p_booking_id AND customer_id=p_customer_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found.' USING errcode='P0002'; END IF;
  online:=lower(coalesce(b.payment_method::text,'')) NOT IN ('cod','cash');
  IF b.status::text IN ('cancelled','expired') THEN RAISE EXCEPTION 'This booking is not available for checkout.' USING errcode='55000'; END IF;
  IF online AND b.status::text='pending' AND b.created_at<=now()-interval '30 minutes' THEN RAISE EXCEPTION 'The booking payment window has expired.' USING errcode='55000'; END IF;
  IF (NOT online AND b.status::text NOT IN ('customer_confirmed','closed')) OR
     (online AND b.status::text NOT IN ('pending','confirmed','finding_washer','support_escalated','washer_assigned','washer_on_the_way','washer_arrived','otp_verified','service_started','service_completed','customer_confirmed','payment_completed','closed')) THEN
    RAISE EXCEPTION 'This booking is not eligible for online payment.' USING errcode='55000';
  END IF;
  IF b.total_amount IS NULL OR b.total_amount<=0 THEN RAISE EXCEPTION 'Invalid booking amount.' USING errcode='22023'; END IF;
  UPDATE public.payments SET status='failed',updated_at=now() WHERE booking_id=p_booking_id AND status='created' AND provider_order_id IS NULL AND created_at<=now()-interval '2 minutes';
  SELECT * INTO p FROM public.payments WHERE booking_id=p_booking_id AND status IN ('created','paid') ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.payments(booking_id,customer_id,amount,payment_method,status,provider)
      VALUES(p_booking_id,p_customer_id,b.total_amount,'online','created','razorpay') RETURNING * INTO p;
    made:=true;
  END IF;
  RETURN jsonb_build_object('booking',to_jsonb(b),'payment',to_jsonb(p),'created',made);
END;
$function$;
REVOKE ALL ON FUNCTION public.reserve_razorpay_payment_order(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_razorpay_payment_order(uuid,uuid) TO service_role;

-- Earlier migrations return jsonb; PostgreSQL cannot change a function's
-- return type with CREATE OR REPLACE. Drop the same signature first.
DROP FUNCTION IF EXISTS public.record_cod_payment_once(uuid, uuid);
CREATE FUNCTION public.record_cod_payment_once(
  p_booking_id uuid, p_washer_id uuid
) RETURNS public.payments
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $function$
DECLARE v_booking public.bookings%rowtype; v_payment public.payments%rowtype;
BEGIN
  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND OR v_booking.assigned_washer_id IS DISTINCT FROM p_washer_id THEN
    RAISE EXCEPTION 'Booking is not assigned to this washer.' USING errcode = '42501';
  END IF;
  IF v_booking.payment_method::text NOT IN ('cod','cash') OR v_booking.status::text NOT IN
    ('service_completed','customer_confirmed','payment_completed','closed')
    OR v_booking.service_validated_at IS NULL THEN
    RAISE EXCEPTION 'Booking is not ready for cash payment.' USING errcode = '55000';
  END IF;
  SELECT * INTO v_payment FROM public.payments WHERE booking_id = p_booking_id AND status = 'paid'
    ORDER BY paid_at DESC NULLS LAST LIMIT 1 FOR UPDATE;
  IF FOUND THEN RETURN v_payment; END IF;
  INSERT INTO public.payments(booking_id, customer_id, amount, payment_method, status, provider, paid_at)
  VALUES (p_booking_id, v_booking.customer_id, v_booking.total_amount, 'cod', 'paid', 'cash', now())
  RETURNING * INTO v_payment;
  RETURN v_payment;
END;
$function$;
REVOKE ALL ON FUNCTION public.record_cod_payment_once(uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_cod_payment_once(uuid,uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.booking_washer_is_eligible(p_booking_id uuid, p_washer_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $function$
DECLARE b record; w record; loc record; pkg record; d double precision; conflict boolean;
BEGIN
  SELECT id,status,assigned_washer_id,package_id,scheduled_date,scheduled_start_time,latitude,longitude,service_address
    INTO b FROM public.bookings WHERE id = p_booking_id;
  IF NOT FOUND OR b.assigned_washer_id IS NOT NULL OR b.status::text NOT IN
     ('pending','confirmed','finding_washer','support_escalated','payment_completed')
     OR b.scheduled_date IS NULL OR b.scheduled_start_time IS NULL OR b.latitude IS NULL OR b.longitude IS NULL THEN RETURN false; END IF;
  SELECT id,status,is_active,is_verified,current_address,supervisor_id,service_radius_km
    INTO w FROM public.washers WHERE id = p_washer_id;
  IF NOT FOUND OR w.is_active IS DISTINCT FROM true OR w.is_verified IS DISTINCT FROM true OR w.status::text <> 'available' THEN RETURN false; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.washer_payout_accounts p WHERE p.washer_id=p_washer_id
      AND p.account_label IS NOT NULL AND (p.destination_encrypted IS NOT NULL OR p.fund_account_id IS NOT NULL)) THEN RETURN false; END IF;
  SELECT latitude,longitude,updated_at,service_latitude,service_longitude INTO loc
    FROM public.washer_locations WHERE washer_id=p_washer_id;
  IF NOT FOUND OR loc.updated_at IS NULL OR loc.latitude IS NULL OR loc.longitude IS NULL
     OR loc.latitude NOT BETWEEN -90 AND 90 OR loc.longitude NOT BETWEEN -180 AND 180
     OR loc.updated_at < now()-interval '15 minutes' THEN RETURN false; END IF;
  d := 2*6371*asin(sqrt(least(1::double precision,greatest(0::double precision,
    power(sin(radians((coalesce(loc.service_latitude,loc.latitude)-b.latitude)/2)),2)
    +cos(radians(b.latitude))*cos(radians(coalesce(loc.service_latitude,loc.latitude)))
    *power(sin(radians((coalesce(loc.service_longitude,loc.longitude)-b.longitude)/2)),2)))));
  IF nullif(regexp_replace(lower(coalesce(b.service_address,'')),'[^[:alnum:]]','','g'),'')
     = nullif(regexp_replace(lower(coalesce(w.current_address,'')),'[^[:alnum:]]','','g'),'') THEN d:=0; END IF;
  SELECT duration_minutes INTO pkg FROM public.service_packages WHERE id=b.package_id;
  IF d > least(greatest(coalesce(w.service_radius_km,5),5),100) THEN RETURN false; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.washer_availability a WHERE a.washer_id=p_washer_id
      AND a.day_of_week=extract(dow from b.scheduled_date)::integer AND a.is_available=true
      AND a.start_time <= b.scheduled_start_time AND a.end_time >= b.scheduled_start_time + make_interval(mins=>coalesce(pkg.duration_minutes,60))) THEN RETURN false; END IF;
  SELECT EXISTS (SELECT 1 FROM public.bookings x LEFT JOIN public.service_packages xp ON xp.id=x.package_id
    WHERE x.assigned_washer_id=p_washer_id AND x.id<>p_booking_id
      AND x.status::text IN ('washer_assigned','washer_on_the_way','washer_arrived','otp_verified','service_started','service_completed')
      AND (b.scheduled_date+b.scheduled_start_time) < (x.scheduled_date+x.scheduled_start_time+make_interval(mins=>coalesce(xp.duration_minutes,60)+30))
      AND (x.scheduled_date+x.scheduled_start_time) < (b.scheduled_date+b.scheduled_start_time+make_interval(mins=>coalesce(pkg.duration_minutes,60)+30))) INTO conflict;
  RETURN NOT conflict;
END;
$function$;

DROP FUNCTION IF EXISTS public.accept_booking_assignment(uuid);
CREATE FUNCTION public.accept_booking_assignment(p_assignment_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $function$
DECLARE uid uuid:=auth.uid(); w public.washers%rowtype; a public.booking_assignments%rowtype; b public.bookings%rowtype;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required.' USING errcode='28000'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=uid AND role='washer' AND is_active=true) THEN RAISE EXCEPTION 'Active washer account required.' USING errcode='42501'; END IF;
  SELECT * INTO w FROM public.washers WHERE user_id=uid AND is_active=true FOR UPDATE;
  IF NOT FOUND OR NOT w.is_verified THEN RAISE EXCEPTION 'Supervisor verification is required before accepting jobs.' USING errcode='42501'; END IF;
  IF w.status::text<>'available' THEN RAISE EXCEPTION 'Go online before accepting a booking.' USING errcode='40001'; END IF;
  SELECT * INTO a FROM public.booking_assignments WHERE id=p_assignment_id;
  IF NOT FOUND OR a.washer_id IS DISTINCT FROM w.id THEN RAISE EXCEPTION 'Assignment not found.' USING errcode='42501'; END IF;
  IF a.status<>'pending' OR a.expires_at<=now() THEN RAISE EXCEPTION 'Assignment is no longer available.' USING errcode='40001'; END IF;
  SELECT * INTO b FROM public.bookings WHERE id=a.booking_id FOR UPDATE;
  IF NOT FOUND OR NOT public.booking_washer_is_eligible(b.id,w.id) THEN RAISE EXCEPTION 'Booking is no longer eligible for this washer.' USING errcode='40001'; END IF;
  SELECT * INTO a FROM public.booking_assignments WHERE id=p_assignment_id FOR UPDATE;
  IF a.status<>'pending' OR a.expires_at<=now() THEN RAISE EXCEPTION 'Assignment is no longer available.' USING errcode='40001'; END IF;
  EXECUTE 'UPDATE public.bookings SET assigned_washer_id=$1, status=CASE WHEN status::text=''payment_completed'' THEN status ELSE ''washer_assigned'' END, requires_supervisor=false, updated_at=now() WHERE id=$2 RETURNING *'
    INTO b USING w.id,b.id;
  UPDATE public.booking_assignments SET status='accepted',responded_at=now() WHERE id=a.id RETURNING * INTO a;
  UPDATE public.booking_assignments SET status='cancelled',responded_at=now(),rejection_reason='Another washer accepted this booking.'
    WHERE booking_id=b.id AND id<>a.id AND status='pending';
  UPDATE public.washers SET status='busy',updated_at=now() WHERE id=w.id;
  RETURN jsonb_build_object('booking',to_jsonb(b),'assignment',to_jsonb(a));
END;
$function$;

CREATE OR REPLACE FUNCTION public.accept_booking_assignment_for_washer(p_assignment_id uuid,p_washer_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $function$
DECLARE uid uuid;
BEGIN
  SELECT user_id INTO uid FROM public.washers WHERE id=p_washer_id AND is_active=true AND is_verified=true;
  IF uid IS NULL THEN RAISE EXCEPTION 'Active verified washer account required.' USING errcode='42501'; END IF;
  RETURN public.accept_booking_assignment_for_user(p_assignment_id,uid);
END;
$function$;

-- Application routes resolve the washer from the authenticated user first.
CREATE OR REPLACE FUNCTION public.accept_booking_assignment_for_user(p_assignment_id uuid,p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $function$
DECLARE w public.washers%rowtype; a public.booking_assignments%rowtype; b public.bookings%rowtype;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_user_id AND role='washer' AND is_active=true) THEN RAISE EXCEPTION 'Active washer account required.' USING errcode='42501'; END IF;
  SELECT * INTO w FROM public.washers WHERE user_id=p_user_id AND is_active=true FOR UPDATE;
  IF NOT FOUND OR NOT w.is_verified THEN RAISE EXCEPTION 'Supervisor verification is required before accepting jobs.' USING errcode='42501'; END IF;
  IF w.status::text<>'available' THEN RAISE EXCEPTION 'Go online before accepting a booking.' USING errcode='40001'; END IF;
  SELECT * INTO a FROM public.booking_assignments WHERE id=p_assignment_id;
  IF NOT FOUND OR a.washer_id IS DISTINCT FROM w.id THEN RAISE EXCEPTION 'Assignment not found.' USING errcode='42501'; END IF;
  IF a.status<>'pending' OR a.expires_at<=now() THEN RAISE EXCEPTION 'Assignment is no longer available.' USING errcode='40001'; END IF;
  SELECT * INTO b FROM public.bookings WHERE id=a.booking_id FOR UPDATE;
  IF NOT FOUND OR NOT public.booking_washer_is_eligible(b.id,w.id) THEN RAISE EXCEPTION 'Booking is no longer eligible for this washer.' USING errcode='40001'; END IF;
  SELECT * INTO a FROM public.booking_assignments WHERE id=p_assignment_id FOR UPDATE;
  IF a.status<>'pending' OR a.expires_at<=now() THEN RAISE EXCEPTION 'Assignment is no longer available.' USING errcode='40001'; END IF;
  EXECUTE 'UPDATE public.bookings SET assigned_washer_id=$1, status=CASE WHEN status::text=''payment_completed'' THEN status ELSE ''washer_assigned'' END, requires_supervisor=false, updated_at=now() WHERE id=$2 RETURNING *'
    INTO b USING w.id,b.id;
  UPDATE public.booking_assignments SET status='accepted',responded_at=now() WHERE id=a.id RETURNING * INTO a;
  UPDATE public.booking_assignments SET status='cancelled',responded_at=now(),rejection_reason='Another washer accepted this booking.' WHERE booking_id=b.id AND id<>a.id AND status='pending';
  UPDATE public.washers SET status='busy',updated_at=now() WHERE id=w.id;
  RETURN jsonb_build_object('booking',to_jsonb(b),'assignment',to_jsonb(a));
END;
$function$;

DROP FUNCTION IF EXISTS public.supervisor_assign_washer(uuid,uuid,uuid);
CREATE FUNCTION public.supervisor_assign_washer(p_booking_id uuid,p_washer_id uuid,p_supervisor_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $function$
DECLARE a public.booking_assignments%rowtype; n integer;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_supervisor_id AND role='supervisor' AND is_active=true) THEN RAISE EXCEPTION 'Active supervisor account required.' USING errcode='42501'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.washers WHERE id=p_washer_id AND supervisor_id=p_supervisor_id) THEN RAISE EXCEPTION 'Washer is not linked to this supervisor.' USING errcode='42501'; END IF;
  PERFORM 1 FROM public.washers WHERE id=p_washer_id FOR UPDATE;
  PERFORM 1 FROM public.bookings WHERE id=p_booking_id FOR UPDATE;
  IF NOT public.booking_washer_is_eligible(p_booking_id,p_washer_id) THEN RAISE EXCEPTION 'Washer is no longer eligible for this booking.' USING errcode='40001'; END IF;
  IF EXISTS(SELECT 1 FROM public.booking_assignments WHERE booking_id=p_booking_id AND status='pending' AND expires_at>now()) THEN RAISE EXCEPTION 'An offer is already waiting for washer acceptance.' USING errcode='40001'; END IF;
  SELECT coalesce(max(attempt_number),0)+1 INTO n FROM public.booking_assignments WHERE booking_id=p_booking_id;
  UPDATE public.booking_assignments SET status='expired',responded_at=now() WHERE booking_id=p_booking_id AND status='pending';
  SELECT * INTO a FROM public.booking_assignments WHERE booking_id=p_booking_id AND washer_id=p_washer_id FOR UPDATE;
  IF FOUND THEN
    UPDATE public.booking_assignments SET status='pending',offered_at=now(),expires_at=now()+interval '2 minutes',responded_at=NULL,rejection_reason=NULL,attempt_number=n WHERE id=a.id RETURNING * INTO a;
  ELSE
    INSERT INTO public.booking_assignments(id,booking_id,washer_id,status,offered_at,expires_at,attempt_number)
    VALUES(gen_random_uuid(),p_booking_id,p_washer_id,'pending',now(),now()+interval '2 minutes',n) RETURNING * INTO a;
  END IF;
  EXECUTE 'UPDATE public.bookings SET status=CASE WHEN status::text=''payment_completed'' THEN status ELSE ''finding_washer'' END, requires_supervisor=false, updated_at=now() WHERE id=$1'
    USING p_booking_id;
  RETURN to_jsonb(a);
END;
$function$;

REVOKE ALL ON FUNCTION public.booking_washer_is_eligible(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.booking_washer_is_eligible(uuid,uuid) TO service_role;
REVOKE ALL ON FUNCTION public.accept_booking_assignment(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.accept_booking_assignment(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.accept_booking_assignment_for_washer(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.accept_booking_assignment_for_washer(uuid,uuid) TO service_role;
REVOKE ALL ON FUNCTION public.accept_booking_assignment_for_user(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.accept_booking_assignment_for_user(uuid,uuid) TO service_role;
REVOKE ALL ON FUNCTION public.supervisor_assign_washer(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.supervisor_assign_washer(uuid,uuid,uuid) TO service_role;

COMMIT;
NOTIFY pgrst,'reload schema';



-- ===== migrations/20261110120000_enable_self_service_supervisor_signup.sql =====

-- Public supervisor signup creates an active supervisor profile immediately.
-- Only the requested supervisor role is accepted from signup metadata; other
-- privileged roles still come from trusted app metadata/admin provisioning.
BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  assigned_role public.user_role;
BEGIN
  assigned_role := CASE
    WHEN new.raw_user_meta_data ->> 'requested_role' = 'supervisor'
      THEN 'supervisor'
    WHEN new.raw_app_meta_data ->> 'role' IN (
      'customer', 'washer', 'supervisor', 'support', 'accountant', 'sub_admin', 'super_admin'
    ) THEN new.raw_app_meta_data ->> 'role'
    ELSE 'customer'
  END::public.user_role;

  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    coalesce(nullif(new.raw_user_meta_data ->> 'phone', ''), ''),
    assigned_role
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.customers(user_id)
  SELECT id FROM public.profiles WHERE id = new.id AND role = 'customer'
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_auth_user() FROM public;

-- Apply the same signup intent rule to accounts created before this migration.
-- This touches only profiles whose stored Auth signup metadata explicitly
-- requested supervisor; all other account roles remain unchanged.
UPDATE public.profiles AS profile
SET role = 'supervisor'::public.user_role,
    updated_at = now()
FROM auth.users AS auth_user
WHERE auth_user.id = profile.id
  AND auth_user.raw_user_meta_data ->> 'requested_role' = 'supervisor'
  AND profile.role = 'customer';

COMMIT;



-- ===== migrations/20261111100000_allow_manual_customer_signup_addresses.sql =====

-- Customers may save a complete postal address at signup without selecting a
-- map pin. Coordinates remain optional on saved addresses; checkout still
-- requires a map point to check service coverage and guide the washer.
BEGIN;

ALTER TABLE public.customer_addresses
  ALTER COLUMN latitude DROP NOT NULL,
  ALTER COLUMN longitude DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.save_customer_signup_address()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  metadata jsonb;
  address jsonb;
  lat double precision;
  lng double precision;
BEGIN
  SELECT raw_user_meta_data INTO metadata
  FROM auth.users
  WHERE id = NEW.user_id;

  IF coalesce(metadata->>'requested_role', 'customer') <> 'customer' THEN
    RETURN NEW;
  END IF;

  address := metadata->'signup_address';
  IF jsonb_typeof(address) IS DISTINCT FROM 'object' THEN
    RETURN NEW;
  END IF;

  -- Validate the postal address independently of optional map coordinates.
  IF length(btrim(coalesce(address->>'address', ''))) NOT BETWEEN 10 AND 500
     OR length(btrim(coalesce(address->>'city', ''))) NOT BETWEEN 1 AND 100
     OR length(btrim(coalesce(address->>'state', ''))) NOT BETWEEN 1 AND 100
     OR coalesce(address->>'postalCode', '') !~ '^[0-9]{6}$'
  THEN
    RETURN NEW;
  END IF;

  -- Keep coordinates only when both are valid numeric values. Invalid or
  -- absent optional coordinates must not prevent account creation.
  IF jsonb_typeof(address->'latitude') = 'number'
     AND jsonb_typeof(address->'longitude') = 'number' THEN
    lat := (address->>'latitude')::double precision;
    lng := (address->>'longitude')::double precision;
    IF NOT (lat BETWEEN -90 AND 90 AND lng BETWEEN -180 AND 180) THEN
      lat := NULL;
      lng := NULL;
    END IF;
  END IF;

  INSERT INTO public.customer_addresses(
    customer_id, label, address_line, latitude, longitude,
    city, state, postal_code, flat_number, landmark, is_default
  )
  VALUES (
    NEW.id, 'Home', btrim(address->>'address'), lat, lng,
    btrim(address->>'city'), btrim(address->>'state'), address->>'postalCode',
    NULLIF(left(btrim(coalesce(address->>'flatNumber', '')), 100), ''),
    NULLIF(left(btrim(coalesce(address->>'landmark', '')), 200), ''),
    NOT EXISTS (
      SELECT 1 FROM public.customer_addresses WHERE customer_id = NEW.id
    )
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.save_customer_signup_address() FROM PUBLIC;

COMMIT;



-- ===== migrations/20261112120000_optimize_supervisor_assignment.sql =====

BEGIN;

-- Keep supervisor assignment and washer acceptance eligibility lookups bounded
-- as booking and offer history grows on existing installations.
CREATE INDEX IF NOT EXISTS bookings_washer_schedule_conflicts_idx
  ON public.bookings (assigned_washer_id, scheduled_date, scheduled_start_time)
  WHERE assigned_washer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS booking_assignments_pending_booking_expiry_idx
  ON public.booking_assignments (booking_id, expires_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS washer_availability_assignment_lookup_idx
  ON public.washer_availability (washer_id, day_of_week, start_time, end_time)
  WHERE is_available = true;

COMMIT;
NOTIFY pgrst, 'reload schema';



-- ===== migrations/20261112140000_fix_supervisor_assignment_eligibility.sql =====

BEGIN;

-- Fix the washer record projection: service_radius_km is used below and must
-- be selected into the PL/pgSQL record before evaluating distance eligibility.
CREATE OR REPLACE FUNCTION public.booking_washer_is_eligible(p_booking_id uuid, p_washer_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $function$
DECLARE b record; w record; loc record; pkg record; d double precision; conflict boolean;
BEGIN
  SELECT id,status,assigned_washer_id,package_id,scheduled_date,scheduled_start_time,latitude,longitude,service_address
    INTO b FROM public.bookings WHERE id = p_booking_id;
  IF NOT FOUND OR b.assigned_washer_id IS NOT NULL OR b.status::text NOT IN
     ('pending','confirmed','finding_washer','support_escalated','payment_completed')
     OR b.scheduled_date IS NULL OR b.scheduled_start_time IS NULL OR b.latitude IS NULL OR b.longitude IS NULL THEN RETURN false; END IF;
  SELECT id,status,is_active,is_verified,current_address,supervisor_id,service_radius_km
    INTO w FROM public.washers WHERE id = p_washer_id;
  IF NOT FOUND OR w.is_active IS DISTINCT FROM true OR w.is_verified IS DISTINCT FROM true OR w.status::text <> 'available' THEN RETURN false; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.washer_payout_accounts p WHERE p.washer_id=p_washer_id
      AND p.account_label IS NOT NULL AND (p.destination_encrypted IS NOT NULL OR p.fund_account_id IS NOT NULL)) THEN RETURN false; END IF;
  SELECT latitude,longitude,updated_at,service_latitude,service_longitude INTO loc
    FROM public.washer_locations WHERE washer_id=p_washer_id;
  IF NOT FOUND OR loc.updated_at IS NULL OR loc.latitude IS NULL OR loc.longitude IS NULL
     OR loc.latitude NOT BETWEEN -90 AND 90 OR loc.longitude NOT BETWEEN -180 AND 180
     OR loc.updated_at < now()-interval '15 minutes' THEN RETURN false; END IF;
  d := 2*6371*asin(sqrt(least(1::double precision,greatest(0::double precision,
    power(sin(radians((coalesce(loc.service_latitude,loc.latitude)-b.latitude)/2)),2)
    +cos(radians(b.latitude))*cos(radians(coalesce(loc.service_latitude,loc.latitude)))
    *power(sin(radians((coalesce(loc.service_longitude,loc.longitude)-b.longitude)/2)),2)))));
  IF nullif(regexp_replace(lower(coalesce(b.service_address,'')),'[^[:alnum:]]','','g'),'')
     = nullif(regexp_replace(lower(coalesce(w.current_address,'')),'[^[:alnum:]]','','g'),'') THEN d:=0; END IF;
  SELECT duration_minutes INTO pkg FROM public.service_packages WHERE id=b.package_id;
  IF d > least(greatest(coalesce(w.service_radius_km,5),5),100) THEN RETURN false; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.washer_availability a WHERE a.washer_id=p_washer_id
      AND a.day_of_week=extract(dow from b.scheduled_date)::integer AND a.is_available=true
      AND a.start_time <= b.scheduled_start_time AND a.end_time >= b.scheduled_start_time + make_interval(mins=>coalesce(pkg.duration_minutes,60))) THEN RETURN false; END IF;
  SELECT EXISTS (SELECT 1 FROM public.bookings x LEFT JOIN public.service_packages xp ON xp.id=x.package_id
    WHERE x.assigned_washer_id=p_washer_id AND x.id<>p_booking_id
      AND x.status::text IN ('washer_assigned','washer_on_the_way','washer_arrived','otp_verified','service_started','service_completed')
      AND (b.scheduled_date+b.scheduled_start_time) < (x.scheduled_date+x.scheduled_start_time+make_interval(mins=>coalesce(xp.duration_minutes,60)+30))
      AND (x.scheduled_date+x.scheduled_start_time) < (b.scheduled_date+b.scheduled_start_time+make_interval(mins=>coalesce(pkg.duration_minutes,60)+30))) INTO conflict;
  RETURN NOT conflict;
END;
$function$;

REVOKE ALL ON FUNCTION public.booking_washer_is_eligible(uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.booking_washer_is_eligible(uuid,uuid) TO service_role;

COMMIT;
NOTIFY pgrst, 'reload schema';



-- ===== migrations/20261112150000_remove_supervisor_skill_assignment_gate.sql =====

BEGIN;

-- Skills are not required for supervisors to send washer assignment offers.
-- Preserve all other booking, location, radius, payout, and availability checks.
CREATE OR REPLACE FUNCTION public.booking_washer_is_eligible(p_booking_id uuid, p_washer_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $function$
DECLARE b record; w record; loc record; pkg record; d double precision; conflict boolean;
BEGIN
  SELECT id,status,assigned_washer_id,package_id,scheduled_date,scheduled_start_time,latitude,longitude,service_address
    INTO b FROM public.bookings WHERE id = p_booking_id;
  IF NOT FOUND OR b.assigned_washer_id IS NOT NULL OR b.status::text NOT IN
     ('pending','confirmed','finding_washer','support_escalated','payment_completed')
     OR b.scheduled_date IS NULL OR b.scheduled_start_time IS NULL OR b.latitude IS NULL OR b.longitude IS NULL THEN RETURN false; END IF;
  SELECT id,status,is_active,is_verified,current_address,supervisor_id,service_radius_km
    INTO w FROM public.washers WHERE id = p_washer_id;
  IF NOT FOUND OR w.is_active IS DISTINCT FROM true OR w.is_verified IS DISTINCT FROM true OR w.status::text <> 'available' THEN RETURN false; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.washer_payout_accounts p WHERE p.washer_id=p_washer_id
      AND p.account_label IS NOT NULL AND (p.destination_encrypted IS NOT NULL OR p.fund_account_id IS NOT NULL)) THEN RETURN false; END IF;
  SELECT latitude,longitude,updated_at,service_latitude,service_longitude INTO loc
    FROM public.washer_locations WHERE washer_id=p_washer_id;
  IF NOT FOUND OR loc.updated_at IS NULL OR loc.latitude IS NULL OR loc.longitude IS NULL
     OR loc.latitude NOT BETWEEN -90 AND 90 OR loc.longitude NOT BETWEEN -180 AND 180
     OR loc.updated_at < now()-interval '15 minutes' THEN RETURN false; END IF;
  d := 2*6371*asin(sqrt(least(1::double precision,greatest(0::double precision,
    power(sin(radians((coalesce(loc.service_latitude,loc.latitude)-b.latitude)/2)),2)
    +cos(radians(b.latitude))*cos(radians(coalesce(loc.service_latitude,loc.latitude)))
    *power(sin(radians((coalesce(loc.service_longitude,loc.longitude)-b.longitude)/2)),2)))));
  IF nullif(regexp_replace(lower(coalesce(b.service_address,'')),'[^[:alnum:]]','','g'),'')
     = nullif(regexp_replace(lower(coalesce(w.current_address,'')),'[^[:alnum:]]','','g'),'') THEN d:=0; END IF;
  SELECT duration_minutes INTO pkg FROM public.service_packages WHERE id=b.package_id;
  IF d > least(greatest(coalesce(w.service_radius_km,5),5),100) THEN RETURN false; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.washer_availability a WHERE a.washer_id=p_washer_id
      AND a.day_of_week=extract(dow from b.scheduled_date)::integer AND a.is_available=true
      AND a.start_time <= b.scheduled_start_time AND a.end_time >= b.scheduled_start_time + make_interval(mins=>coalesce(pkg.duration_minutes,60))) THEN RETURN false; END IF;
  SELECT EXISTS (SELECT 1 FROM public.bookings x LEFT JOIN public.service_packages xp ON xp.id=x.package_id
    WHERE x.assigned_washer_id=p_washer_id AND x.id<>p_booking_id
      AND x.status::text IN ('washer_assigned','washer_on_the_way','washer_arrived','otp_verified','service_started','service_completed')
      AND (b.scheduled_date+b.scheduled_start_time) < (x.scheduled_date+x.scheduled_start_time+make_interval(mins=>coalesce(xp.duration_minutes,60)+30))
      AND (x.scheduled_date+x.scheduled_start_time) < (b.scheduled_date+b.scheduled_start_time+make_interval(mins=>coalesce(pkg.duration_minutes,60)+30))) INTO conflict;
  RETURN NOT conflict;
END;
$function$;

REVOKE ALL ON FUNCTION public.booking_washer_is_eligible(uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.booking_washer_is_eligible(uuid,uuid) TO service_role;

COMMIT;
NOTIFY pgrst, 'reload schema';



-- ===== migrations/20261112160000_remove_assignment_availability_window_gate.sql =====

BEGIN;

-- Online and otherwise-eligible washers can receive offers without a separate
-- recurring availability row. Existing assigned-job overlap checks still
-- prevent dispatch conflicts for this booking's scheduled time.
CREATE OR REPLACE FUNCTION public.booking_washer_is_eligible(p_booking_id uuid, p_washer_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $function$
DECLARE b record; w record; loc record; pkg record; d double precision; conflict boolean;
BEGIN
  SELECT id,status,assigned_washer_id,package_id,scheduled_date,scheduled_start_time,latitude,longitude,service_address
    INTO b FROM public.bookings WHERE id = p_booking_id;
  IF NOT FOUND OR b.assigned_washer_id IS NOT NULL OR b.status::text NOT IN
     ('pending','confirmed','finding_washer','support_escalated','payment_completed')
     OR b.scheduled_date IS NULL OR b.scheduled_start_time IS NULL OR b.latitude IS NULL OR b.longitude IS NULL THEN RETURN false; END IF;
  SELECT id,status,is_active,is_verified,current_address,supervisor_id,service_radius_km
    INTO w FROM public.washers WHERE id = p_washer_id;
  IF NOT FOUND OR w.is_active IS DISTINCT FROM true OR w.is_verified IS DISTINCT FROM true OR w.status::text <> 'available' THEN RETURN false; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.washer_payout_accounts p WHERE p.washer_id=p_washer_id
      AND p.account_label IS NOT NULL AND (p.destination_encrypted IS NOT NULL OR p.fund_account_id IS NOT NULL)) THEN RETURN false; END IF;
  SELECT latitude,longitude,updated_at,service_latitude,service_longitude INTO loc
    FROM public.washer_locations WHERE washer_id=p_washer_id;
  IF NOT FOUND OR loc.updated_at IS NULL OR loc.latitude IS NULL OR loc.longitude IS NULL
     OR loc.latitude NOT BETWEEN -90 AND 90 OR loc.longitude NOT BETWEEN -180 AND 180
     OR loc.updated_at < now()-interval '15 minutes' THEN RETURN false; END IF;
  d := 2*6371*asin(sqrt(least(1::double precision,greatest(0::double precision,
    power(sin(radians((coalesce(loc.service_latitude,loc.latitude)-b.latitude)/2)),2)
    +cos(radians(b.latitude))*cos(radians(coalesce(loc.service_latitude,loc.latitude)))
    *power(sin(radians((coalesce(loc.service_longitude,loc.longitude)-b.longitude)/2)),2)))));
  IF nullif(regexp_replace(lower(coalesce(b.service_address,'')),'[^[:alnum:]]','','g'),'')
     = nullif(regexp_replace(lower(coalesce(w.current_address,'')),'[^[:alnum:]]','','g'),'') THEN d:=0; END IF;
  SELECT duration_minutes INTO pkg FROM public.service_packages WHERE id=b.package_id;
  IF d > least(greatest(coalesce(w.service_radius_km,5),5),100) THEN RETURN false; END IF;
  SELECT EXISTS (SELECT 1 FROM public.bookings x LEFT JOIN public.service_packages xp ON xp.id=x.package_id
    WHERE x.assigned_washer_id=p_washer_id AND x.id<>p_booking_id
      AND x.status::text IN ('washer_assigned','washer_on_the_way','washer_arrived','otp_verified','service_started','service_completed')
      AND (b.scheduled_date+b.scheduled_start_time) < (x.scheduled_date+x.scheduled_start_time+make_interval(mins=>coalesce(xp.duration_minutes,60)+30))
      AND (x.scheduled_date+x.scheduled_start_time) < (b.scheduled_date+b.scheduled_start_time+make_interval(mins=>coalesce(pkg.duration_minutes,60)+30))) INTO conflict;
  RETURN NOT conflict;
END;
$function$;

REVOKE ALL ON FUNCTION public.booking_washer_is_eligible(uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.booking_washer_is_eligible(uuid,uuid) TO service_role;

COMMIT;
NOTIFY pgrst, 'reload schema';
