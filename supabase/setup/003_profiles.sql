-- =========================================================
-- FILE: 003_profiles.sql
-- PURPOSE: Main application user profile
-- RUN: AFTER 002_enums.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    full_name TEXT,

    phone TEXT,

    avatar_url TEXT,

    role public.user_role
        NOT NULL
        DEFAULT 'customer',

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


-- ---------------------------------------------------------
-- INDEX: ROLE
-- ---------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_profiles_role
ON public.profiles(role);


-- ---------------------------------------------------------
-- INDEX: ACTIVE USERS
-- ---------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_profiles_active
ON public.profiles(is_active);


-- ---------------------------------------------------------
-- INDEX: ROLE + ACTIVE
-- Useful for admin dashboards
-- ---------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_profiles_role_active
ON public.profiles(role, is_active);


