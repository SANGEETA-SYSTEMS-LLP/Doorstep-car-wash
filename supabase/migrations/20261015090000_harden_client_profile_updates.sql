-- Apply after the supplied base schema. No records are deleted.
-- Profile changes use the authenticated backend; browser clients cannot edit roles.
BEGIN;
CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid() AND is_active = true LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.current_profile_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_profile_role() TO authenticated;
DROP POLICY IF EXISTS support_select_profiles ON public.profiles;
DROP POLICY IF EXISTS admins_select_profiles ON public.profiles;
CREATE POLICY support_select_profiles ON public.profiles FOR SELECT TO authenticated
USING (public.current_profile_role() = 'support');
CREATE POLICY admins_select_profiles ON public.profiles FOR SELECT TO authenticated
USING (public.current_profile_role() IN ('super_admin', 'sub_admin'));
-- RLS checks rows, not which columns a client updates.
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon, authenticated;
REVOKE UPDATE, DELETE ON public.customers FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.washers FROM anon, authenticated;
-- Also remove column-level grants if previously added.
DO $$ DECLARE item record; BEGIN
  FOR item IN SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name IN ('profiles', 'customers', 'washers')
  LOOP
    EXECUTE format('REVOKE UPDATE (%I) ON public.%I FROM anon, authenticated', item.column_name, item.table_name);
    IF item.table_name <> 'customers' THEN
      EXECUTE format('REVOKE INSERT (%I) ON public.%I FROM anon, authenticated', item.column_name, item.table_name);
    END IF;
  END LOOP;
END $$;
COMMIT;


