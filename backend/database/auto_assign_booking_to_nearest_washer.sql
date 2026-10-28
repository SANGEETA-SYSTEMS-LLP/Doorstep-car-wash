-- Use fresh washer GPS coordinates for booking matching and automatically
-- offer a paid booking to the closest currently eligible washer.
BEGIN;

CREATE OR REPLACE FUNCTION public.booking_washer_is_eligible(
  p_booking_id uuid,
  p_washer_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_booking record;
  v_washer record;
  v_location record;
  v_package record;
  v_distance_km double precision;
  v_conflict boolean;
BEGIN
  SELECT id, status, assigned_washer_id, package_id, scheduled_date,
         scheduled_start_time, latitude, longitude, payment_method
    INTO v_booking
    FROM public.bookings WHERE id = p_booking_id;
  IF NOT FOUND OR v_booking.assigned_washer_id IS NOT NULL
     OR v_booking.status::text NOT IN ('pending', 'confirmed', 'finding_washer', 'support_escalated')
     OR v_booking.scheduled_date IS NULL OR v_booking.scheduled_start_time IS NULL
     OR v_booking.latitude IS NULL OR v_booking.longitude IS NULL THEN
    RETURN false;
  END IF;
  IF lower(coalesce(v_booking.payment_method::text, '')) NOT IN ('cod', 'cash')
     AND NOT EXISTS (SELECT 1 FROM public.payments WHERE booking_id = p_booking_id AND status = 'paid') THEN
    RETURN false;
  END IF;

  SELECT id, status, is_active, is_verified, service_radius_km
    INTO v_washer FROM public.washers WHERE id = p_washer_id;
  IF NOT FOUND OR v_washer.is_active IS DISTINCT FROM true
     OR v_washer.is_verified IS DISTINCT FROM true
     OR v_washer.status::text IS DISTINCT FROM 'available' THEN
    RETURN false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.washer_payout_accounts payout
     WHERE payout.washer_id = p_washer_id AND payout.account_label IS NOT NULL
       AND (payout.destination_encrypted IS NOT NULL OR payout.fund_account_id IS NOT NULL)
  ) THEN RETURN false; END IF;

  SELECT latitude, longitude, updated_at INTO v_location
    FROM public.washer_locations WHERE washer_id = p_washer_id;
  IF NOT FOUND OR v_location.updated_at IS NULL OR v_location.latitude IS NULL
     OR v_location.longitude IS NULL OR v_location.latitude NOT BETWEEN -90 AND 90
     OR v_location.longitude NOT BETWEEN -180 AND 180
     OR v_location.updated_at < now() - interval '15 minutes' THEN
    RETURN false;
  END IF;

  v_distance_km := 2 * 6371 * asin(sqrt(least(1::double precision, greatest(0::double precision,
    power(sin(radians((v_location.latitude - v_booking.latitude) / 2)), 2) +
    cos(radians(v_booking.latitude)) * cos(radians(v_location.latitude)) *
    power(sin(radians((v_location.longitude - v_booking.longitude) / 2)), 2)
  ))));
  IF v_distance_km > least(greatest(coalesce(nullif(v_washer.service_radius_km, 0), 5), 5), 7) THEN
    RETURN false;
  END IF;

  SELECT duration_minutes INTO v_package FROM public.service_packages WHERE id = v_booking.package_id;
  SELECT EXISTS (
    SELECT 1 FROM public.bookings existing
      LEFT JOIN public.service_packages existing_package ON existing_package.id = existing.package_id
     WHERE existing.assigned_washer_id = p_washer_id AND existing.id <> p_booking_id
       AND existing.status::text IN ('washer_assigned', 'washer_on_the_way', 'washer_arrived', 'otp_verified', 'service_started', 'service_completed')
       AND existing.scheduled_date IS NOT NULL AND existing.scheduled_start_time IS NOT NULL
       AND (v_booking.scheduled_date::date + v_booking.scheduled_start_time::time) <
           (existing.scheduled_date::date + existing.scheduled_start_time::time + make_interval(mins => coalesce(existing_package.duration_minutes, 60)))
       AND (existing.scheduled_date::date + v_booking.scheduled_start_time::time) <
           (v_booking.scheduled_date::date + v_booking.scheduled_start_time::time + make_interval(mins => coalesce(v_package, 60)))
  ) INTO v_conflict;
  RETURN NOT v_conflict;
END;
$function$;

-- Keep the live eligibility check for supervisor-selected assignments only.
GRANT EXECUTE ON FUNCTION public.booking_washer_is_eligible(uuid, uuid) TO service_role;

COMMIT;
NOTIFY pgrst, 'reload schema';
