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


