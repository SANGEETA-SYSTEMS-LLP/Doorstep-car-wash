-- =========================================================
-- FILE: 004_customers.sql
-- PURPOSE: Customer-specific information
-- RUN: AFTER 003_profiles.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    user_id UUID
        NOT NULL
        UNIQUE
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    date_of_birth DATE,

    gender TEXT,

    preferred_language TEXT
        DEFAULT 'English',

    total_bookings INTEGER
        NOT NULL
        DEFAULT 0,

    total_spent NUMERIC(12,2)
        NOT NULL
        DEFAULT 0,

    is_active BOOLEAN
        NOT NULL
        DEFAULT TRUE,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    CHECK (total_bookings >= 0),

    CHECK (total_spent >= 0)
);


-- ---------------------------------------------------------
-- USER LOOKUP
-- ---------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_customers_user
ON public.customers(user_id);


-- ---------------------------------------------------------
-- ACTIVE CUSTOMER LOOKUP
-- ---------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_customers_active
ON public.customers(is_active);


