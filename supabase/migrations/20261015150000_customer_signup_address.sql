-- Run after base auth.users, customers and customer_addresses tables.
-- Save the optional signup address when the existing signup trigger creates its customer.
BEGIN;
CREATE OR REPLACE FUNCTION public.save_customer_signup_address()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  metadata jsonb;
  address jsonb;
  lat double precision;
  lng double precision;
BEGIN
  SELECT raw_user_meta_data INTO metadata FROM auth.users WHERE id = NEW.user_id;
  IF COALESCE(metadata->>'requested_role', 'customer') <> 'customer' THEN RETURN NEW; END IF;
  address := metadata->'signup_address';
  IF jsonb_typeof(address) IS DISTINCT FROM 'object' THEN RETURN NEW; END IF;
  -- Treat metadata as untrusted: malformed optional data must not break signup.
  IF jsonb_typeof(address->'latitude') IS DISTINCT FROM 'number'
     OR jsonb_typeof(address->'longitude') IS DISTINCT FROM 'number' THEN RETURN NEW; END IF;
  lat := (address->>'latitude')::double precision;
  lng := (address->>'longitude')::double precision;
  IF NOT (lat BETWEEN -90 AND 90 AND lng BETWEEN -180 AND 180)
     OR length(btrim(COALESCE(address->>'address',''))) NOT BETWEEN 10 AND 500
     OR length(btrim(COALESCE(address->>'city',''))) NOT BETWEEN 1 AND 100
     OR length(btrim(COALESCE(address->>'state',''))) NOT BETWEEN 1 AND 100
     OR COALESCE(address->>'postalCode','') !~ '^[0-9]{6}$'
  THEN RETURN NEW; END IF;
  INSERT INTO public.customer_addresses(customer_id, label, address_line, latitude, longitude,
    city, state, postal_code, flat_number, landmark, is_default)
  VALUES (NEW.id, 'Home', btrim(address->>'address'), lat, lng,
    btrim(address->>'city'), btrim(address->>'state'), address->>'postalCode',
    NULLIF(left(btrim(address->>'flatNumber'),100),''),
    NULLIF(left(btrim(address->>'landmark'),200),''),
    NOT EXISTS (SELECT 1 FROM public.customer_addresses WHERE customer_id = NEW.id));
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.save_customer_signup_address() FROM PUBLIC;
DROP TRIGGER IF EXISTS customer_signup_address ON public.customers;
CREATE TRIGGER customer_signup_address AFTER INSERT ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.save_customer_signup_address();
COMMIT;


