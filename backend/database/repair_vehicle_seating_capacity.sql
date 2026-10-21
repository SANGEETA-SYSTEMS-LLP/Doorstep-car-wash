-- Add vehicle seating capacity for vehicle-specific package pricing.
-- Existing rows remain nullable so no seat counts are guessed or fabricated.
-- Safe to re-run in the Supabase SQL Editor as database owner.
BEGIN;

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS seating_capacity integer;

DO $block$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conrelid = 'public.vehicles'::regclass
       AND conname = 'vehicles_seating_capacity_range_check'
  ) THEN
    ALTER TABLE public.vehicles
      ADD CONSTRAINT vehicles_seating_capacity_range_check
      CHECK (seating_capacity IS NULL OR seating_capacity BETWEEN 2 AND 20);
  END IF;
END;
$block$;

NOTIFY pgrst, 'reload schema';
COMMIT;
