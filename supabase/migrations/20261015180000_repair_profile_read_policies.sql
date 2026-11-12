-- Repair stale/recursive profile read policies after older baseline scripts were replayed.
-- Apply as the database owner in Supabase SQL Editor. No user records are modified.
BEGIN;
CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT p.role::text FROM public.profiles p
 WHERE p.id = (SELECT auth.uid()) AND p.is_active = true LIMIT 1;
$$;
-- Ensure the helper is owned by the table owner so its read does not recurse through RLS.
DO $$
DECLARE owner_name text; policy record;
BEGIN
 SELECT pg_get_userbyid(relowner) INTO owner_name FROM pg_class WHERE oid='public.profiles'::regclass;
 EXECUTE format('ALTER FUNCTION public.current_profile_role() OWNER TO %I',owner_name);
 FOR policy IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND cmd IN ('SELECT','ALL') LOOP
  EXECUTE format('DROP POLICY %I ON public.profiles',policy.policyname);
 END LOOP;
END;
$$;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles NO FORCE ROW LEVEL SECURITY;
REVOKE ALL ON FUNCTION public.current_profile_role() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.current_profile_role() TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.profiles FROM anon,authenticated;
DO $$ DECLARE c record; BEGIN
 FOR c IN SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' LOOP
  EXECUTE format('REVOKE INSERT (%I), UPDATE (%I) ON public.profiles FROM anon, authenticated',c.column_name,c.column_name);
 END LOOP;
END $$;
CREATE POLICY profiles_read_authorized ON public.profiles FOR SELECT TO authenticated
USING (id=(SELECT auth.uid()) OR (SELECT public.current_profile_role()) IN ('super_admin','sub_admin','support','supervisor'));
COMMIT;
NOTIFY pgrst, 'reload schema';


