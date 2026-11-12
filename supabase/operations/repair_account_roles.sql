-- Repair explicitly listed account roles. Safe to re-run.
-- Run in the Supabase SQL Editor as the database owner.
BEGIN;

DO $block$
DECLARE
  account record;
  user_id uuid;
  updated_rows integer;
  expected_role public.user_role;
  missing_accounts text[] := ARRAY[]::text[];
  missing_profiles text[] := ARRAY[]::text[];
BEGIN
  FOR account IN
    SELECT * FROM (VALUES
      ('pandagayatri413@gmail.com', 'customer'),
      ('ssadmin@sangeetasystems.com', 'super_admin'),
      ('gayatri.panda@sangeetasystems.com', 'supervisor'),
      ('gayatripanda949@gmail.com', 'washer'),
      ('atalari04@gmail.com', 'sub_admin'),
      ('supportsstech@gmail.com', 'accountant')
    ) AS expected(email, role)
  LOOP
    -- profiles.role is the user_role enum; cast the VALUES text before use.
    expected_role := account.role::public.user_role;
    SELECT id INTO user_id FROM auth.users WHERE lower(email) = lower(account.email);
    IF user_id IS NULL THEN
      missing_accounts := array_append(missing_accounts, account.email);
      CONTINUE;
    END IF;

    UPDATE public.profiles
       SET role = expected_role, updated_at = now()
     WHERE id = user_id AND role IS DISTINCT FROM expected_role;
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    IF updated_rows = 0 AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
      missing_profiles := array_append(missing_profiles, account.email);
    END IF;
  END LOOP;

  IF cardinality(missing_accounts) > 0 THEN
    RAISE NOTICE 'No matching Supabase Auth user; skipped: %', array_to_string(missing_accounts, ', ');
  END IF;
  IF cardinality(missing_profiles) > 0 THEN
    RAISE NOTICE 'Auth user exists but profile row is missing; skipped: %', array_to_string(missing_profiles, ', ');
  END IF;
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
   lower('atalari04@gmail.com'),
   lower('supportsstech@gmail.com')
 )
 ORDER BY lower(u.email);

-- List configured accounts that do not exist in Supabase Auth. Create them
-- through the normal Auth signup/admin flow, then rerun this repair if needed.
SELECT expected.email, expected.role AS expected_role
  FROM (VALUES
    ('pandagayatri413@gmail.com', 'customer'),
    ('ssadmin@sangeetasystems.com', 'super_admin'),
    ('gayatri.panda@sangeetasystems.com', 'supervisor'),
    ('gayatripanda949@gmail.com', 'washer'),
    ('atalari04@gmail.com', 'sub_admin'),
    ('supportsstech@gmail.com', 'accountant')
  ) AS expected(email, role)
  LEFT JOIN auth.users u ON lower(u.email) = lower(expected.email)
 WHERE u.id IS NULL
 ORDER BY lower(expected.email);
