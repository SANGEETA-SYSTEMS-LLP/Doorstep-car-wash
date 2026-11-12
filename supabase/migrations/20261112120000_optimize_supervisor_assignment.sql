BEGIN;

-- Keep supervisor assignment and washer acceptance eligibility lookups bounded
-- as booking and offer history grows on existing installations.
CREATE INDEX IF NOT EXISTS bookings_washer_schedule_conflicts_idx
  ON public.bookings (assigned_washer_id, scheduled_date, scheduled_start_time)
  WHERE assigned_washer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS booking_assignments_pending_booking_expiry_idx
  ON public.booking_assignments (booking_id, expires_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS washer_availability_assignment_lookup_idx
  ON public.washer_availability (washer_id, day_of_week, start_time, end_time)
  WHERE is_available = true;

COMMIT;
NOTIFY pgrst, 'reload schema';
