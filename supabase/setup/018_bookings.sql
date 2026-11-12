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


