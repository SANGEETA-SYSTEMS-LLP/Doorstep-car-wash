-- Remove the hard 5 km/7 km distance cap for supervisor washer offers.
-- Distance remains visible on the booking; availability, fresh location, payout,
-- and schedule checks still determine whether an offer can be sent.
BEGIN;

CREATE OR REPLACE FUNCTION public.booking_washer_is_eligible(
  p_booking_id uuid,
  p_washer_id uuid
)
RETURNS boolean
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
  v_washer_latitude double precision;
  v_washer_longitude double precision;
  v_conflict boolean;
BEGIN
  SELECT id, status, assigned_washer_id, package_id, scheduled_date,
         scheduled_start_time, latitude, longitude, service_address
    INTO v_booking
    FROM public.bookings
   WHERE id = p_booking_id;

  IF NOT FOUND OR v_booking.assigned_washer_id IS NOT NULL
     OR v_booking.status NOT IN ('pending', 'confirmed', 'finding_washer', 'support_escalated')
     OR v_booking.scheduled_date IS NULL OR v_booking.scheduled_start_time IS NULL
     OR v_booking.latitude IS NULL OR v_booking.longitude IS NULL THEN
    RETURN false;
  END IF;

  SELECT id, status, is_active, is_verified, current_address
    INTO v_washer
    FROM public.washers
   WHERE id = p_washer_id;

  IF NOT FOUND OR v_washer.is_active IS DISTINCT FROM true OR v_washer.is_verified IS DISTINCT FROM true
     OR v_washer.status IS DISTINCT FROM 'available' THEN
    RETURN false;
  END IF;

  -- A saved, encrypted payout destination is required before any job offer can
  -- be sent or accepted. Provider credentials are not needed for this check.
  IF NOT EXISTS (
    SELECT 1 FROM public.washer_payout_accounts payout
     WHERE payout.washer_id = p_washer_id
       AND payout.account_label IS NOT NULL
       AND (payout.destination_encrypted IS NOT NULL OR payout.fund_account_id IS NOT NULL)
  ) THEN
    RETURN false;
  END IF;

  SELECT latitude, longitude, updated_at, service_latitude, service_longitude
    INTO v_location
    FROM public.washer_locations
   WHERE washer_id = p_washer_id;

  IF NOT FOUND OR v_location.updated_at IS NULL OR v_location.latitude IS NULL
     OR v_location.longitude IS NULL OR v_location.latitude NOT BETWEEN -90 AND 90
     OR v_location.longitude NOT BETWEEN -180 AND 180
     OR v_location.updated_at < now() - interval '15 minutes' THEN
    RETURN false;
  END IF;

  v_washer_latitude := coalesce(v_location.service_latitude, v_location.latitude);
  v_washer_longitude := coalesce(v_location.service_longitude, v_location.longitude);
  v_distance_km := 2 * 6371 * asin(sqrt(least(1::double precision, greatest(0::double precision,
    power(sin(radians((v_washer_latitude - v_booking.latitude) / 2)), 2) +
    cos(radians(v_booking.latitude)) * cos(radians(v_washer_latitude)) *
    power(sin(radians((v_washer_longitude - v_booking.longitude) / 2)), 2)
  ))));

  -- Identical saved street addresses are treated as the same service location;
  -- this handles legacy GPS pins that were overwritten while a washer was online.
  IF nullif(regexp_replace(lower(coalesce(v_booking.service_address, '')), '[^[:alnum:]]', '', 'g'), '')
     = nullif(regexp_replace(lower(coalesce(v_washer.current_address, '')), '[^[:alnum:]]', '', 'g'), '') THEN
    v_distance_km := 0;
  END IF;

  -- Washer distance is shown to supervisors for context. Do not block offers
  -- by the profile radius; online status, live location, payout, and schedule
  -- checks below still apply.

  SELECT duration_minutes INTO v_package
    FROM public.service_packages WHERE id = v_booking.package_id;

  SELECT EXISTS (
    SELECT 1
      FROM public.bookings existing
      LEFT JOIN public.service_packages existing_package ON existing_package.id = existing.package_id
     WHERE existing.assigned_washer_id = p_washer_id AND existing.id <> p_booking_id
       AND existing.status IN ('washer_assigned', 'washer_on_the_way', 'washer_arrived',
                               'otp_verified', 'service_started', 'service_completed')
       AND existing.scheduled_date IS NOT NULL AND existing.scheduled_start_time IS NOT NULL
       AND (v_booking.scheduled_date::date + v_booking.scheduled_start_time::time) <
           (existing.scheduled_date::date + existing.scheduled_start_time::time
             + make_interval(mins => coalesce(existing_package.duration_minutes, 60)))
       AND (existing.scheduled_date::date + existing.scheduled_start_time::time) <
           (v_booking.scheduled_date::date + v_booking.scheduled_start_time::time
             + make_interval(mins => coalesce(v_package.duration_minutes, 60)))
  ) INTO v_conflict;

  RETURN NOT v_conflict;
END;
$function$;

COMMIT;

