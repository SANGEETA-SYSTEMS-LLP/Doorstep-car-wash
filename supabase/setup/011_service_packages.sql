-- =========================================================
-- FILE: 011_service_packages.sql
-- MODULE: Services
-- PURPOSE: Packages, pricing and duration
-- RUN AFTER: 010_services.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.service_packages (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    service_id UUID
        NOT NULL
        REFERENCES public.services(id)
        ON DELETE CASCADE,

    name TEXT NOT NULL,

    description TEXT,

    vehicle_type TEXT NOT NULL,

    price NUMERIC(12,2)
        NOT NULL,

    duration_minutes INTEGER
        NOT NULL
        DEFAULT 60,

    washer_commission_percent NUMERIC(5,2)
        NOT NULL
        DEFAULT 70,

    is_active BOOLEAN
        NOT NULL
        DEFAULT TRUE,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    CHECK (price >= 0),

    CHECK (duration_minutes > 0),

    CHECK (
        washer_commission_percent >= 0
        AND washer_commission_percent <= 100
    )
);


CREATE INDEX IF NOT EXISTS idx_service_packages_service
ON public.service_packages(service_id);


CREATE INDEX IF NOT EXISTS idx_service_packages_active
ON public.service_packages(is_active);


CREATE INDEX IF NOT EXISTS idx_service_packages_vehicle_type
ON public.service_packages(vehicle_type);


CREATE INDEX IF NOT EXISTS idx_service_packages_service_active
ON public.service_packages(service_id, is_active);


