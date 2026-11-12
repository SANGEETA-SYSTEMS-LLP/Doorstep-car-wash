-- =========================================================
-- FILE: 009_customer_vehicles.sql
-- PURPOSE: Customer vehicles
-- RUN: AFTER 004_customers.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    customer_id UUID
        NOT NULL
        REFERENCES public.customers(id)
        ON DELETE CASCADE,

    vehicle_number TEXT NOT NULL,

    vehicle_type TEXT NOT NULL,

    brand TEXT,

    model TEXT,

    colour TEXT,

    is_default BOOLEAN
        NOT NULL
        DEFAULT FALSE,

    is_active BOOLEAN
        NOT NULL
        DEFAULT TRUE,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    UNIQUE (customer_id, vehicle_number)
);


CREATE INDEX IF NOT EXISTS idx_vehicles_customer
ON public.vehicles(customer_id);


CREATE INDEX IF NOT EXISTS idx_vehicles_customer_active
ON public.vehicles(customer_id, is_active);


CREATE INDEX IF NOT EXISTS idx_vehicles_customer_default
ON public.vehicles(customer_id, is_default);


