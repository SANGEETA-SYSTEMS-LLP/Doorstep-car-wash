alter table public.bookings
add column if not exists payment_method text;
