-- Customers may save a complete postal address at signup without selecting a
-- map pin. Coordinates remain optional on saved addresses; checkout still
-- requires a map point to check service coverage and guide the washer.
BEGIN;

ALTER TABLE public.customer_addresses
  ALTER COLUMN latitude DROP NOT NULL,
  ALTER COLUMN longitude DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.save_customer_signup_address()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  metadata jsonb;
  address jsonb;
  lat double precision;
  lng double precision;
BEGIN
  SELECT raw_user_meta_data INTO metadata
  FROM auth.users
  WHERE id = NEW.user_id;

  IF coalesce(metadata->>'requested_role', 'customer') <> 'customer' THEN
    RETURN NEW;
  END IF;

  address := metadata->'signup_address';
  IF jsonb_typeof(address) IS DISTINCT FROM 'object' THEN
    RETURN NEW;
  END IF;

  -- Validate the postal address independently of optional map coordinates.
  IF length(btrim(coalesce(address->>'address', ''))) NOT BETWEEN 10 AND 500
     OR length(btrim(coalesce(address->>'city', ''))) NOT BETWEEN 1 AND 100
     OR length(btrim(coalesce(address->>'state', ''))) NOT BETWEEN 1 AND 100
     OR coalesce(address->>'postalCode', '') !~ '^[0-9]{6}$'
  THEN
    RETURN NEW;
  END IF;

  -- Keep coordinates only when both are valid numeric values. Invalid or
  -- absent optional coordinates must not prevent account creation.
  IF jsonb_typeof(address->'latitude') = 'number'
     AND jsonb_typeof(address->'longitude') = 'number' THEN
    lat := (address->>'latitude')::double precision;
    lng := (address->>'longitude')::double precision;
    IF NOT (lat BETWEEN -90 AND 90 AND lng BETWEEN -180 AND 180) THEN
      lat := NULL;
      lng := NULL;
    END IF;
  END IF;

  INSERT INTO public.customer_addresses(
    customer_id, label, address_line, latitude, longitude,
    city, state, postal_code, flat_number, landmark, is_default
  )
  VALUES (
    NEW.id, 'Home', btrim(address->>'address'), lat, lng,
    btrim(address->>'city'), btrim(address->>'state'), address->>'postalCode',
    NULLIF(left(btrim(coalesce(address->>'flatNumber', '')), 100), ''),
    NULLIF(left(btrim(coalesce(address->>'landmark', '')), 200), ''),
    NOT EXISTS (
      SELECT 1 FROM public.customer_addresses WHERE customer_id = NEW.id
    )
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.save_customer_signup_address() FROM PUBLIC;

COMMIT;
