-- Public supervisor signup creates an active supervisor profile immediately.
-- Only the requested supervisor role is accepted from signup metadata; other
-- privileged roles still come from trusted app metadata/admin provisioning.
BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  assigned_role public.user_role;
BEGIN
  assigned_role := CASE
    WHEN new.raw_user_meta_data ->> 'requested_role' = 'supervisor'
      THEN 'supervisor'
    WHEN new.raw_app_meta_data ->> 'role' IN (
      'customer', 'washer', 'supervisor', 'support', 'accountant', 'sub_admin', 'super_admin'
    ) THEN new.raw_app_meta_data ->> 'role'
    ELSE 'customer'
  END::public.user_role;

  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    coalesce(nullif(new.raw_user_meta_data ->> 'phone', ''), ''),
    assigned_role
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.customers(user_id)
  SELECT id FROM public.profiles WHERE id = new.id AND role = 'customer'
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_auth_user() FROM public;

-- Apply the same signup intent rule to accounts created before this migration.
-- This touches only profiles whose stored Auth signup metadata explicitly
-- requested supervisor; all other account roles remain unchanged.
UPDATE public.profiles AS profile
SET role = 'supervisor'::public.user_role,
    updated_at = now()
FROM auth.users AS auth_user
WHERE auth_user.id = profile.id
  AND auth_user.raw_user_meta_data ->> 'requested_role' = 'supervisor'
  AND profile.role = 'customer';

COMMIT;
