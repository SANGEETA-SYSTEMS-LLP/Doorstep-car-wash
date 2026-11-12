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


