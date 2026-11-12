-- Repair the booking notification trigger in the existing Supabase project.
-- Add the selected payment method and keep notification event values valid for
-- the deployed booking_status enum.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_method text;

DO $backfill$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'payment_method'
  ) THEN
    EXECUTE $sql$
      UPDATE public.bookings AS b
      SET payment_method = (
        SELECT payments.payment_method::text
        FROM public.payments
        WHERE payments.booking_id = b.id
        ORDER BY payments.created_at DESC
        LIMIT 1
      )
      WHERE b.payment_method IS NULL
    $sql$;
  END IF;
END
$backfill$;

BEGIN;

CREATE OR REPLACE FUNCTION public.create_customer_booking_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  notification_title text;
  notification_message text;
  notification_type text;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  -- event_type is backed by booking_status in deployed schemas. The fallback
  -- must therefore be a real enum label, not the UI-only "booking_update".
  notification_type := COALESCE(NEW.status::text, 'pending');
  notification_title := CASE NEW.status::text
    WHEN 'pending' THEN 'Booking received'
    WHEN 'payment_completed' THEN 'Payment confirmed'
    WHEN 'finding_washer' THEN 'Finding your washer'
    WHEN 'washer_assigned' THEN 'Washer assigned'
    WHEN 'washer_on_the_way' THEN 'Washer on the way'
    WHEN 'washer_arrived' THEN 'Washer has arrived'
    WHEN 'otp_verified' THEN 'Service verified'
    WHEN 'service_started' THEN 'Service started'
    WHEN 'service_completed' THEN 'Service completed'
    WHEN 'completed' THEN 'Booking complete'
    WHEN 'customer_approved' THEN 'Extra charge approved'
    WHEN 'customer_rejected' THEN 'Extra charge declined'
    WHEN 'customer_confirmed' THEN 'Booking complete'
    WHEN 'rejected' THEN 'Booking update'
    WHEN 'expired' THEN 'Booking update'
    WHEN 'cancelled' THEN 'Booking cancelled'
    WHEN 'payment_failed' THEN 'Payment unsuccessful'
    ELSE 'Booking update'
  END;

  notification_message := CASE NEW.status::text
    WHEN 'pending' THEN 'Your booking has been received. We will keep you updated.'
    WHEN 'payment_completed' THEN 'Your payment was successful.'
    WHEN 'finding_washer' THEN 'We are finding a washer for your booking.'
    WHEN 'washer_assigned' THEN 'A washer has been assigned to your booking.'
    WHEN 'washer_on_the_way' THEN 'Your washer is on the way to your location.'
    WHEN 'washer_arrived' THEN 'Your washer has arrived at your location.'
    WHEN 'otp_verified' THEN 'Your service verification is complete.'
    WHEN 'service_started' THEN 'Your car wash service has started.'
    WHEN 'service_completed' THEN 'Your service is complete and awaiting final review.'
    WHEN 'completed' THEN 'Your booking is complete. Thank you!'
    WHEN 'customer_approved' THEN 'You approved the additional service charge.'
    WHEN 'customer_rejected' THEN 'You declined the additional service charge.'
    WHEN 'customer_confirmed' THEN 'Your booking is complete. Thank you!'
    WHEN 'rejected' THEN 'We could not assign a washer to this booking. Please check your booking for details.'
    WHEN 'expired' THEN 'The washer assignment window expired. Please check your booking for the latest update.'
    WHEN 'cancelled' THEN 'Your booking has been cancelled.'
    WHEN 'payment_failed' THEN 'Your payment could not be completed. Please review your booking.'
    ELSE 'Your booking status changed to ' ||
      replace(COALESCE(NEW.status::text, 'updated'), '_', ' ') || '.'
  END;

  INSERT INTO public.customer_notifications (
    customer_id,
    booking_id,
    booking_number,
    event_type,
    title,
    message
  )
  VALUES (
    NEW.customer_id,
    NEW.id,
    NEW.booking_number,
    notification_type,
    notification_title,
    CASE
      WHEN NEW.booking_number IS NOT NULL
        THEN 'Booking ' || NEW.booking_number || ': ' || notification_message
      ELSE notification_message
    END
  );

  RETURN NEW;
END;
$function$;

COMMIT;

NOTIFY pgrst, 'reload schema';

-- Verify the deployed function contains the enum-to-text cast.
SELECT p.proname,
       pg_get_functiondef(p.oid) ILIKE '%notification_type := COALESCE(NEW.status::text, ''pending'')%'
         AS cast_fix_present
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'create_customer_booking_notification';
