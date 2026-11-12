-- =========================================================
-- FILE: 042_payment_review_notification_rls.sql
-- MODULE: Security
-- PURPOSE:
--   Payment, review, earnings and notification access
-- RUN AFTER: 036_enable_rls.sql
-- =========================================================


-- =========================================================
-- PAYMENTS
-- =========================================================

DROP POLICY IF EXISTS "customers_select_own_payments"
ON public.payments;

CREATE POLICY "customers_select_own_payments"
ON public.payments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = payments.customer_id
          AND c.user_id = auth.uid()
    )
);


-- Payment creation/verification should normally happen
-- through the trusted backend/payment webhook.
-- Therefore customers receive no direct INSERT/UPDATE
-- policy here.


-- =========================================================
-- REVIEWS
-- =========================================================

DROP POLICY IF EXISTS "customers_select_own_reviews"
ON public.reviews;

CREATE POLICY "customers_select_own_reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = reviews.customer_id
          AND c.user_id = auth.uid()
    )
);


DROP POLICY IF EXISTS "customers_create_own_reviews"
ON public.reviews;

CREATE POLICY "customers_create_own_reviews"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = reviews.customer_id
          AND c.user_id = auth.uid()
    )

    AND EXISTS (
        SELECT 1
        FROM public.bookings b
        JOIN public.customers c
            ON c.id = b.customer_id
        WHERE b.id = reviews.booking_id
          AND b.assigned_washer_id = reviews.washer_id
          AND c.user_id = auth.uid()
          AND b.status IN (
              'service_completed',
              'customer_confirmed',
              'payment_completed',
              'closed'
          )
    )
);


-- =========================================================
-- WASHER REVIEWS
-- =========================================================

DROP POLICY IF EXISTS "washers_select_own_reviews"
ON public.reviews;

CREATE POLICY "washers_select_own_reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.washers w
        WHERE w.id = reviews.washer_id
          AND w.user_id = auth.uid()
    )
);


-- =========================================================
-- WASHER EARNINGS
-- =========================================================

DROP POLICY IF EXISTS "washers_select_own_earnings"
ON public.washer_earnings;

CREATE POLICY "washers_select_own_earnings"
ON public.washer_earnings
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.washers w
        WHERE w.id = washer_earnings.washer_id
          AND w.user_id = auth.uid()
    )
);


-- =========================================================
-- WASHER SETTLEMENTS
-- =========================================================

DROP POLICY IF EXISTS "washers_select_own_settlements"
ON public.washer_settlements;

CREATE POLICY "washers_select_own_settlements"
ON public.washer_settlements
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.washers w
        WHERE w.id = washer_settlements.washer_id
          AND w.user_id = auth.uid()
    )
);


-- =========================================================
-- NOTIFICATIONS
-- =========================================================

DROP POLICY IF EXISTS "users_select_own_notifications"
ON public.notifications;

CREATE POLICY "users_select_own_notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
);


DROP POLICY IF EXISTS "users_update_own_notifications"
ON public.notifications;

CREATE POLICY "users_update_own_notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid()
)
WITH CHECK (
    user_id = auth.uid()
);


