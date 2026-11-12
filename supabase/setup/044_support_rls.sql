-- =========================================================
-- FILE: 044_support_rls.sql
-- MODULE: Security / Customer Support
-- PURPOSE: Support staff read permissions
-- RUN AFTER: 036_enable_rls.sql
-- =========================================================


DROP POLICY IF EXISTS "support_select_profiles"
ON public.profiles;

CREATE POLICY "support_select_profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles current_user_profile
        WHERE current_user_profile.id = auth.uid()
          AND current_user_profile.role = 'support'
          AND current_user_profile.is_active = TRUE
    )
);


DROP POLICY IF EXISTS "support_select_customers"
ON public.customers;

CREATE POLICY "support_select_customers"
ON public.customers
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'support'
          AND p.is_active = TRUE
    )
);


DROP POLICY IF EXISTS "support_select_bookings"
ON public.bookings;

CREATE POLICY "support_select_bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'support'
          AND p.is_active = TRUE
    )
);


DROP POLICY IF EXISTS "support_select_booking_history"
ON public.booking_status_history;

CREATE POLICY "support_select_booking_history"
ON public.booking_status_history
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'support'
          AND p.is_active = TRUE
    )
);


