-- Backend-mediated financial/workflow updates only; keeps existing SELECT policies.
BEGIN;
DO $$ DECLARE t text; col record; BEGIN
  FOREACH t IN ARRAY ARRAY['bookings','booking_assignments','booking_status_history','payments','washer_earnings','washer_settlements','extra_charge_requests'] LOOP
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE ON public.%I FROM anon, authenticated', t);
    FOR col IN SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=t LOOP
      EXECUTE format('REVOKE INSERT (%I), UPDATE (%I) ON public.%I FROM anon, authenticated', col.column_name, col.column_name, t);
    END LOOP;
  END LOOP;
END $$;
-- Old finder bypasses the server eligibility/payment checks.
REVOKE ALL ON FUNCTION public.find_washer_for_booking(uuid) FROM PUBLIC, anon, authenticated;
-- Sequence formatting must never truncate a booking number after six digits.
CREATE OR REPLACE FUNCTION public.next_booking_number() RETURNS text
LANGUAGE plpgsql SET search_path='' AS $$
DECLARE n text := nextval('public.booking_number_seq')::text;
BEGIN
 RETURN 'CW-' || to_char(now() AT TIME ZONE 'Asia/Kolkata','YYYY') || '-' || lpad(n,greatest(6,length(n)),'0');
END $$;
ALTER TABLE public.bookings ALTER COLUMN booking_number SET DEFAULT public.next_booking_number();
COMMIT;


