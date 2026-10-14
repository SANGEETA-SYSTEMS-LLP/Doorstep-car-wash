alter table public.service_packages
add column if not exists washer_commission_percent numeric(5,2)
not null default 70;
