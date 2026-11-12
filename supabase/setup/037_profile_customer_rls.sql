-- =========================================================
-- FILE: 037_profile_customer_rls.sql
-- MODULE: Security / Customer
-- PURPOSE: Profile and customer RLS
-- RUN AFTER: 036_enable_rls.sql
-- =========================================================


-- =========================================================
-- PROFILES
-- =========================================================

DROP POLICY IF EXISTS "profiles_select_own"
ON public.profiles;

CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    id = auth.uid()
);


DROP POLICY IF EXISTS "profiles_update_own"
ON public.profiles;

CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
    id = auth.uid()
)
WITH CHECK (
    id = auth.uid()
);


-- =========================================================
-- CUSTOMERS
-- =========================================================

DROP POLICY IF EXISTS "customers_select_own"
ON public.customers;

CREATE POLICY "customers_select_own"
ON public.customers
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
);


DROP POLICY IF EXISTS "customers_update_own"
ON public.customers;

CREATE POLICY "customers_update_own"
ON public.customers
FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid()
)
WITH CHECK (
    user_id = auth.uid()
);


