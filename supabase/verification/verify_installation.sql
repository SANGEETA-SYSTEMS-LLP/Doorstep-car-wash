-- Run after the complete baseline + migration chain. Read-only assertions.
DO $$
DECLARE item text;
BEGIN
 FOREACH item IN ARRAY ARRAY['profiles','customers','customer_addresses','vehicles','services','service_packages','washers','bookings','payments','support_tickets'] LOOP
  IF to_regclass('public.' || item) IS NULL THEN RAISE EXCEPTION 'Missing required table: %',item; END IF;
 END LOOP;
 IF has_table_privilege('authenticated','public.profiles','UPDATE') THEN RAISE EXCEPTION 'Unsafe browser profile update grant'; END IF;
 IF has_table_privilege('authenticated','public.bookings','INSERT') THEN RAISE EXCEPTION 'Unsafe browser booking insert grant'; END IF;
 IF has_table_privilege('authenticated','public.payments','UPDATE') THEN RAISE EXCEPTION 'Unsafe browser payment update grant'; END IF;
 IF pg_get_function_result('public.accept_booking_assignment(uuid)'::regprocedure) <> 'jsonb' THEN RAISE EXCEPTION 'Incorrect assignment RPC return type'; END IF;
 IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid='auth.users'::regclass AND tgname='on_auth_user_created') THEN RAISE EXCEPTION 'Duplicate legacy auth trigger remains'; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid='auth.users'::regclass AND tgname='create_profile_for_new_auth_user' AND tgenabled <> 'D') THEN RAISE EXCEPTION 'Signup provisioning trigger missing'; END IF;
END;
$$;
SELECT 'Required installation checks passed' AS result;
