-- Optional customer bank/UPI destination for finance-managed fallback refunds.
-- Full account details are encrypted in the backend and never returned to clients.
create table if not exists public.customer_refund_accounts (
  customer_id uuid primary key references public.customers(id) on delete cascade,
  destination_encrypted text not null,
  account_label text not null,
  updated_at timestamptz not null default now()
);

alter table public.customer_refund_accounts enable row level security;
revoke all on public.customer_refund_accounts from public, anon, authenticated;
grant all on public.customer_refund_accounts to service_role;
