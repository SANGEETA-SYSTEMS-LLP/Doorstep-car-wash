-- =========================================================
-- FILE: 022_booking_service_checklist.sql
-- MODULE: Booking / Service
-- PURPOSE: Track checklist completion for each booking
-- RUN AFTER:
--   012_service_checklist_items.sql
--   018_bookings.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.booking_service_checklist (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    booking_id UUID
        NOT NULL
        REFERENCES public.bookings(id)
        ON DELETE CASCADE,

    checklist_item_id UUID
        NOT NULL
        REFERENCES public.service_checklist_items(id)
        ON DELETE CASCADE,

    completed BOOLEAN
        NOT NULL
        DEFAULT FALSE,

    completed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    UNIQUE (
        booking_id,
        checklist_item_id
    )
);


CREATE INDEX IF NOT EXISTS idx_booking_checklist_booking
ON public.booking_service_checklist(booking_id);


CREATE INDEX IF NOT EXISTS idx_booking_checklist_item
ON public.booking_service_checklist(checklist_item_id);


CREATE INDEX IF NOT EXISTS idx_booking_checklist_completed
ON public.booking_service_checklist(
    booking_id,
    completed
);


