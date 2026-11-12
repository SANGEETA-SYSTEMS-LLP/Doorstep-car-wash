-- =========================================================
-- FILE: 045_accountant_rls.sql
-- MODULE: Security / Accountant
-- PURPOSE: Financial management permissions
-- RUN AFTER: 036_enable_rls.sql
-- =========================================================


-- PAYMENTS

DROP POLICY IF EXISTS "accountants_select_payments"
ON public.payments;

CREATE POLICY "accountants_select_payments"
ON public.payments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN (
              'accountant',
              'sub_admin'
          )
          AND p.is_active = TRUE
    )
);


-- WASHER EARNINGS

DROP POLICY IF EXISTS "accountants_select_earnings"
ON public.washer_earnings;

CREATE POLICY "accountants_select_earnings"
ON public.washer_earnings
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN (
              'accountant',
              'sub_admin'
          )
          AND p.is_active = TRUE
    )
);


-- WASHER SETTLEMENTS

DROP POLICY IF EXISTS "accountants_select_settlements"
ON public.washer_settlements;

CREATE POLICY "accountants_select_settlements"
ON public.washer_settlements
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN (
              'accountant',
              'sub_admin'
          )
          AND p.is_active = TRUE
    )
);


DROP POLICY IF EXISTS "accountants_create_settlements"
ON public.washer_settlements;

CREATE POLICY "accountants_create_settlements"
ON public.washer_settlements
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN (
              'accountant',
              'sub_admin'
          )
          AND p.is_active = TRUE
    )

    AND processed_by = auth.uid()
);


DROP POLICY IF EXISTS "accountants_update_settlements"
ON public.washer_settlements;

CREATE POLICY "accountants_update_settlements"
ON public.washer_settlements
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN (
              'accountant',
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
              'accountant',
              'sub_admin'
          )
          AND p.is_active = TRUE
    )
);


