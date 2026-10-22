-- Allow washers to save payout instructions before RazorpayX is enabled.
-- The full destination is AES-256-GCM encrypted by the backend; account_label
-- remains masked and fund_account_id is populated only when a provider account
-- has been created and verified.
alter table public.washer_payout_accounts
  alter column fund_account_id drop not null;

alter table public.washer_payout_accounts
  add column if not exists destination_encrypted text;
