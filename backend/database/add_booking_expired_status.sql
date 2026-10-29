-- Allow unpaid online bookings to move out of the active booking state after
-- the 30-minute payment window closes. Safe to run more than once.
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'expired';

NOTIFY pgrst, 'reload schema';
