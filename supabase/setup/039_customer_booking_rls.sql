-- =========================================================
-- FILE: 039_customer_booking_rls.sql
-- MODULE: Security / Booking
-- PURPOSE: Customer booking permissions
-- RUN AFTER: 036_enable_rls.sql
-- =========================================================


-- =========================================================
-- BOOKINGS
-- =========================================================

DROP POLICY IF EXISTS "customers_select_own_bookings"
ON public.bookings;

CREATE POLICY "customers_select_own_bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = bookings.customer_id
          AND c.user_id = auth.uid()
    )
);


DROP POLICY IF EXISTS "customers_create_own_bookings"
ON public.bookings;

CREATE POLICY "customers_create_own_bookings"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = bookings.customer_id
          AND c.user_id = auth.uid()
    )

    AND EXISTS (
        SELECT 1
        FROM public.customer_addresses ca
        JOIN public.customers c
            ON c.id = ca.customer_id
        WHERE ca.id = bookings.address_id
          AND c.user_id = auth.uid()
    )

    AND EXISTS (
        SELECT 1
        FROM public.vehicles v
        JOIN public.customers c
            ON c.id = v.customer_id
        WHERE v.id = bookings.vehicle_id
          AND c.user_id = auth.uid()
    )
);


-- Customers should NOT have unrestricted UPDATE permission
-- on bookings.
--
-- Status transitions should be handled through controlled
-- RPC/backend operations.


-- =========================================================
-- BOOKING STATUS HISTORY
-- =========================================================

DROP POLICY IF EXISTS "customers_select_booking_history"
ON public.booking_status_history;

CREATE POLICY "customers_select_booking_history"
ON public.booking_status_history
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.bookings b
        JOIN public.customers c
            ON c.id = b.customer_id
        WHERE b.id = booking_status_history.booking_id
          AND c.user_id = auth.uid()
    )
);


-- =========================================================
-- BOOKING CHECKLIST
-- =========================================================

DROP POLICY IF EXISTS "customers_select_booking_checklist"
ON public.booking_service_checklist;

CREATE POLICY "customers_select_booking_checklist"
ON public.booking_service_checklist
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.bookings b
        JOIN public.customers c
            ON c.id = b.customer_id
        WHERE b.id = booking_service_checklist.booking_id
          AND c.user_id = auth.uid()
    )
);


-- =========================================================
-- BOOKING PHOTOS
-- =========================================================

DROP POLICY IF EXISTS "customers_select_booking_photos"
ON public.booking_service_photos;

CREATE POLICY "customers_select_booking_photos"
ON public.booking_service_photos
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.bookings b
        JOIN public.customers c
            ON c.id = b.customer_id
        WHERE b.id = booking_service_photos.booking_id
          AND c.user_id = auth.uid()
    )
);


