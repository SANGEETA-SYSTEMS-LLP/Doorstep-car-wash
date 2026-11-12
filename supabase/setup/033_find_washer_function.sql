-- =========================================================
-- FILE: 033_find_washer_function.sql
-- MODULE: Booking / Washer
-- PURPOSE:
--   Find an available verified washer and create assignment
-- RUN AFTER:
--   013_washers.sql
--   018_bookings.sql
--   019_booking_assignments.sql
-- =========================================================


CREATE OR REPLACE FUNCTION public.find_washer_for_booking(
    p_booking_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_customer_id UUID;
    v_washer_id UUID;
    v_assignment_id UUID;
BEGIN

    -- -----------------------------------------------------
    -- Verify that the booking belongs to current customer
    -- -----------------------------------------------------

    SELECT b.customer_id
    INTO v_customer_id
    FROM public.bookings b
    JOIN public.customers c
        ON c.id = b.customer_id
    WHERE b.id = p_booking_id
      AND c.user_id = auth.uid();


    IF v_customer_id IS NULL THEN
        RAISE EXCEPTION
            'Booking not found or not authorized';
    END IF;


    -- -----------------------------------------------------
    -- Prevent washer search for invalid booking states
    -- -----------------------------------------------------

    IF NOT EXISTS (
        SELECT 1
        FROM public.bookings b
        WHERE b.id = p_booking_id
          AND b.status IN (
              'pending',
              'confirmed',
              'finding_washer'
          )
    ) THEN
        RAISE EXCEPTION
            'Booking is not eligible for washer assignment';
    END IF;


    -- -----------------------------------------------------
    -- Find available + active + verified washer
    --
    -- Exclude washers already rejected/cancelled for
    -- this booking.
    -- -----------------------------------------------------

    SELECT w.id
    INTO v_washer_id
    FROM public.washers w
    WHERE w.status = 'available'
      AND w.is_active = TRUE
      AND w.is_verified = TRUE

      AND NOT EXISTS (
          SELECT 1
          FROM public.booking_assignments ba
          WHERE ba.booking_id = p_booking_id
            AND ba.washer_id = w.id
            AND ba.status IN (
                'rejected',
                'cancelled'
            )
      )

    ORDER BY
        w.rating DESC,
        w.jobs_completed DESC

    LIMIT 1;


    IF v_washer_id IS NULL THEN
        RAISE EXCEPTION 'No available washer';
    END IF;


    -- -----------------------------------------------------
    -- Change booking state
    -- -----------------------------------------------------

    UPDATE public.bookings
    SET status = 'finding_washer'
    WHERE id = p_booking_id;


    -- -----------------------------------------------------
    -- Create/update washer assignment
    -- -----------------------------------------------------

    INSERT INTO public.booking_assignments (
        booking_id,
        washer_id,
        status,
        expires_at
    )
    VALUES (
        p_booking_id,
        v_washer_id,
        'pending',
        NOW() + INTERVAL '2 minutes'
    )

    ON CONFLICT (
        booking_id,
        washer_id
    )

    DO UPDATE SET
        status = 'pending',
        offered_at = NOW(),
        responded_at = NULL,
        rejection_reason = NULL,
        expires_at =
            NOW() + INTERVAL '2 minutes'

    RETURNING id
    INTO v_assignment_id;


    RETURN v_assignment_id;

END;
$$;


