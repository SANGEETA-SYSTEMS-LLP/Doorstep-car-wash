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


