-- Store the method actually used in Razorpay Checkout for each payment.
-- Refund routing continues to use payments.provider_payment_id.
BEGIN;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS provider_method text;

COMMIT;
NOTIFY pgrst, 'reload schema';
