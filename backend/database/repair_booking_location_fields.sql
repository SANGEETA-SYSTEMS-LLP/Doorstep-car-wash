-- Run once in the existing project's Supabase SQL Editor as database owner.
-- Adds the booking address snapshot fields required by checkout. No rows are deleted.
BEGIN;
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS flat_number text,
  ADD COLUMN IF NOT EXISTS landmark text;
COMMIT;
NOTIFY pgrst, 'reload schema';

-- All four fields should appear below after applying the repair.
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'bookings'
  AND column_name IN ('latitude', 'longitude', 'flat_number', 'landmark')
ORDER BY column_name;
