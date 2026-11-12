-- =========================================================
-- FILE: 002_enums.sql
-- PURPOSE: Common enums used throughout the application
-- RUN: AFTER 001_extensions.sql
-- =========================================================
-- USER ROLES
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'user_role'
    ) THEN
        CREATE TYPE public.user_role AS ENUM (
            'customer',
            'washer',
            'supervisor',
            'support',
            'accountant',
            'sub_admin',
            'super_admin'
        );
    END IF;
END
$$;

-- ---------------------------------------------------------
-- WASHER STATUS
-- ---------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'washer_status'
    ) THEN
        CREATE TYPE public.washer_status AS ENUM (
            'offline',
            'available',
            'busy'
        );
    END IF;
END
$$;


-- ---------------------------------------------------------
-- BOOKING STATUS
-- ---------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'booking_status'
    ) THEN
        CREATE TYPE public.booking_status AS ENUM (
            'pending',
            'confirmed',
            'finding_washer',
            'washer_assigned',
            'washer_on_the_way',
            'washer_arrived',
            'otp_verified',
            'service_started',
            'service_completed',
            'customer_confirmed',
            'payment_completed',
            'closed',
            'cancelled',
            'refund_requested',
            'refunded',
            'disputed',
            'support_escalated'
        );
    END IF;
END
$$;


-- ---------------------------------------------------------
-- BOOKING ASSIGNMENT STATUS
-- ---------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'assignment_status'
    ) THEN
        CREATE TYPE public.assignment_status AS ENUM (
            'pending',
            'accepted',
            'rejected',
            'expired',
            'cancelled'
        );
    END IF;
END
$$;


-- ---------------------------------------------------------
-- PAYMENT STATUS
-- ---------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'payment_status'
    ) THEN
        CREATE TYPE public.payment_status AS ENUM (
            'pending',
            'created',
            'paid',
            'failed',
            'refunded'
        );
    END IF;
END
$$;


-- ---------------------------------------------------------
-- PAYMENT METHOD
-- ---------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'payment_method'
    ) THEN
        CREATE TYPE public.payment_method AS ENUM (
            'online',
            'cod'
        );
    END IF;
END
$$;


-- ---------------------------------------------------------
-- EXTRA CHARGE STATUS
-- ---------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'extra_charge_status'
    ) THEN
        CREATE TYPE public.extra_charge_status AS ENUM (
            'pending',
            'approved',
            'rejected',
            'customer_approved',
            'customer_rejected',
            'cancelled'
        );
    END IF;
END
$$;


