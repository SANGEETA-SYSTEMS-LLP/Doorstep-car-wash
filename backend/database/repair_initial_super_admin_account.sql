-- Promote the existing Supabase Auth account to the platform super admin.
-- Run in Supabase SQL Editor as database owner. Safe to re-run.
DO $block$
DECLARE
  v_user_id uuid;
  v_updated integer;
BEGIN
  SELECT id
    INTO v_user_id
    FROM auth.users
   WHERE lower(email) = lower('ssadmin@sangeetasystems.com');

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No Supabase Auth user found for ssadmin@sangeetasystems.com.';
  END IF;

  UPDATE public.profiles
     SET role = 'super_admin',
         is_active = true,
         updated_at = now()
   WHERE id = v_user_id;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated <> 1 THEN
    RAISE EXCEPTION 'Expected one profile row for ssadmin@sangeetasystems.com, updated %.', v_updated;
  END IF;
END;
$block$;

NOTIFY pgrst, 'reload schema';

-- Confirm the account role after the update.
SELECT u.email, p.role, p.is_active
  FROM auth.users u
  JOIN public.profiles p ON p.id = u.id
 WHERE lower(u.email) = lower('ssadmin@sangeetasystems.com');
