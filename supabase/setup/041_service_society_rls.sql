-- =========================================================
-- FILE: 041_service_society_rls.sql
-- MODULE: Security / Common
-- PURPOSE: Read access to master/catalog data
-- RUN AFTER: 036_enable_rls.sql
-- =========================================================


-- =========================================================
-- SERVICES
-- =========================================================

DROP POLICY IF EXISTS "authenticated_read_active_services"
ON public.services;

CREATE POLICY "authenticated_read_active_services"
ON public.services
FOR SELECT
TO authenticated
USING (
    is_active = TRUE
);


-- =========================================================
-- SERVICE PACKAGES
-- =========================================================

DROP POLICY IF EXISTS "authenticated_read_active_packages"
ON public.service_packages;

CREATE POLICY "authenticated_read_active_packages"
ON public.service_packages
FOR SELECT
TO authenticated
USING (
    is_active = TRUE
);


-- =========================================================
-- SERVICE CHECKLIST ITEMS
-- =========================================================

DROP POLICY IF EXISTS "authenticated_read_checklist_items"
ON public.service_checklist_items;

CREATE POLICY "authenticated_read_checklist_items"
ON public.service_checklist_items
FOR SELECT
TO authenticated
USING (
    active = TRUE
);


-- =========================================================
-- SOCIETIES
-- =========================================================

DROP POLICY IF EXISTS "authenticated_read_active_societies"
ON public.societies;

CREATE POLICY "authenticated_read_active_societies"
ON public.societies
FOR SELECT
TO authenticated
USING (
    is_active = TRUE
);


-- =========================================================
-- SOCIETY TOWERS
-- =========================================================

DROP POLICY IF EXISTS "authenticated_read_active_towers"
ON public.society_towers;

CREATE POLICY "authenticated_read_active_towers"
ON public.society_towers
FOR SELECT
TO authenticated
USING (
    is_active = TRUE
);


-- =========================================================
-- SERVICE ZONES
-- =========================================================

DROP POLICY IF EXISTS "authenticated_read_active_zones"
ON public.service_zones;

CREATE POLICY "authenticated_read_active_zones"
ON public.service_zones
FOR SELECT
TO authenticated
USING (
    is_active = TRUE
);


