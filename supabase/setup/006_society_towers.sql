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


