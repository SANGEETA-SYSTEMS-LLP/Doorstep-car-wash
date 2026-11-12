-- =========================================================
-- FILE: 028_notifications.sql
-- MODULE: Common
-- PURPOSE: Notifications for all application users
-- RUN AFTER: 003_profiles.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    user_id UUID
        NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    title TEXT
        NOT NULL,

    message TEXT
        NOT NULL,

    type TEXT,

    reference_id UUID,

    is_read BOOLEAN
        NOT NULL
        DEFAULT FALSE,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW()
);


CREATE INDEX IF NOT EXISTS idx_notifications_user
ON public.notifications(user_id);


CREATE INDEX IF NOT EXISTS idx_notifications_user_read
ON public.notifications(
    user_id,
    is_read
);


CREATE INDEX IF NOT EXISTS idx_notifications_user_created
ON public.notifications(
    user_id,
    created_at DESC
);


CREATE INDEX IF NOT EXISTS idx_notifications_reference
ON public.notifications(reference_id);


