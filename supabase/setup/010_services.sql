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


