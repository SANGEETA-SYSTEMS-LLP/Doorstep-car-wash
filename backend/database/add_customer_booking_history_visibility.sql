-- Let customers remove terminal bookings from their own history without
-- deleting payment, service, assignment, or audit records.
BEGIN;
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS customer_hidden_at timestamptz;

CREATE INDEX IF NOT EXISTS bookings_customer_visible_history_idx
  ON public.bookings (customer_id, created_at DESC)
  WHERE customer_hidden_at IS NULL;
COMMIT;

NOTIFY pgrst, 'reload schema';
