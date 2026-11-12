-- =========================================================
-- FILE: 019_booking_assignments.sql
-- MODULE: Booking / Washer
-- PURPOSE: Offer bookings to washers
-- RUN AFTER:
--   013_washers.sql
--   018_bookings.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.booking_assignments (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    booking_id UUID
        NOT NULL
        REFERENCES public.bookings(id)
        ON DELETE CASCADE,

    washer_id UUID
        NOT NULL
        REFERENCES public.washers(id)
        ON DELETE CASCADE,

    status public.assignment_status
        NOT NULL
        DEFAULT 'pending',

    distance_km NUMERIC(8,2),

    attempt_number INTEGER
        NOT NULL
        DEFAULT 1,

    rejection_reason TEXT,

    offered_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    responded_at TIMESTAMPTZ,

    expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    UNIQUE (
        booking_id,
        washer_id
    ),

    CHECK (
        distance_km IS NULL
        OR distance_km >= 0
    ),

    CHECK (
        attempt_number > 0
    )
);


CREATE INDEX IF NOT EXISTS idx_booking_assignments_washer_status
ON public.booking_assignments(
    washer_id,
    status
);


CREATE INDEX IF NOT EXISTS idx_booking_assignments_booking
ON public.booking_assignments(booking_id);


CREATE INDEX IF NOT EXISTS idx_booking_assignments_status
ON public.booking_assignments(status);


CREATE INDEX IF NOT EXISTS idx_booking_assignments_expires
ON public.booking_assignments(expires_at);


