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


