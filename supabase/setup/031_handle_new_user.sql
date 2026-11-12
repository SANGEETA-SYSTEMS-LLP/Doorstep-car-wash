-- =========================================================
-- FILE: 031_handle_new_user.sql
-- MODULE: Authentication
-- PURPOSE:
--   Automatically create profile + customer after signup
-- RUN AFTER:
--   003_profiles.sql
--   004_customers.sql
-- =========================================================


CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_role public.user_role;
BEGIN

    -- -----------------------------------------------------
    -- SECURITY:
    -- Public signup always creates a CUSTOMER.
    --
    -- Do not trust raw_user_meta_data for admin/washer roles.
    -- Washer/Admin/Supervisor roles should be assigned later
    -- by trusted backend/admin logic.
    -- -----------------------------------------------------

    v_role := 'customer';


    INSERT INTO public.profiles (
        id,
        full_name,
        phone,
        role
    )
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data ->> 'full_name',
            ''
        ),
        NEW.raw_user_meta_data ->> 'phone',
        v_role
    )
    ON CONFLICT (id)
    DO NOTHING;


    INSERT INTO public.customers (
        user_id
    )
    VALUES (
        NEW.id
    )
    ON CONFLICT (user_id)
    DO NOTHING;


    RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS on_auth_user_created
ON auth.users;


CREATE TRIGGER on_auth_user_created
AFTER INSERT
ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();


