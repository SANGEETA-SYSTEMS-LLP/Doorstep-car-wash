-- Repair the six explicitly identified account roles. Safe to re-run.
-- Run in the Supabase SQL Editor as the database owner.
BEGIN;

DO $block$
DECLARE
  account record;
  user_id uuid;
  updated_rows integer;
  expected_role public.user_role;
BEGIN
  FOR account IN
    SELECT * FROM (VALUES
      ('pandagayatri413@gmail.com', 'customer'),
      ('ssadmin@sangeetasystems.com', 'super_admin'),
      ('gayatri.panda@sangeetasystems.com', 'supervisor'),
      ('gayatripanda949@gmail.com', 'washer'),
      ('supportsstech@gmail.com', 'accountant'),
      ('atalari04@gmail.com', 'sub_admin')
    ) AS expected(email, role)
  LOOP
    -- profiles.role is the user_role enum; cast the VALUES text before use.
    expected_role := account.role::public.user_role;
    SELECT id INTO user_id FROM auth.users WHERE lower(email) = lower(account.email);
    IF user_id IS NULL THEN
      RAISE EXCEPTION 'Supabase Auth account not found for %.', account.email;
    END IF;

    UPDATE public.profiles
       SET role = expected_role, updated_at = now()
     WHERE id = user_id AND role IS DISTINCT FROM expected_role;
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    IF updated_rows = 0 AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
      RAISE EXCEPTION 'Profile row not found for %.', account.email;
    END IF;
  END LOOP;
END;
$block$;

COMMIT;

-- Verify the final role mapping.
SELECT u.email, p.full_name, p.role, p.is_active
  FROM auth.users u
  JOIN public.profiles p ON p.id = u.id
 WHERE lower(u.email) IN (
   lower('pandagayatri413@gmail.com'),
   lower('ssadmin@sangeetasystems.com'),
   lower('gayatri.panda@sangeetasystems.com'),
   lower('gayatripanda949@gmail.com'),
   lower('supportsstech@gmail.com'),
   lower('atalari04@gmail.com')
 )
 ORDER BY lower(u.email);
