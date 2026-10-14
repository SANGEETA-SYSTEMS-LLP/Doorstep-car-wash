-- Deploy the matching backend booking endpoint before applying this migration.
-- Prevent clients bypassing server-side pricing and ownership validation.
revoke insert, update, delete on public.bookings from anon, authenticated;
