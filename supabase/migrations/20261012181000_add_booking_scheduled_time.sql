alter table public.bookings
add column if not exists scheduled_time time without time zone;
