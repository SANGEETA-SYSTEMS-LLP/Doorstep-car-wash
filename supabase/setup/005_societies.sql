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


