-- Roll back add_customer_payment_preferences.sql if it was already applied.
BEGIN;

ALTER TABLE public.customers
  DROP COLUMN IF EXISTS preferred_payment_method;

COMMIT;
NOTIFY pgrst, 'reload schema';
