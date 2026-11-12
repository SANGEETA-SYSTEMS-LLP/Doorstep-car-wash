-- =========================================================
-- FILE: 034_accept_assignment_function.sql
-- MODULE: Washer
-- PURPOSE: Washer accepts booking assignment
-- RUN AFTER:
--   013_washers.sql
--   018_bookings.sql
--   019_booking_assignments.sql
-- =========================================================


CREATE OR REPLACE FUNCTION public.accept_booking_assignment(
    p_assignment_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_washer_id UUID;
    v_booking_id UUID;
    v_assignment_status public.assignment_status;
    v_expires_at TIMESTAMPTZ;
BEGIN

    -- Lock assignment
    SELECT
        ba.washer_id,
        ba.booking_id,
        ba.status,
        ba.expires_at

    INTO
        v_washer_id,
        v_booking_id,
        v_assignment_status,
        v_expires_at

    FROM public.booking_assignments ba

    JOIN public.washers w
        ON w.id = ba.washer_id

    WHERE ba.id = p_assignment_id
      AND w.user_id = auth.uid()

    FOR UPDATE;


    IF v_booking_id IS NULL THEN
        RAISE EXCEPTION
            'Assignment not found or not authorized';
    END IF;


    IF v_assignment_status <> 'pending' THEN
        RAISE EXCEPTION
            'Assignment is no longer pending';
    END IF;


    -- Check expiry
    IF v_expires_at IS NOT NULL
       AND v_expires_at < NOW()
    THEN

        UPDATE public.booking_assignments
        SET
            status = 'expired',
            responded_at = NOW()
        WHERE id = p_assignment_id;

        RAISE EXCEPTION
            'Assignment has expired';
    END IF;


    -- Make sure booking hasn't already been assigned
    IF EXISTS (
        SELECT 1
        FROM public.bookings b
        WHERE b.id = v_booking_id
          AND b.assigned_washer_id IS NOT NULL
    ) THEN
        RAISE EXCEPTION
            'Booking already has an assigned washer';
    END IF;


    -- Accept selected assignment
    UPDATE public.booking_assignments
    SET
        status = 'accepted',
        responded_at = NOW()
    WHERE id = p_assignment_id;


    -- Cancel any other pending assignment
    UPDATE public.booking_assignments
    SET
        status = 'cancelled',
        responded_at = NOW()
    WHERE booking_id = v_booking_id
      AND id <> p_assignment_id
      AND status = 'pending';


    -- Assign washer
    UPDATE public.bookings
    SET
        assigned_washer_id = v_washer_id,
        status = 'washer_assigned'
    WHERE id = v_booking_id;


    -- Washer becomes busy
    UPDATE public.washers
    SET status = 'busy'
    WHERE id = v_washer_id;


    RETURN v_booking_id;

END;
$$;


