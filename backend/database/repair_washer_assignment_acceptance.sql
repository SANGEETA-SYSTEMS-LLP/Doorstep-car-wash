-- Washer assignments follow this lifecycle:
-- signup -> complete profile -> supervisor verification -> washer goes online
-- -> receives an eligible offer -> accepts and confirms that offer.
-- Run in Supabase SQL Editor as database owner. Safe to re-run.
BEGIN;

-- Keep the registered service pin separate from the changing live GPS pin.
ALTER TABLE public.washer_locations
  ADD COLUMN IF NOT EXISTS service_latitude double precision,
  ADD COLUMN IF NOT EXISTS service_longitude double precision;

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

-- Drop first so this repair also works when an older deployment returned UUID.
DROP FUNCTION IF EXISTS public.accept_booking_assignment(uuid);

CREATE FUNCTION public.accept_booking_assignment(p_assignment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_washer public.washers%rowtype;
  v_assignment public.booking_assignments%rowtype;
  v_booking public.bookings%rowtype;
  v_profile_role text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING errcode = '28000';
  END IF;

  SELECT role INTO v_profile_role FROM public.profiles
   WHERE id = v_user_id AND is_active = true;
  IF NOT FOUND OR v_profile_role IS DISTINCT FROM 'washer' THEN
    RAISE EXCEPTION 'Active washer account required.' USING errcode = '42501';
  END IF;

  SELECT * INTO v_washer FROM public.washers
   WHERE user_id = v_user_id AND is_active = true
   FOR UPDATE;
  IF NOT FOUND OR v_washer.is_verified IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Supervisor verification is required before accepting jobs.' USING errcode = '42501';
  END IF;
  IF v_washer.status IS DISTINCT FROM 'available' THEN
    RAISE EXCEPTION 'Go online before accepting a booking.' USING errcode = '40001';
  END IF;

  SELECT * INTO v_assignment FROM public.booking_assignments
   WHERE id = p_assignment_id;
  IF NOT FOUND OR v_assignment.washer_id <> v_washer.id THEN
    RAISE EXCEPTION 'Assignment not found.' USING errcode = '42501';
  END IF;
  IF v_assignment.status <> 'pending' OR v_assignment.expires_at IS NULL
     OR v_assignment.expires_at <= now() THEN
    RAISE EXCEPTION 'Assignment is no longer available.' USING errcode = '40001';
  END IF;

  SELECT * INTO v_booking FROM public.bookings
   WHERE id = v_assignment.booking_id FOR UPDATE;
  IF NOT FOUND OR NOT public.booking_washer_is_eligible(v_booking.id, v_washer.id) THEN
    RAISE EXCEPTION 'Booking is no longer eligible for this washer.' USING errcode = '40001';
  END IF;

  SELECT * INTO v_assignment FROM public.booking_assignments
   WHERE id = p_assignment_id FOR UPDATE;
  IF NOT FOUND OR v_assignment.washer_id IS DISTINCT FROM v_washer.id
     OR v_assignment.status IS DISTINCT FROM 'pending'
     OR v_assignment.expires_at IS NULL OR v_assignment.expires_at <= now() THEN
    RAISE EXCEPTION 'Assignment is no longer available.' USING errcode = '40001';
  END IF;

  UPDATE public.bookings
     SET assigned_washer_id = v_washer.id,
         status = 'washer_assigned',
         requires_supervisor = false,
         updated_at = now()
   WHERE id = v_booking.id RETURNING * INTO v_booking;

  UPDATE public.booking_assignments
     SET status = 'accepted', responded_at = now()
   WHERE id = v_assignment.id RETURNING * INTO v_assignment;

  -- A booking has one confirmed washer; clear every other outstanding offer.
  UPDATE public.booking_assignments
     SET status = 'cancelled', responded_at = now(),
         rejection_reason = 'Another washer accepted this booking.'
   WHERE booking_id = v_booking.id AND id <> v_assignment.id AND status = 'pending';

  UPDATE public.washers SET status = 'busy', updated_at = now()
   WHERE id = v_washer.id;

  RETURN jsonb_build_object('booking', to_jsonb(v_booking), 'assignment', to_jsonb(v_assignment));
END;
$function$;

-- Backend wrapper for the service-role API. The API resolves p_washer_id from
-- the authenticated user before calling this function. Do not grant this to
-- anon or authenticated because those roles could choose arbitrary washer IDs.
CREATE OR REPLACE FUNCTION public.accept_booking_assignment_for_user(
  p_assignment_id uuid,
  p_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_washer public.washers%rowtype;
  v_assignment public.booking_assignments%rowtype;
  v_booking public.bookings%rowtype;
BEGIN
  IF p_user_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND role = 'washer' AND is_active = true) THEN
    RAISE EXCEPTION 'Active washer account required.' USING errcode = '42501';
  END IF;
  SELECT * INTO v_washer FROM public.washers WHERE user_id = p_user_id AND is_active = true FOR UPDATE;
  IF NOT FOUND OR v_washer.is_verified IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Supervisor verification is required before accepting jobs.' USING errcode = '42501';
  END IF;
  IF v_washer.status IS DISTINCT FROM 'available' THEN
    RAISE EXCEPTION 'Go online before accepting a booking.' USING errcode = '40001';
  END IF;
  SELECT * INTO v_assignment FROM public.booking_assignments WHERE id = p_assignment_id;
  IF NOT FOUND OR v_assignment.washer_id <> v_washer.id THEN
    RAISE EXCEPTION 'Assignment not found.' USING errcode = '42501';
  END IF;
  IF v_assignment.status <> 'pending' OR v_assignment.expires_at IS NULL OR v_assignment.expires_at <= now() THEN
    RAISE EXCEPTION 'Assignment is no longer available.' USING errcode = '40001';
  END IF;
  SELECT * INTO v_booking FROM public.bookings WHERE id = v_assignment.booking_id FOR UPDATE;
  IF NOT FOUND OR NOT public.booking_washer_is_eligible(v_booking.id, v_washer.id) THEN
    RAISE EXCEPTION 'Booking is no longer eligible for this washer.' USING errcode = '40001';
  END IF;
  SELECT * INTO v_assignment FROM public.booking_assignments WHERE id = p_assignment_id FOR UPDATE;
  IF NOT FOUND OR v_assignment.washer_id IS DISTINCT FROM v_washer.id
     OR v_assignment.status IS DISTINCT FROM 'pending' OR v_assignment.expires_at IS NULL OR v_assignment.expires_at <= now() THEN
    RAISE EXCEPTION 'Assignment is no longer available.' USING errcode = '40001';
  END IF;
  UPDATE public.bookings SET assigned_washer_id = v_washer.id, status = 'washer_assigned',
    requires_supervisor = false, updated_at = now()
   WHERE id = v_booking.id RETURNING * INTO v_booking;
  UPDATE public.booking_assignments SET status = 'accepted', responded_at = now()
   WHERE id = v_assignment.id RETURNING * INTO v_assignment;
  UPDATE public.booking_assignments SET status = 'cancelled', responded_at = now(),
    rejection_reason = 'Another washer accepted this booking.'
   WHERE booking_id = v_booking.id AND id <> v_assignment.id AND status = 'pending';
  UPDATE public.washers SET status = 'busy', updated_at = now() WHERE id = v_washer.id;
  RETURN jsonb_build_object('booking', to_jsonb(v_booking), 'assignment', to_jsonb(v_assignment));
END;
$function$;

CREATE OR REPLACE FUNCTION public.accept_booking_assignment_for_washer(
  p_assignment_id uuid,
  p_washer_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE v_user_id uuid;
BEGIN
  SELECT user_id INTO v_user_id FROM public.washers
   WHERE id = p_washer_id AND is_active = true AND is_verified = true;
  IF NOT FOUND OR v_user_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id AND role = 'washer' AND is_active = true) THEN
    RAISE EXCEPTION 'Active verified washer account required.' USING errcode = '42501';
  END IF;
  RETURN public.accept_booking_assignment_for_user(p_assignment_id, v_user_id);
END;
$function$;

-- Supervisor selection creates an offer only. Acceptance confirms the washer.
DROP FUNCTION IF EXISTS public.supervisor_assign_washer(uuid, uuid, uuid);
CREATE FUNCTION public.supervisor_assign_washer(
  p_booking_id uuid, p_washer_id uuid, p_supervisor_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $function$
DECLARE
  v_assignment public.booking_assignments%rowtype;
  v_attempt integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_supervisor_id
    AND role = 'supervisor' AND is_active = true) THEN
    RAISE EXCEPTION 'Active supervisor account required.' USING errcode = '42501';
  END IF;
  -- Match acceptance lock order: washer, then booking, then offers.
  PERFORM 1 FROM public.washers WHERE id = p_washer_id FOR UPDATE;
  PERFORM 1 FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT public.booking_washer_is_eligible(p_booking_id, p_washer_id) THEN
    RAISE EXCEPTION 'Washer is no longer eligible for this booking.' USING errcode = '40001';
  END IF;
  IF EXISTS (SELECT 1 FROM public.booking_assignments WHERE booking_id = p_booking_id
    AND status = 'pending' AND expires_at > now()) THEN
    RAISE EXCEPTION 'An offer is already waiting for washer acceptance.' USING errcode = '40001';
  END IF;
  SELECT coalesce(max(attempt_number), 0) + 1 INTO v_attempt
    FROM public.booking_assignments WHERE booking_id = p_booking_id;
  UPDATE public.booking_assignments SET status = 'expired', responded_at = now()
    WHERE booking_id = p_booking_id AND status = 'pending';
  SELECT * INTO v_assignment FROM public.booking_assignments
    WHERE booking_id = p_booking_id AND washer_id = p_washer_id FOR UPDATE;
  IF FOUND THEN
    UPDATE public.booking_assignments SET status = 'pending', offered_at = now(),
      expires_at = now() + interval '2 minutes', responded_at = null,
      rejection_reason = null, attempt_number = v_attempt
      WHERE id = v_assignment.id RETURNING * INTO v_assignment;
  ELSE
    INSERT INTO public.booking_assignments
      (id, booking_id, washer_id, status, offered_at, expires_at, attempt_number)
    VALUES (gen_random_uuid(), p_booking_id, p_washer_id, 'pending', now(),
      now() + interval '2 minutes', v_attempt) RETURNING * INTO v_assignment;
  END IF;
  UPDATE public.bookings SET status = 'finding_washer', requires_supervisor = false,
    updated_at = now() WHERE id = p_booking_id;
  RETURN to_jsonb(v_assignment);
END;
$function$;
REVOKE ALL ON FUNCTION public.supervisor_assign_washer(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.supervisor_assign_washer(uuid, uuid, uuid) TO service_role;

REVOKE ALL ON FUNCTION public.booking_washer_is_eligible(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.accept_booking_assignment(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_booking_assignment(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.accept_booking_assignment_for_washer(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_booking_assignment_for_washer(uuid, uuid) TO service_role;
REVOKE ALL ON FUNCTION public.accept_booking_assignment_for_user(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.booking_washer_is_eligible(uuid, uuid) TO service_role;

COMMIT;
NOTIFY pgrst, 'reload schema';

-- Confirmation: accept RPC must now return jsonb.
SELECT p.proname, pg_get_function_result(p.oid) AS result_type
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.proname = 'accept_booking_assignment';
