-- Required by washerJobController and servicePhotoController.
BEGIN;
ALTER TABLE public.booking_service_photos
 ADD COLUMN IF NOT EXISTS washer_id uuid REFERENCES public.washers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_service_photos_washer ON public.booking_service_photos(washer_id);

-- Resolve pgcrypto's installed schema (public or extensions on Supabase).
CREATE OR REPLACE FUNCTION public.hash_service_otp(p_otp text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE crypto_schema text; result text;
BEGIN
 IF p_otp IS NULL OR p_otp !~ '^[0-9]{6}$' THEN RAISE EXCEPTION 'A six-digit OTP is required'; END IF;
 SELECT n.nspname INTO crypto_schema FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace WHERE e.extname='pgcrypto';
 IF crypto_schema IS NULL THEN RAISE EXCEPTION 'pgcrypto extension is required'; END IF;
 EXECUTE format('SELECT %I.crypt($1, %I.gen_salt(''bf'', 10))',crypto_schema,crypto_schema) INTO result USING p_otp;
 RETURN result;
END;
$$;
CREATE OR REPLACE FUNCTION public.verify_service_otp_hash(p_otp text,p_hash text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE crypto_schema text; result boolean;
BEGIN
 IF p_otp IS NULL OR p_otp !~ '^[0-9]{6}$' OR p_hash IS NULL OR length(p_hash) <> 60 THEN RETURN false; END IF;
 SELECT n.nspname INTO crypto_schema FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace WHERE e.extname='pgcrypto';
 IF crypto_schema IS NULL THEN RAISE EXCEPTION 'pgcrypto extension is required'; END IF;
 EXECUTE format('SELECT %I.crypt($1,$2) = $2',crypto_schema) INTO result USING p_otp,p_hash;
 RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.hash_service_otp(text),public.verify_service_otp_hash(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.hash_service_otp(text),public.verify_service_otp_hash(text,text) TO service_role;

-- Supabase manages storage.buckets. Private uploads and signed URLs use backend service_role.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES ('service-photos','service-photos',false,10485760,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT(id) DO UPDATE SET public=false,file_size_limit=EXCLUDED.file_size_limit,allowed_mime_types=EXCLUDED.allowed_mime_types;
COMMIT;


