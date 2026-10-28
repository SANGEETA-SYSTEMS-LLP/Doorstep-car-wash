-- Disable the old nearest-washer auto-offer RPC. Supervisors must review the
-- live nearby washer list and explicitly select a washer before an offer exists.
BEGIN;
DROP FUNCTION IF EXISTS public.auto_assign_booking_to_nearest_washer(uuid);
COMMIT;
NOTIFY pgrst, 'reload schema';
