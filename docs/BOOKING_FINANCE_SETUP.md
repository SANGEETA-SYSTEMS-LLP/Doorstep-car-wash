# Booking, operations and finance — 13 October 2026

## Implemented

- Customer booking creation now uses POST /api/customer/bookings. The server checks customer ownership of the saved vehicle/address, active package and matching vehicle type, service coverage, and a future India-time schedule within 90 days. It reads the package price from the database; supplied browser prices are ignored. The existing INR 20 fee / INR 20 discount pricing behavior is preserved.
- A request UUID lets checkout retry a booking creation without creating a second booking. Online washer assignment requires a paid payment for the booking amount.
- Online verification checks the checkout signature AND fetches Razorpay's captured payment, matching order, amount and INR currency. Captured webhooks use the same validation. Existing unpaid orders are reused; already-paid bookings reject new orders.
- Cash collection uses an atomic database function and a unique active-payment index. Earnings have a unique booking index, and repeated callbacks do not recalculate existing earnings.
- Payment after service is optional: customers can rate or close a confirmed service without recording payment. COD/Razorpay payment can still be recorded while the booking is open.
- /supervisor/operations shows active jobs, unassigned and delayed filters, links to assignment/details, and washer markers refreshed every 15 seconds. Locations older than five minutes are excluded. Lists work without the Google Maps key; map rendering still requires it.
- /admin/finance and /accountant/finance reserve refunds and payouts, display the exact amount for review, submit through the provider, and retain transaction history. Transactions use stable provider idempotency keys. Failed network requests keep their reservation and can be retried with the same key. An unsubmitted draft can be cancelled atomically.
- Refunds support full or partial online refunds after completion/cancellation. A pending payout must be reconciled before refunding. Refunds after a completed payout are platform-funded; no automatic washer clawback is performed.
- Payouts use RazorpayX IMPS to an active bank fund account linked by finance staff. Amounts come from eligible, verified washer earnings, never browser-entered amounts. The provider sends the funds; this is not a manual transfer recording screen.
- /admin/invoices and /accountant/invoices issue immutable service-invoice snapshots after completion. Customers can open their own invoice from booking details. Browser Print supports Save as PDF. These are service invoices, not GST tax invoices; refunds are separate ledger records.
- /admin/reports and /accountant/reports generate bounded India-date reports and CSV exports. They show receipts, processed refunds, processed payouts and net cash movement; this is not an accrual or tax report.

## Apply these NEW migrations

Your previously applied database code remains useful. These files were created after that code and are still required, in this order:

1. supabase/migrations/20261013150000_finance_operations.sql
2. supabase/migrations/20261013151000_require_server_booking_writes.sql
3. supabase/migrations/20261013152000_payment_idempotency.sql

Deploy the updated backend with them. The second migration removes browser writes to bookings, so the matching backend endpoint must be running. The third fails if historical duplicate active payments or earnings exist: reconcile duplicates before adding the unique indexes; do not delete financial records blindly. These migrations were executed against an isolated PostgreSQL-compatible test database, not your hosted database.

## Backend configuration

Customer cancellation is available before service starts. It retains the recorded platform fee and returns the remaining captured online amount through Razorpay. Apply `backend/database/add_customer_booking_cancellation_refunds.sql` before enabling the cancel action. In Razorpay webhook settings, enable `refund.processed` and `refund.failed` in addition to `payment.captured` so the cancellation ledger and customer history receive final refund status.

Set these privately in backend/.env (examples are in backend/.env.example):

- RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET: valid payment-gateway test credentials first.
- RAZORPAY_WEBHOOK_SECRET: matches your payment.captured, refund.processed, and refund.failed webhook configuration at /api/payments/webhook.
- RAZORPAYX_KEY_ID, RAZORPAYX_KEY_SECRET, RAZORPAYX_ACCOUNT_NUMBER: your enabled RazorpayX account and API credentials; gateway keys alone are not sufficient.
- FINANCE_RECONCILIATION_ENABLED=true: every minute, fetches status for up to 50 submitted pending operations and updates earnings on processed/reversed outcomes. Keep one long-running backend/worker active. Unsubmitted or ambiguous requests remain available for explicit retry from the ledger.
- INVOICE_BUSINESS_NAME and INVOICE_BUSINESS_ADDRESS: required before the first invoice is issued.

Restart the backend after changes. Create and verify each beneficiary in RazorpayX, then link its bank fund-account ID to the correct washer from the finance page. This application verifies the provider account exists and is active; staff must verify beneficiary ownership before linking. Provider onboarding, account activation, sufficient balance and network/IP settings must also be ready.

Finance API permissions use the actual accountant/sub_admin/super_admin role even when development cross-role navigation is enabled. A customer test account can view the test navigation, but cannot move funds.

## Accounting boundaries

- COD earnings represent money already collected by the washer and are excluded from automatic bank payouts. Cash commission collection/reconciliation is a separate workflow.
- Earnings on bookings with a nonfailed refund are held out of automatic payouts pending accounting review. Partial-refund allocation/washer clawback rules are not yet implemented.
- The new payout ledger is the source of truth for RazorpayX transfers; it does not fabricate entries in the legacy washer_settlements table.
- A payout reversal releases its reserved earnings. Terminal provider states cannot be overwritten by stale pending responses. Review uncertain transfers with the provider before creating a new request.
- Invoice snapshots are fixed at issuance. Credit notes, GST registration/rate/place-of-supply rules and statutory tax documents are outside this service-invoice implementation.

## Tests and live acceptance

Verified: 51 backend tests (including six finance database checks) and one frontend test pass. Production build passes; lint has 15 warnings and no errors. Production backend dependency audit reports no known vulnerabilities.

Run backend npm test, frontend npm test, npm run build and npm run lint. The finance database suite runs the migration SQL without touching Supabase. Controller tests use mocked provider calls; they do not prove an actual Razorpay transaction.

Live sequence still required after configuration:

1. With customer, washer, supervisor and finance test accounts, create a covered future booking. Confirm wrong vehicles/addresses and browser price tampering are rejected.
2. Complete Razorpay test checkout; test dismissal/retry and verify only one active payment/order is recorded. Test a duplicate captured webhook.
3. Accept the job as the assigned washer, view live location, arrive, verify OTP, upload required before/after photos, and complete/validate service. Confirm one earning is created.
4. Repeat a COD collection request and verify one payment. Confirm cash earnings are excluded from bank payouts.
5. Create a refund draft, inspect the amount, submit in provider test mode and refresh status. Retry the same request and verify a single provider refund.
6. Link a test RazorpayX fund account, reserve an eligible payout, inspect the exact amount and submit. Confirm pending/processed/reversed outcomes and no duplicate transfers.
7. Issue an invoice; confirm another customer cannot read it and repeated issuance preserves its number/snapshot. Export a report and reconcile it against payment/refund/payout records.

No real charges, refunds or payouts were executed during implementation. The local gateway key was a placeholder/unrecognized format and RazorpayX configuration was missing. A read-only hosted schema check confirmed the existing payment/earning tables and absence of the new finance_operations table.

Provider references: [Razorpay payment APIs](https://github.com/razorpay/markdown-docs/blob/master/api/payments.md), [refund idempotency](https://github.com/razorpay/markdown-docs/blob/master/api/refunds/normal-refunds-idempotent.md), [payout idempotency](https://d6xcmfyh68wv8.cloudfront.net/docs/api/x/payout-idempotency/).
