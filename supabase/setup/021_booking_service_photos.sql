-- =========================================================
-- FILE: 021_booking_service_photos.sql
-- MODULE: Booking / Service
-- PURPOSE: Before / during / after service photos
-- RUN AFTER: 018_bookings.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.booking_service_photos (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    booking_id UUID
        NOT NULL
        REFERENCES public.bookings(id)
        ON DELETE CASCADE,

    photo_type TEXT
        NOT NULL,

    photo_url TEXT
        NOT NULL,

    uploaded_by UUID
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    notes TEXT,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    CHECK (
        photo_type IN (
            'before',
            'during',
            'after',
            'damage',
            'other'
        )
    )
);


CREATE INDEX IF NOT EXISTS booking_service_photos_booking_idx
ON public.booking_service_photos(
    booking_id,
    photo_type
);


CREATE INDEX IF NOT EXISTS idx_booking_service_photos_uploaded_by
ON public.booking_service_photos(uploaded_by);


