-- =========================================================
-- FILE: 051_supervisor_manual_assignment.sql
-- MODULE: Supervisor
-- PURPOSE: Manually assign an available washer to a booking
-- RUN AFTER:
--   013_washers.sql
--   018_bookings.sql
--   019_booking_assignments.sql
--   020_booking_status_history.sql
-- =========================================================

CREATE OR REPLACE FUNCTION public.supervisor_assign_washer(
    p_booking_id UUID,
    p_washer_id UUID,
    p_supervisor_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_booking public.bookings%ROWTYPE;
    v_washer public.washers%ROWTYPE;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    IF p_supervisor_id IS NULL THEN
        RAISE EXCEPTION 'Supervisor ID is required';
    END IF;

    -- Lock the booking to prevent simultaneous assignments.
    SELECT b.*
    INTO v_booking
    FROM public.bookings b
    WHERE b.id = p_booking_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found';
    END IF;

    IF v_booking.assigned_washer_id IS NOT NULL THEN
        RAISE EXCEPTION 'Booking already has an assigned washer';
    END IF;

    IF v_booking.requires_supervisor IS NOT TRUE THEN
        RAISE EXCEPTION 'Booking does not require supervisor assignment';
    END IF;

    IF v_booking.status NOT IN (
        'pending',
        'confirmed',
        'finding_washer',
        'support_escalated'
    ) THEN
        RAISE EXCEPTION 'Booking status does not allow assignment';
    END IF;

    -- Lock and validate the selected washer.
    SELECT w.*
    INTO v_washer
    FROM public.washers w
    WHERE w.id = p_washer_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Washer not found';
    END IF;

    IF v_washer.is_active IS NOT TRUE
       OR v_washer.is_verified IS NOT TRUE
       OR v_washer.status <> 'available'
    THEN
        RAISE EXCEPTION 'Washer is not eligible for assignment';
    END IF;

    -- Cancel competing pending offers.
    UPDATE public.booking_assignments
    SET
        status = 'cancelled',
        responded_at = v_now
    WHERE booking_id = p_booking_id
      AND status = 'pending'
      AND washer_id <> p_washer_id;

    -- Create or update the selected washer's assignment.
    INSERT INTO public.booking_assignments (
        booking_id,
        washer_id,
        status,
        attempt_number,
        offered_at,
        responded_at
    )
    VALUES (
        p_booking_id,
        p_washer_id,
        'accepted',
        1,
        v_now,
        v_now
    )
    ON CONFLICT (booking_id, washer_id)
    DO UPDATE SET
        status = 'accepted',
        responded_at = v_now,
        rejection_reason = NULL,
        expires_at = NULL;

    -- Assign the washer to the booking.
    UPDATE public.bookings
    SET
        assigned_washer_id = p_washer_id,
        status = 'washer_assigned',
        requires_supervisor = FALSE,
        updated_at = v_now
    WHERE id = p_booking_id;

    -- Mark the washer busy.
    UPDATE public.washers
    SET
        status = 'busy',
        updated_at = v_now
    WHERE id = p_washer_id;

    -- Record the assignment in booking history.
    INSERT INTO public.booking_status_history (
        booking_id,
        status,
        changed_by,
        notes,
        created_at
    )
    VALUES (
        p_booking_id,
        'washer_assigned',
        p_supervisor_id,
        'Washer manually assigned by supervisor',
        v_now
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'booking_id', p_booking_id,
        'washer_id', p_washer_id,
        'status', 'washer_assigned'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.supervisor_assign_washer(
    UUID, UUID, UUID
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.supervisor_assign_washer(
    UUID, UUID, UUID
) TO service_role;
