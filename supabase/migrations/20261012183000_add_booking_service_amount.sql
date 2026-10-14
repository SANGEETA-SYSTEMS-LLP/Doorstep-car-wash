alter table public.bookings
  add column if not exists service_amount numeric(10, 2) not null default 0,
  add column if not exists discount_amount numeric(10, 2) not null default 0,
  add column if not exists total_amount numeric(10, 2) not null default 0;
