-- =========================================================
-- FILE: 012_service_checklist_items.sql
-- MODULE: Services
-- PURPOSE: Checklist steps for each service
-- RUN AFTER: 010_services.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.service_checklist_items (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    service_id UUID
        NOT NULL
        REFERENCES public.services(id)
        ON DELETE CASCADE,

    title TEXT NOT NULL,

    sort_order INTEGER
        NOT NULL
        DEFAULT 0,

    active BOOLEAN
        NOT NULL
        DEFAULT TRUE,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    UNIQUE (service_id, title)
);


CREATE INDEX IF NOT EXISTS idx_service_checklist_service
ON public.service_checklist_items(service_id);


CREATE INDEX IF NOT EXISTS idx_service_checklist_active
ON public.service_checklist_items(service_id, active);


CREATE INDEX IF NOT EXISTS idx_service_checklist_sort
ON public.service_checklist_items(service_id, sort_order);


