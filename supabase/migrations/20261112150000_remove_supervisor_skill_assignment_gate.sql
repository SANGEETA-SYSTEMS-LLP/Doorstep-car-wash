BEGIN;

-- Skills are not required for supervisors to send washer assignment offers.
-- Preserve all other booking, location, radius, payout, and availability checks.
CREATE OR REPLACE FUNCTION public.booking_washer_is_eligible(p_booking_id uuid, p_washer_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $function$
DECLARE b record; w record; loc record; pkg record; d double precision; conflict boolean;
BEGIN
  SELECT id,status,assigned_washer_id,package_id,scheduled_date,scheduled_start_time,latitude,longitude,service_address
    INTO b FROM public.bookings WHERE id = p_booking_id;
  IF NOT FOUND OR b.assigned_washer_id IS NOT NULL OR b.status::text NOT IN
     ('pending','confirmed','finding_washer','support_escalated','payment_completed')
     OR b.scheduled_date IS NULL OR b.scheduled_start_time IS NULL OR b.latitude IS NULL OR b.longitude IS NULL THEN RETURN false; END IF;
  SELECT id,status,is_active,is_verified,current_address,supervisor_id,service_radius_km
    INTO w FROM public.washers WHERE id = p_washer_id;
  IF NOT FOUND OR w.is_active IS DISTINCT FROM true OR w.is_verified IS DISTINCT FROM true OR w.status::text <> 'available' THEN RETURN false; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.washer_payout_accounts p WHERE p.washer_id=p_washer_id
      AND p.account_label IS NOT NULL AND (p.destination_encrypted IS NOT NULL OR p.fund_account_id IS NOT NULL)) THEN RETURN false; END IF;
  SELECT latitude,longitude,updated_at,service_latitude,service_longitude INTO loc
    FROM public.washer_locations WHERE washer_id=p_washer_id;
  IF NOT FOUND OR loc.updated_at IS NULL OR loc.latitude IS NULL OR loc.longitude IS NULL
     OR loc.latitude NOT BETWEEN -90 AND 90 OR loc.longitude NOT BETWEEN -180 AND 180
     OR loc.updated_at < now()-interval '15 minutes' THEN RETURN false; END IF;
  d := 2*6371*asin(sqrt(least(1::double precision,greatest(0::double precision,
    power(sin(radians((coalesce(loc.service_latitude,loc.latitude)-b.latitude)/2)),2)
    +cos(radians(b.latitude))*cos(radians(coalesce(loc.service_latitude,loc.latitude)))
    *power(sin(radians((coalesce(loc.service_longitude,loc.longitude)-b.longitude)/2)),2)))));
  IF nullif(regexp_replace(lower(coalesce(b.service_address,'')),'[^[:alnum:]]','','g'),'')
     = nullif(regexp_replace(lower(coalesce(w.current_address,'')),'[^[:alnum:]]','','g'),'') THEN d:=0; END IF;
  SELECT duration_minutes INTO pkg FROM public.service_packages WHERE id=b.package_id;
  IF d > least(greatest(coalesce(w.service_radius_km,5),5),100) THEN RETURN false; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.washer_availability a WHERE a.washer_id=p_washer_id
      AND a.day_of_week=extract(dow from b.scheduled_date)::integer AND a.is_available=true
      AND a.start_time <= b.scheduled_start_time AND a.end_time >= b.scheduled_start_time + make_interval(mins=>coalesce(pkg.duration_minutes,60))) THEN RETURN false; END IF;
  SELECT EXISTS (SELECT 1 FROM public.bookings x LEFT JOIN public.service_packages xp ON xp.id=x.package_id
    WHERE x.assigned_washer_id=p_washer_id AND x.id<>p_booking_id
      AND x.status::text IN ('washer_assigned','washer_on_the_way','washer_arrived','otp_verified','service_started','service_completed')
      AND (b.scheduled_date+b.scheduled_start_time) < (x.scheduled_date+x.scheduled_start_time+make_interval(mins=>coalesce(xp.duration_minutes,60)+30))
      AND (x.scheduled_date+x.scheduled_start_time) < (b.scheduled_date+b.scheduled_start_time+make_interval(mins=>coalesce(pkg.duration_minutes,60)+30))) INTO conflict;
  RETURN NOT conflict;
END;
$function$;

REVOKE ALL ON FUNCTION public.booking_washer_is_eligible(uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.booking_washer_is_eligible(uuid,uuid) TO service_role;

COMMIT;
NOTIFY pgrst, 'reload schema';
