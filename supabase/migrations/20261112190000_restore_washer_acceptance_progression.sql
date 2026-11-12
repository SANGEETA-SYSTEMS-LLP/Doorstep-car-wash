BEGIN;

-- Payment is recorded in payments.status. After a washer accepts the paid
-- offer, move the booking into the first operational step so navigation and
-- the washer progress UI start at Assigned.
CREATE OR REPLACE FUNCTION public.accept_booking_assignment_for_user(
  p_assignment_id uuid,
  p_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  w public.washers%rowtype;
  a public.booking_assignments%rowtype;
  b public.bookings%rowtype;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
     WHERE id = p_user_id AND role = 'washer' AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Active washer account required.' USING errcode = '42501';
  END IF;
  SELECT * INTO w FROM public.washers
   WHERE user_id = p_user_id AND is_active = true FOR UPDATE;
  IF NOT FOUND OR NOT w.is_verified THEN
    RAISE EXCEPTION 'Supervisor verification is required before accepting jobs.' USING errcode = '42501';
  END IF;
  IF w.status::text <> 'available' THEN
    RAISE EXCEPTION 'Go online before accepting a booking.' USING errcode = '40001';
  END IF;

  SELECT * INTO a FROM public.booking_assignments WHERE id = p_assignment_id;
  IF NOT FOUND OR a.washer_id IS DISTINCT FROM w.id THEN
    RAISE EXCEPTION 'Assignment not found.' USING errcode = '42501';
  END IF;
  IF a.status <> 'pending' OR a.expires_at <= now() THEN
    RAISE EXCEPTION 'Assignment is no longer available.' USING errcode = '40001';
  END IF;

  SELECT * INTO b FROM public.bookings WHERE id = a.booking_id FOR UPDATE;
  IF NOT FOUND OR NOT public.booking_washer_is_eligible(b.id, w.id) THEN
    RAISE EXCEPTION 'Booking is no longer eligible for this washer.' USING errcode = '40001';
  END IF;
  SELECT * INTO a FROM public.booking_assignments WHERE id = p_assignment_id FOR UPDATE;
  IF a.status <> 'pending' OR a.expires_at <= now() THEN
    RAISE EXCEPTION 'Assignment is no longer available.' USING errcode = '40001';
  END IF;

  UPDATE public.bookings
     SET assigned_washer_id = w.id,
         status = 'washer_assigned',
         requires_supervisor = false,
         updated_at = now()
   WHERE id = b.id
   RETURNING * INTO b;
  UPDATE public.booking_assignments
     SET status = 'accepted', responded_at = now()
   WHERE id = a.id RETURNING * INTO a;
  UPDATE public.booking_assignments
     SET status = 'cancelled', responded_at = now(),
         rejection_reason = 'Another washer accepted this booking.'
   WHERE booking_id = b.id AND id <> a.id AND status = 'pending';
  UPDATE public.washers SET status = 'busy', updated_at = now() WHERE id = w.id;

  RETURN jsonb_build_object('booking', to_jsonb(b), 'assignment', to_jsonb(a));
END;
$function$;

-- Keep the authenticated RPC on the same acceptance path.
CREATE OR REPLACE FUNCTION public.accept_booking_assignment(p_assignment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING errcode = '28000';
  END IF;
  RETURN public.accept_booking_assignment_for_user(p_assignment_id, uid);
END;
$function$;

-- Repair paid offers that were already accepted while payment_completed was
-- incorrectly retained as the job's operational status.
UPDATE public.bookings b
   SET status = 'washer_assigned', updated_at = now()
 WHERE b.status::text = 'payment_completed'
   AND b.assigned_washer_id IS NOT NULL
   AND b.service_validated_at IS NULL
   AND EXISTS (
     SELECT 1 FROM public.booking_assignments a
      WHERE a.booking_id = b.id AND a.washer_id = b.assigned_washer_id
        AND a.status = 'accepted'
   );

COMMIT;
NOTIFY pgrst, 'reload schema';
