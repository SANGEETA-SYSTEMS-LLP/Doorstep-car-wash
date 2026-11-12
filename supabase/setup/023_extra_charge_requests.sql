-- =========================================================
-- FILE: 023_extra_charge_requests.sql
-- MODULE: Supervisor
-- PURPOSE: Additional charge approval workflow
-- RUN AFTER:
--   002_enums.sql
--   013_washers.sql
--   018_bookings.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.extra_charge_requests (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    booking_id UUID
        NOT NULL
        REFERENCES public.bookings(id)
        ON DELETE CASCADE,

    washer_id UUID
        NOT NULL
        REFERENCES public.washers(id)
        ON DELETE RESTRICT,

    reason TEXT
        NOT NULL,

    requested_amount NUMERIC(12,2)
        NOT NULL,

    status public.extra_charge_status
        NOT NULL
        DEFAULT 'pending',

    supervisor_id UUID
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    supervisor_note TEXT,

    customer_note TEXT,

    reviewed_at TIMESTAMPTZ,

    customer_responded_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    CHECK (requested_amount > 0)
);


CREATE INDEX IF NOT EXISTS idx_extra_charge_booking
ON public.extra_charge_requests(booking_id);


CREATE INDEX IF NOT EXISTS idx_extra_charge_washer
ON public.extra_charge_requests(washer_id);


CREATE INDEX IF NOT EXISTS idx_extra_charge_supervisor
ON public.extra_charge_requests(supervisor_id);


CREATE INDEX IF NOT EXISTS idx_extra_charge_status
ON public.extra_charge_requests(status);


CREATE INDEX IF NOT EXISTS idx_extra_charge_supervisor_status
ON public.extra_charge_requests(
    supervisor_id,
    status
);


