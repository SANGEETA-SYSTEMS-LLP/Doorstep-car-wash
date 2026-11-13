-- Allow finance staff to configure the real seller details required on new
-- service invoices without changing or redeploying backend environment values.
create table if not exists public.invoice_seller_settings (
  id boolean primary key default true check (id),
  business_name text not null check (length(trim(business_name)) between 2 and 120),
  business_address text not null check (length(trim(business_address)) between 10 and 500),
  updated_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table public.invoice_seller_settings enable row level security;
revoke all on public.invoice_seller_settings from public, anon, authenticated;
grant all on public.invoice_seller_settings to service_role;
