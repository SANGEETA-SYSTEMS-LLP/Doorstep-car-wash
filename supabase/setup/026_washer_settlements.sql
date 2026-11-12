-- =========================================================
-- FILE: 026_washer_settlements.sql
-- MODULE: Accountant / Washer
-- PURPOSE: Washer payout / settlement management
-- RUN AFTER:
--   003_profiles.sql
--   013_washers.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.washer_settlements (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    washer_id UUID
        NOT NULL
        REFERENCES public.washers(id)
        ON DELETE RESTRICT,

    amount NUMERIC(12,2)
        NOT NULL,

    status TEXT
        NOT NULL
        DEFAULT 'pending',

    payment_reference TEXT,

    processed_by UUID
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    processed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    CHECK (amount > 0),

    CHECK (
        status IN (
            'pending',
            'processing',
            'paid',
            'failed'
        )
    )
);


CREATE INDEX IF NOT EXISTS idx_washer_settlements_washer
ON public.washer_settlements(washer_id);


CREATE INDEX IF NOT EXISTS idx_washer_settlements_status
ON public.washer_settlements(status);


CREATE INDEX IF NOT EXISTS idx_washer_settlements_washer_status
ON public.washer_settlements(
    washer_id,
    status
);


CREATE INDEX IF NOT EXISTS idx_washer_settlements_processed_by
ON public.washer_settlements(processed_by);


