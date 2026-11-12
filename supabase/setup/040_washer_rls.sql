-- ========================================================= 
-- FILE: 040_washer_rls.sql 
-- MODULE: Security / Washer 
-- PURPOSE: Washer-specific permissions 
-- RUN AFTER: 036_enable_rls.sql 
-- ========================================================= 
 
 
-- ========================================================= 
-- WASHER PROFILE 
-- ========================================================= 
 
DROP POLICY IF EXISTS "washers_select_own" 
ON public.washers; 
 
CREATE POLICY "washers_select_own" 
ON public.washers 
FOR SELECT 
TO authenticated 
USING ( 
    user_id = auth.uid() 
); 
 
 
DROP POLICY IF EXISTS "washers_update_own" 
ON public.washers; 
 
CREATE POLICY "washers_update_own" 
ON public.washers 
FOR UPDATE 
TO authenticated 
USING ( 
    user_id = auth.uid() 
) 
WITH CHECK ( 
    user_id = auth.uid() 
); 
 
 
-- ========================================================= 
-- WASHER LOCATION 
-- ========================================================= 
 
DROP POLICY IF EXISTS "washers_select_own_location" 
ON public.washer_locations; 
 
CREATE POLICY "washers_select_own_location" 
ON public.washer_locations 
FOR SELECT 
TO authenticated 
USING ( 
    EXISTS ( 
        SELECT 1 
        FROM public.washers w 
        WHERE w.id = washer_locations.washer_id 
          AND w.user_id = auth.uid() 
    ) 
); 
 
 
DROP POLICY IF EXISTS "washers_insert_own_location" 
ON public.washer_locations; 
 
CREATE POLICY "washers_insert_own_location" 
ON public.washer_locations 
FOR INSERT 
TO authenticated 
WITH CHECK ( 
    EXISTS ( 
        SELECT 1 
        FROM public.washers w 
        WHERE w.id = washer_locations.washer_id 
          AND w.user_id = auth.uid() 
    ) 
); 
 
 
DROP POLICY IF EXISTS "washers_update_own_location" 
ON public.washer_locations; 
 
CREATE POLICY "washers_update_own_location" 
ON public.washer_locations 
FOR UPDATE 
TO authenticated 
USING ( 
    EXISTS ( 
        SELECT 1 
        FROM public.washers w 
        WHERE w.id = washer_locations.washer_id 
          AND w.user_id = auth.uid() 
    ) 
) 
WITH CHECK ( 
    EXISTS ( 
        SELECT 1 
        FROM public.washers w 
        WHERE w.id = washer_locations.washer_id 
          AND w.user_id = auth.uid() 
    ) 
); 
 
 
-- ========================================================= 
-- WASHER AVAILABILITY 
-- ========================================================= 
 
DROP POLICY IF EXISTS "washers_manage_own_availability" 
ON public.washer_availability; 
 
CREATE POLICY "washers_manage_own_availability" 
ON public.washer_availability 
FOR ALL 
TO authenticated 
USING ( 
    EXISTS ( 
        SELECT 1 
        FROM public.washers w 
        WHERE w.id = washer_availability.washer_id 
          AND w.user_id = auth.uid() 
    ) 
) 
WITH CHECK ( 
    EXISTS ( 
        SELECT 1 
        FROM public.washers w 
        WHERE w.id = washer_availability.washer_id 
          AND w.user_id = auth.uid() 
    ) 
); 
 
 
-- ========================================================= 
-- WASHER SKILLS 
-- Read-only for washer. 
-- Admin will manage skill assignment. 
-- ========================================================= 
 
DROP POLICY IF EXISTS "washers_select_own_skills" 
ON public.washer_skills; 
 
CREATE POLICY "washers_select_own_skills" 
ON public.washer_skills 
FOR SELECT 
TO authenticated 
USING ( 
    EXISTS ( 
        SELECT 1 
        FROM public.washers w 
        WHERE w.id = washer_skills.washer_id 
          AND w.user_id = auth.uid() 
    ) 
); 
 
 
-- ========================================================= 
-- WASHER BOOKINGS 
-- ========================================================= 
 
DROP POLICY IF EXISTS "washers_select_assigned_bookings" 
ON public.bookings; 
 
CREATE POLICY "washers_select_assigned_bookings" 
ON public.bookings 
FOR SELECT 
TO authenticated 
USING ( 
    EXISTS ( 
        SELECT 1 
        FROM public.washers w 
        WHERE w.id = bookings.assigned_washer_id 
          AND w.user_id = auth.uid() 
    ) 
); 
 
 
-- ========================================================= 
-- BOOKING ASSIGNMENTS 
-- ========================================================= 
 
DROP POLICY IF EXISTS "washers_select_own_assignments" 
ON public.booking_assignments; 
 
CREATE POLICY "washers_select_own_assignments" 
ON public.booking_assignments 
FOR SELECT 
TO authenticated 
USING ( 
    EXISTS ( 
        SELECT 1 
        FROM public.washers w 
        WHERE w.id = booking_assignments.washer_id 
          AND w.user_id = auth.uid() 
    ) 
); 
 
 
-- Accept/reject is handled by: 
-- 
-- accept_booking_assignment() 
-- reject_booking_assignment() 
-- 
-- Therefore no unrestricted UPDATE policy is provided. 
 
 
-- ========================================================= 
-- BOOKING HISTORY 
-- ========================================================= 
 
DROP POLICY IF EXISTS "washers_select_booking_history" 
ON public.booking_status_history; 
 
CREATE POLICY "washers_select_booking_history" 
ON public.booking_status_history 
FOR SELECT 
TO authenticated 
USING ( 
    EXISTS ( 
        SELECT 1 
        FROM public.bookings b 
        JOIN public.washers w 
            ON w.id = b.assigned_washer_id 
        WHERE b.id = booking_status_history.booking_id 
          AND w.user_id = auth.uid() 
    ) 
); 
 
 
-- ========================================================= 
-- BOOKING CHECKLIST 
-- ========================================================= 
 
DROP POLICY IF EXISTS "washers_select_booking_checklist" 
ON public.booking_service_checklist; 
 
CREATE POLICY "washers_select_booking_checklist" 
ON public.booking_service_checklist 
FOR SELECT 
TO authenticated 
USING ( 
    EXISTS ( 
        SELECT 1 
        FROM public.bookings b 
        JOIN public.washers w 
            ON w.id = b.assigned_washer_id 
        WHERE b.id = booking_service_checklist.booking_id 
          AND w.user_id = auth.uid() 
    ) 
); 
 
 
DROP POLICY IF EXISTS "washers_update_booking_checklist" 
ON public.booking_service_checklist; 
 
CREATE POLICY "washers_update_booking_checklist" 
ON public.booking_service_checklist 
FOR UPDATE 
TO authenticated 
USING ( 
    EXISTS ( 
        SELECT 1 
        FROM public.bookings b 
        JOIN public.washers w 
            ON w.id = b.assigned_washer_id 
        WHERE b.id = booking_service_checklist.booking_id 
          AND w.user_id = auth.uid() 
    ) 
) 
WITH CHECK ( 
    EXISTS ( 
        SELECT 1 
        FROM public.bookings b 
        JOIN public.washers w 
            ON w.id = b.assigned_washer_id 
        WHERE b.id = booking_service_checklist.booking_id 
          AND w.user_id = auth.uid() 
    ) 
);


