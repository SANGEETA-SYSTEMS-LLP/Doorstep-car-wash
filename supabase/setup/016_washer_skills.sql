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


