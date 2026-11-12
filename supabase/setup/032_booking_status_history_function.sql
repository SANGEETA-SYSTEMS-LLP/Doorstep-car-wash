-- =========================================================
-- FILE: 032_booking_status_history_function.sql
-- MODULE: Booking
-- PURPOSE:
--   Automatically record booking status changes
-- RUN AFTER:
--   018_bookings.sql
--   020_booking_status_history.sql
-- =========================================================


CREATE OR REPLACE FUNCTION public.log_booking_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN

    -- Booking created
    IF TG_OP = 'INSERT' THEN

        INSERT INTO public.booking_status_history (
            booking_id,
            status,
            changed_by,
            notes
        )
        VALUES (
            NEW.id,
            NEW.status,
            auth.uid(),
            'Booking created'
        );


    -- Existing booking status changed
    ELSIF TG_OP = 'UPDATE'
       AND OLD.status IS DISTINCT FROM NEW.status
    THEN

        INSERT INTO public.booking_status_history (
            booking_id,
            status,
            changed_by,
            notes
        )
        VALUES (
            NEW.id,
            NEW.status,
            auth.uid(),
            'Booking status changed from '
            || OLD.status::TEXT
            || ' to '
            || NEW.status::TEXT
        );

    END IF;


    RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS booking_status_history_trigger
ON public.bookings;


CREATE TRIGGER booking_status_history_trigger
AFTER INSERT OR UPDATE OF status
ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.log_booking_status();


