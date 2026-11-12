-- =========================================================
-- FILE: 024_payments.sql
-- MODULE: Payment
-- PURPOSE: Customer booking payments
-- RUN AFTER:
--   002_enums.sql
--   004_customers.sql
--   018_bookings.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    booking_id UUID
        NOT NULL
        REFERENCES public.bookings(id)
        ON DELETE CASCADE,

    customer_id UUID
        NOT NULL
        REFERENCES public.customers(id)
        ON DELETE RESTRICT,

    amount NUMERIC(12,2)
        NOT NULL,

    payment_method public.payment_method
        NOT NULL,

    status public.payment_status
        NOT NULL
        DEFAULT 'pending',

    -- Example:
    -- razorpay
    -- stripe
    -- cash
    provider TEXT,

    provider_order_id TEXT,

    provider_payment_id TEXT,

    provider_signature TEXT,

    failure_reason TEXT,

    paid_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    CHECK (amount >= 0)
);


-- Booking payment lookup
CREATE INDEX IF NOT EXISTS idx_payments_booking
ON public.payments(booking_id);


-- Customer payment history
CREATE INDEX IF NOT EXISTS idx_payments_customer
ON public.payments(customer_id);


-- Payment status lookup
CREATE INDEX IF NOT EXISTS idx_payments_status
ON public.payments(status);


-- Booking + payment status
CREATE INDEX IF NOT EXISTS idx_payments_booking_status
ON public.payments(
    booking_id,
    status
);


-- Prevent duplicate provider order IDs
CREATE UNIQUE INDEX IF NOT EXISTS
idx_payments_provider_order_unique
ON public.payments(provider_order_id)
WHERE provider_order_id IS NOT NULL;


-- Prevent duplicate payment IDs
CREATE UNIQUE INDEX IF NOT EXISTS
idx_payments_provider_payment_unique
ON public.payments(provider_payment_id)
WHERE provider_payment_id IS NOT NULL;


