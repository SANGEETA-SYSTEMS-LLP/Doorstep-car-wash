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


