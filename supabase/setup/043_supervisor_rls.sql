-- =========================================================
-- FILE: 043_supervisor_rls.sql
-- MODULE: Security / Supervisor
-- PURPOSE: Supervisor workflow permissions
-- RUN AFTER: 036_enable_rls.sql
-- =========================================================


-- =========================================================
-- EXTRA CHARGE REQUESTS
-- =========================================================

DROP POLICY IF EXISTS "supervisors_select_extra_charges"
ON public.extra_charge_requests;

CREATE POLICY "supervisors_select_extra_charges"
ON public.extra_charge_requests
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'supervisor'
          AND p.is_active = TRUE
    )
);


DROP POLICY IF EXISTS "supervisors_update_extra_charges"
ON public.extra_charge_requests;

CREATE POLICY "supervisors_update_extra_charges"
ON public.extra_charge_requests
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'supervisor'
          AND p.is_active = TRUE
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'supervisor'
          AND p.is_active = TRUE
    )
);


-- =========================================================
-- SUPERVISOR BOOKINGS
-- =========================================================

DROP POLICY IF EXISTS "supervisors_select_bookings"
ON public.bookings;

CREATE POLICY "supervisors_select_bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'supervisor'
          AND p.is_active = TRUE
    )
);


-- =========================================================
-- SUPERVISOR WASHERS
-- =========================================================

DROP POLICY IF EXISTS "supervisors_select_washers"
ON public.washers;

CREATE POLICY "supervisors_select_washers"
ON public.washers
FOR SELECT
TO authenticated
USING (
    supervisor_id = auth.uid()
);


