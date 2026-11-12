-- =========================================================
-- FILE: 046_admin_rls.sql
-- MODULE: Security / Admin
-- PURPOSE:
--   Super Admin / Sub Admin management permissions
-- RUN AFTER: All previous RLS files
-- =========================================================


DO $$
DECLARE
    table_name TEXT;
    policy_name TEXT;
BEGIN

    FOREACH table_name IN ARRAY ARRAY[
        'customers',
        'customer_addresses',
        'vehicles',

        'societies',
        'society_towers',
        'service_zones',

        'services',
        'service_packages',
        'service_checklist_items',

        'washers',
        'washer_locations',
        'washer_availability',
        'washer_skills',

        'bookings',
        'booking_assignments',
        'booking_status_history',
        'booking_service_photos',
        'booking_service_checklist',

        'extra_charge_requests',

        'payments',

        'washer_earnings',
        'washer_settlements',

        'reviews',
        'notifications'
    ]
    LOOP

        policy_name :=
            'admins_manage_' || table_name;


        EXECUTE format(
            'DROP POLICY IF EXISTS %I ON public.%I',
            policy_name,
            table_name
        );


        EXECUTE format(
            $policy$

            CREATE POLICY %I
            ON public.%I
            FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1
                    FROM public.profiles p
                    WHERE p.id = auth.uid()
                      AND p.role IN (
                          'super_admin',
                          'sub_admin'
                      )
                      AND p.is_active = TRUE
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1
                    FROM public.profiles p
                    WHERE p.id = auth.uid()
                      AND p.role IN (
                          'super_admin',
                          'sub_admin'
                      )
                      AND p.is_active = TRUE
                )
            )

            $policy$,
            policy_name,
            table_name
        );

    END LOOP;

END;
$$;

DROP POLICY IF EXISTS "admins_select_profiles"
ON public.profiles;

CREATE POLICY "admins_select_profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN (
              'super_admin',
              'sub_admin'
          )
          AND p.is_active = TRUE
    )
);


