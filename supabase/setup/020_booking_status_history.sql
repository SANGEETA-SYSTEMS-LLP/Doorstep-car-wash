-- =========================================================
-- FILE: 020_booking_status_history.sql
-- MODULE: Booking
-- PURPOSE: Booking status audit/history
-- RUN AFTER:
--   003_profiles.sql
--   018_bookings.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.booking_status_history (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    booking_id UUID
        NOT NULL
        REFERENCES public.bookings(id)
        ON DELETE CASCADE,

    status public.booking_status
        NOT NULL,

    changed_by UUID
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    notes TEXT,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW()
);


CREATE INDEX IF NOT EXISTS idx_booking_history_booking
ON public.booking_status_history(
    booking_id,
    created_at
);


CREATE INDEX IF NOT EXISTS idx_booking_history_status
ON public.booking_status_history(status);


CREATE INDEX IF NOT EXISTS idx_booking_history_changed_by
ON public.booking_status_history(changed_by);


