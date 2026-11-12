-- =========================================================
-- FILE: 027_reviews.sql
-- MODULE: Customer / Washer
-- PURPOSE: Customer review after service
-- RUN AFTER:
--   004_customers.sql
--   013_washers.sql
--   018_bookings.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    booking_id UUID
        NOT NULL
        UNIQUE
        REFERENCES public.bookings(id)
        ON DELETE CASCADE,

    customer_id UUID
        NOT NULL
        REFERENCES public.customers(id)
        ON DELETE CASCADE,

    washer_id UUID
        NOT NULL
        REFERENCES public.washers(id)
        ON DELETE CASCADE,

    rating INTEGER
        NOT NULL,

    comment TEXT,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    CHECK (
        rating BETWEEN 1 AND 5
    )
);


CREATE INDEX IF NOT EXISTS idx_reviews_customer
ON public.reviews(customer_id);


CREATE INDEX IF NOT EXISTS idx_reviews_washer
ON public.reviews(washer_id);


CREATE INDEX IF NOT EXISTS idx_reviews_washer_rating
ON public.reviews(
    washer_id,
    rating
);


