-- =========================================================
-- FILE: 038_customer_address_vehicle_rls.sql
-- MODULE: Security / Customer
-- PURPOSE:
--   Customer address and vehicle permissions
-- RUN AFTER: 036_enable_rls.sql
-- =========================================================


-- =========================================================
-- CUSTOMER ADDRESSES
-- =========================================================

DROP POLICY IF EXISTS "customer_addresses_select_own"
ON public.customer_addresses;

CREATE POLICY "customer_addresses_select_own"
ON public.customer_addresses
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = customer_addresses.customer_id
          AND c.user_id = auth.uid()
    )
);


DROP POLICY IF EXISTS "customer_addresses_insert_own"
ON public.customer_addresses;

CREATE POLICY "customer_addresses_insert_own"
ON public.customer_addresses
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = customer_addresses.customer_id
          AND c.user_id = auth.uid()
    )
);


DROP POLICY IF EXISTS "customer_addresses_update_own"
ON public.customer_addresses;

CREATE POLICY "customer_addresses_update_own"
ON public.customer_addresses
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = customer_addresses.customer_id
          AND c.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = customer_addresses.customer_id
          AND c.user_id = auth.uid()
    )
);


DROP POLICY IF EXISTS "customer_addresses_delete_own"
ON public.customer_addresses;

CREATE POLICY "customer_addresses_delete_own"
ON public.customer_addresses
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = customer_addresses.customer_id
          AND c.user_id = auth.uid()
    )
);


-- =========================================================
-- VEHICLES
-- =========================================================

DROP POLICY IF EXISTS "vehicles_select_own"
ON public.vehicles;

CREATE POLICY "vehicles_select_own"
ON public.vehicles
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = vehicles.customer_id
          AND c.user_id = auth.uid()
    )
);


DROP POLICY IF EXISTS "vehicles_insert_own"
ON public.vehicles;

CREATE POLICY "vehicles_insert_own"
ON public.vehicles
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = vehicles.customer_id
          AND c.user_id = auth.uid()
    )
);


DROP POLICY IF EXISTS "vehicles_update_own"
ON public.vehicles;

CREATE POLICY "vehicles_update_own"
ON public.vehicles
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = vehicles.customer_id
          AND c.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = vehicles.customer_id
          AND c.user_id = auth.uid()
    )
);


DROP POLICY IF EXISTS "vehicles_delete_own"
ON public.vehicles;

CREATE POLICY "vehicles_delete_own"
ON public.vehicles
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = vehicles.customer_id
          AND c.user_id = auth.uid()
    )
);


