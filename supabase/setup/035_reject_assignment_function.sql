-- =========================================================
-- FILE: 035_reject_assignment_function.sql
-- MODULE: Washer
-- PURPOSE: Washer rejects a booking assignment
-- RUN AFTER: 019_booking_assignments.sql
-- =========================================================


CREATE OR REPLACE FUNCTION public.reject_booking_assignment(
    p_assignment_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_booking_id UUID;
BEGIN

    -- Verify assignment belongs to current washer
    SELECT ba.booking_id
    INTO v_booking_id

    FROM public.booking_assignments ba

    JOIN public.washers w
        ON w.id = ba.washer_id

    WHERE ba.id = p_assignment_id
      AND w.user_id = auth.uid()
      AND ba.status = 'pending';


    IF v_booking_id IS NULL THEN
        RAISE EXCEPTION
            'Pending assignment not found or not authorized';
    END IF;


    UPDATE public.booking_assignments
    SET
        status = 'rejected',
        rejection_reason = p_reason,
        responded_at = NOW()
    WHERE id = p_assignment_id;


    RETURN v_booking_id;

END;
$$;


