-- Consolidated feature migration for the existing Car Wash application.
-- This upgrades an existing schema. It is NOT a clean-install/baseline script.
-- Prerequisites: profiles, washers, bookings, booking_assignments,
-- washer_locations, washer_payout_accounts, service_packages, washer_skills,
-- washer_availability, payments, customers, and auth.uid() already exist.
-- Review duplicate active payment rows before applying this script.

BEGIN;

-- A booking paid before assignment stays payment_completed until an offer is
-- accepted. Add the label before installing RPCs that store it. PostgreSQL
-- commits this enum addition separately from transactional migration work.
DO $migration$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
      WHERE n.nspname='public' AND t.typname='booking_status' AND t.typtype='e') THEN
    ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'payment_completed';
  END IF;
END;
$migration$;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS requires_supervisor boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS service_completed_at timestamptz;

ALTER TABLE public.washer_locations
  ADD COLUMN IF NOT EXISTS service_latitude double precision,
  ADD COLUMN IF NOT EXISTS service_longitude double precision;

CREATE TABLE IF NOT EXISTS public.supervisor_service_areas (
  supervisor_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  address text NOT NULL CHECK (char_length(btrim(address)) BETWEEN 10 AND 500),
  latitude double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.supervisor_service_areas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.supervisor_service_areas FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supervisor_service_areas TO service_role;

-- Do not silently delete/reconcile live financial records to make this index.
DO $migration$
BEGIN
  IF EXISTS (
    SELECT booking_id FROM public.payments
     WHERE booking_id IS NOT NULL AND status IN ('created', 'paid')
     GROUP BY booking_id HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Multiple active payments exist for a booking. Reconcile them before applying this migration.';
  END IF;
END;
$migration$;
CREATE UNIQUE INDEX IF NOT EXISTS payments_one_active_per_booking_idx
  ON public.payments (booking_id)
  WHERE booking_id IS NOT NULL AND status IN ('created', 'paid');

CREATE OR REPLACE FUNCTION public.complete_booking_payment(
  p_payment_id uuid,
  p_provider_payment_id text,
  p_provider_method text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $function$
DECLARE
  v_payment public.payments%rowtype;
  v_booking public.bookings%rowtype;
  v_outcome text;
BEGIN
  SELECT * INTO v_payment FROM public.payments
   WHERE id = p_payment_id AND lower(coalesce(provider, '')) = 'razorpay';
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found.' USING errcode = 'P0002'; END IF;
  SELECT * INTO v_booking FROM public.bookings WHERE id = v_payment.booking_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found.' USING errcode = 'P0002'; END IF;
  SELECT * INTO v_payment FROM public.payments WHERE id = p_payment_id FOR UPDATE;
  IF v_payment.status = 'paid' THEN
    IF v_payment.provider_payment_id IS DISTINCT FROM p_provider_payment_id THEN
      RAISE EXCEPTION 'Payment was completed with a different provider payment.' USING errcode = '23505';
    END IF;
  ELSE
    IF v_payment.status <> 'created' OR p_provider_payment_id IS NULL OR btrim(p_provider_payment_id) = '' THEN
      RAISE EXCEPTION 'Payment is not an active captured payment.' USING errcode = '55000';
    END IF;
    UPDATE public.payments SET status = 'paid', provider_payment_id = p_provider_payment_id,
      provider_method = coalesce(nullif(p_provider_method, ''), provider_method),
      paid_at = coalesce(paid_at, now()), updated_at = now()
     WHERE id = p_payment_id RETURNING * INTO v_payment;
  END IF;

  IF v_booking.status::text = 'cancelled' THEN
    v_outcome := 'cancelled';
  ELSE
    IF v_booking.status::text NOT IN (
      'pending','confirmed','finding_washer','support_escalated','washer_assigned',
      'washer_on_the_way','washer_arrived','otp_verified','service_started',
      'service_completed','customer_confirmed','payment_completed','closed'
    ) THEN RAISE EXCEPTION 'Booking cannot be completed for payment.' USING errcode = '55000'; END IF;
    IF abs(v_payment.amount - v_booking.total_amount) > 0.01 THEN
      RAISE EXCEPTION 'Payment amount does not match the booking.' USING errcode = '22023';
    END IF;
    IF v_booking.status::text NOT IN ('customer_confirmed','payment_completed','closed') THEN
      UPDATE public.bookings SET status = 'payment_completed', requires_supervisor = true, updated_at = now()
       WHERE id = v_booking.id RETURNING * INTO v_booking;
    END IF;
    v_outcome := 'completed';
  END IF;
  RETURN jsonb_build_object('success', true, 'outcome', v_outcome,
    'booking_id', v_booking.id, 'status', v_booking.status);
END;
$function$;
REVOKE ALL ON FUNCTION public.complete_booking_payment(uuid,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_booking_payment(uuid,text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.reserve_razorpay_payment_order(p_booking_id uuid,p_customer_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $function$
DECLARE b public.bookings%rowtype; p public.payments%rowtype; made boolean:=false; online boolean;
BEGIN
  SELECT * INTO b FROM public.bookings WHERE id=p_booking_id AND customer_id=p_customer_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found.' USING errcode='P0002'; END IF;
  online:=lower(coalesce(b.payment_method::text,'')) NOT IN ('cod','cash');
  IF b.status::text IN ('cancelled','expired') THEN RAISE EXCEPTION 'This booking is not available for checkout.' USING errcode='55000'; END IF;
  IF online AND b.status::text='pending' AND b.created_at<=now()-interval '30 minutes' THEN RAISE EXCEPTION 'The booking payment window has expired.' USING errcode='55000'; END IF;
  IF (NOT online AND b.status::text NOT IN ('customer_confirmed','closed')) OR
     (online AND b.status::text NOT IN ('pending','confirmed','finding_washer','support_escalated','washer_assigned','washer_on_the_way','washer_arrived','otp_verified','service_started','service_completed','customer_confirmed','payment_completed','closed')) THEN
    RAISE EXCEPTION 'This booking is not eligible for online payment.' USING errcode='55000';
  END IF;
  IF b.total_amount IS NULL OR b.total_amount<=0 THEN RAISE EXCEPTION 'Invalid booking amount.' USING errcode='22023'; END IF;
  UPDATE public.payments SET status='failed',updated_at=now() WHERE booking_id=p_booking_id AND status='created' AND provider_order_id IS NULL AND created_at<=now()-interval '2 minutes';
  SELECT * INTO p FROM public.payments WHERE booking_id=p_booking_id AND status IN ('created','paid') ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.payments(booking_id,customer_id,amount,payment_method,status,provider)
      VALUES(p_booking_id,p_customer_id,b.total_amount,'online','created','razorpay') RETURNING * INTO p;
    made:=true;
  END IF;
  RETURN jsonb_build_object('booking',to_jsonb(b),'payment',to_jsonb(p),'created',made);
END;
$function$;
REVOKE ALL ON FUNCTION public.reserve_razorpay_payment_order(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_razorpay_payment_order(uuid,uuid) TO service_role;

-- Earlier migrations return jsonb; PostgreSQL cannot change a function's
-- return type with CREATE OR REPLACE. Drop the same signature first.
DROP FUNCTION IF EXISTS public.record_cod_payment_once(uuid, uuid);
CREATE FUNCTION public.record_cod_payment_once(
  p_booking_id uuid, p_washer_id uuid
) RETURNS public.payments
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $function$
DECLARE v_booking public.bookings%rowtype; v_payment public.payments%rowtype;
BEGIN
  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND OR v_booking.assigned_washer_id IS DISTINCT FROM p_washer_id THEN
    RAISE EXCEPTION 'Booking is not assigned to this washer.' USING errcode = '42501';
  END IF;
  IF v_booking.payment_method::text NOT IN ('cod','cash') OR v_booking.status::text NOT IN
    ('service_completed','customer_confirmed','payment_completed','closed')
    OR v_booking.service_validated_at IS NULL THEN
    RAISE EXCEPTION 'Booking is not ready for cash payment.' USING errcode = '55000';
  END IF;
  SELECT * INTO v_payment FROM public.payments WHERE booking_id = p_booking_id AND status = 'paid'
    ORDER BY paid_at DESC NULLS LAST LIMIT 1 FOR UPDATE;
  IF FOUND THEN RETURN v_payment; END IF;
  INSERT INTO public.payments(booking_id, customer_id, amount, payment_method, status, provider, paid_at)
  VALUES (p_booking_id, v_booking.customer_id, v_booking.total_amount, 'cod', 'paid', 'cash', now())
  RETURNING * INTO v_payment;
  RETURN v_payment;
END;
$function$;
REVOKE ALL ON FUNCTION public.record_cod_payment_once(uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_cod_payment_once(uuid,uuid) TO service_role;

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

DROP FUNCTION IF EXISTS public.accept_booking_assignment(uuid);
CREATE FUNCTION public.accept_booking_assignment(p_assignment_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $function$
DECLARE uid uuid:=auth.uid(); w public.washers%rowtype; a public.booking_assignments%rowtype; b public.bookings%rowtype;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required.' USING errcode='28000'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=uid AND role='washer' AND is_active=true) THEN RAISE EXCEPTION 'Active washer account required.' USING errcode='42501'; END IF;
  SELECT * INTO w FROM public.washers WHERE user_id=uid AND is_active=true FOR UPDATE;
  IF NOT FOUND OR NOT w.is_verified THEN RAISE EXCEPTION 'Supervisor verification is required before accepting jobs.' USING errcode='42501'; END IF;
  IF w.status::text<>'available' THEN RAISE EXCEPTION 'Go online before accepting a booking.' USING errcode='40001'; END IF;
  SELECT * INTO a FROM public.booking_assignments WHERE id=p_assignment_id;
  IF NOT FOUND OR a.washer_id IS DISTINCT FROM w.id THEN RAISE EXCEPTION 'Assignment not found.' USING errcode='42501'; END IF;
  IF a.status<>'pending' OR a.expires_at<=now() THEN RAISE EXCEPTION 'Assignment is no longer available.' USING errcode='40001'; END IF;
  SELECT * INTO b FROM public.bookings WHERE id=a.booking_id FOR UPDATE;
  IF NOT FOUND OR NOT public.booking_washer_is_eligible(b.id,w.id) THEN RAISE EXCEPTION 'Booking is no longer eligible for this washer.' USING errcode='40001'; END IF;
  SELECT * INTO a FROM public.booking_assignments WHERE id=p_assignment_id FOR UPDATE;
  IF a.status<>'pending' OR a.expires_at<=now() THEN RAISE EXCEPTION 'Assignment is no longer available.' USING errcode='40001'; END IF;
  EXECUTE 'UPDATE public.bookings SET assigned_washer_id=$1, status=CASE WHEN status::text=''payment_completed'' THEN status ELSE ''washer_assigned'' END, requires_supervisor=false, updated_at=now() WHERE id=$2 RETURNING *'
    INTO b USING w.id,b.id;
  UPDATE public.booking_assignments SET status='accepted',responded_at=now() WHERE id=a.id RETURNING * INTO a;
  UPDATE public.booking_assignments SET status='cancelled',responded_at=now(),rejection_reason='Another washer accepted this booking.'
    WHERE booking_id=b.id AND id<>a.id AND status='pending';
  UPDATE public.washers SET status='busy',updated_at=now() WHERE id=w.id;
  RETURN jsonb_build_object('booking',to_jsonb(b),'assignment',to_jsonb(a));
END;
$function$;

CREATE OR REPLACE FUNCTION public.accept_booking_assignment_for_washer(p_assignment_id uuid,p_washer_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $function$
DECLARE uid uuid;
BEGIN
  SELECT user_id INTO uid FROM public.washers WHERE id=p_washer_id AND is_active=true AND is_verified=true;
  IF uid IS NULL THEN RAISE EXCEPTION 'Active verified washer account required.' USING errcode='42501'; END IF;
  RETURN public.accept_booking_assignment_for_user(p_assignment_id,uid);
END;
$function$;

-- Application routes resolve the washer from the authenticated user first.
CREATE OR REPLACE FUNCTION public.accept_booking_assignment_for_user(p_assignment_id uuid,p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $function$
DECLARE w public.washers%rowtype; a public.booking_assignments%rowtype; b public.bookings%rowtype;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_user_id AND role='washer' AND is_active=true) THEN RAISE EXCEPTION 'Active washer account required.' USING errcode='42501'; END IF;
  SELECT * INTO w FROM public.washers WHERE user_id=p_user_id AND is_active=true FOR UPDATE;
  IF NOT FOUND OR NOT w.is_verified THEN RAISE EXCEPTION 'Supervisor verification is required before accepting jobs.' USING errcode='42501'; END IF;
  IF w.status::text<>'available' THEN RAISE EXCEPTION 'Go online before accepting a booking.' USING errcode='40001'; END IF;
  SELECT * INTO a FROM public.booking_assignments WHERE id=p_assignment_id;
  IF NOT FOUND OR a.washer_id IS DISTINCT FROM w.id THEN RAISE EXCEPTION 'Assignment not found.' USING errcode='42501'; END IF;
  IF a.status<>'pending' OR a.expires_at<=now() THEN RAISE EXCEPTION 'Assignment is no longer available.' USING errcode='40001'; END IF;
  SELECT * INTO b FROM public.bookings WHERE id=a.booking_id FOR UPDATE;
  IF NOT FOUND OR NOT public.booking_washer_is_eligible(b.id,w.id) THEN RAISE EXCEPTION 'Booking is no longer eligible for this washer.' USING errcode='40001'; END IF;
  SELECT * INTO a FROM public.booking_assignments WHERE id=p_assignment_id FOR UPDATE;
  IF a.status<>'pending' OR a.expires_at<=now() THEN RAISE EXCEPTION 'Assignment is no longer available.' USING errcode='40001'; END IF;
  EXECUTE 'UPDATE public.bookings SET assigned_washer_id=$1, status=CASE WHEN status::text=''payment_completed'' THEN status ELSE ''washer_assigned'' END, requires_supervisor=false, updated_at=now() WHERE id=$2 RETURNING *'
    INTO b USING w.id,b.id;
  UPDATE public.booking_assignments SET status='accepted',responded_at=now() WHERE id=a.id RETURNING * INTO a;
  UPDATE public.booking_assignments SET status='cancelled',responded_at=now(),rejection_reason='Another washer accepted this booking.' WHERE booking_id=b.id AND id<>a.id AND status='pending';
  UPDATE public.washers SET status='busy',updated_at=now() WHERE id=w.id;
  RETURN jsonb_build_object('booking',to_jsonb(b),'assignment',to_jsonb(a));
END;
$function$;

DROP FUNCTION IF EXISTS public.supervisor_assign_washer(uuid,uuid,uuid);
CREATE FUNCTION public.supervisor_assign_washer(p_booking_id uuid,p_washer_id uuid,p_supervisor_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $function$
DECLARE a public.booking_assignments%rowtype; n integer;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_supervisor_id AND role='supervisor' AND is_active=true) THEN RAISE EXCEPTION 'Active supervisor account required.' USING errcode='42501'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.washers WHERE id=p_washer_id AND supervisor_id=p_supervisor_id) THEN RAISE EXCEPTION 'Washer is not linked to this supervisor.' USING errcode='42501'; END IF;
  PERFORM 1 FROM public.washers WHERE id=p_washer_id FOR UPDATE;
  PERFORM 1 FROM public.bookings WHERE id=p_booking_id FOR UPDATE;
  IF NOT public.booking_washer_is_eligible(p_booking_id,p_washer_id) THEN RAISE EXCEPTION 'Washer is no longer eligible for this booking.' USING errcode='40001'; END IF;
  IF EXISTS(SELECT 1 FROM public.booking_assignments WHERE booking_id=p_booking_id AND status='pending' AND expires_at>now()) THEN RAISE EXCEPTION 'An offer is already waiting for washer acceptance.' USING errcode='40001'; END IF;
  SELECT coalesce(max(attempt_number),0)+1 INTO n FROM public.booking_assignments WHERE booking_id=p_booking_id;
  UPDATE public.booking_assignments SET status='expired',responded_at=now() WHERE booking_id=p_booking_id AND status='pending';
  SELECT * INTO a FROM public.booking_assignments WHERE booking_id=p_booking_id AND washer_id=p_washer_id FOR UPDATE;
  IF FOUND THEN
    UPDATE public.booking_assignments SET status='pending',offered_at=now(),expires_at=now()+interval '2 minutes',responded_at=NULL,rejection_reason=NULL,attempt_number=n WHERE id=a.id RETURNING * INTO a;
  ELSE
    INSERT INTO public.booking_assignments(id,booking_id,washer_id,status,offered_at,expires_at,attempt_number)
    VALUES(gen_random_uuid(),p_booking_id,p_washer_id,'pending',now(),now()+interval '2 minutes',n) RETURNING * INTO a;
  END IF;
  EXECUTE 'UPDATE public.bookings SET status=CASE WHEN status::text=''payment_completed'' THEN status ELSE ''finding_washer'' END, requires_supervisor=false, updated_at=now() WHERE id=$1'
    USING p_booking_id;
  RETURN to_jsonb(a);
END;
$function$;

REVOKE ALL ON FUNCTION public.booking_washer_is_eligible(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.booking_washer_is_eligible(uuid,uuid) TO service_role;
REVOKE ALL ON FUNCTION public.accept_booking_assignment(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.accept_booking_assignment(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.accept_booking_assignment_for_washer(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.accept_booking_assignment_for_washer(uuid,uuid) TO service_role;
REVOKE ALL ON FUNCTION public.accept_booking_assignment_for_user(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.accept_booking_assignment_for_user(uuid,uuid) TO service_role;
REVOKE ALL ON FUNCTION public.supervisor_assign_washer(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.supervisor_assign_washer(uuid,uuid,uuid) TO service_role;

COMMIT;
NOTIFY pgrst,'reload schema';
