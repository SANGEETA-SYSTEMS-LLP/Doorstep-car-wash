# Security audit — 2026-10-28

## Scope

Reviewed frontend and backend source, route authentication/authorization, ownership checks, logging and limits, payment/refund/payout flows, uploads, maps integrations, SQL migrations/RPCs, static deployment configuration, and dependency manifests. This is a source audit, not a penetration test. The live Supabase project, Vercel settings, production secrets, Razorpay account, and actual database grants/policies are not available from this repository.

`npm audit --omit=dev` completed against the current lockfiles in both `backend` and `frontend`; each reported zero known production dependency vulnerabilities. No application tests were run for this audit.

## Findings that need action

### High — Cancellation can race with payment-order creation

`cancel_customer_booking` locks the booking and checks for an existing `created` payment before deciding whether a refund is due. `createPaymentOrder` reads the booking without locking it, calls Razorpay, and inserts the payment afterward. If cancellation runs between those operations, it can mark the booking cancelled with no payment/refund row, then checkout can still create an order. Payment verification does not reject a cancelled booking before setting its payment to `paid`. This can leave a captured payment attached to a cancelled booking with no cancellation refund record. Serialize checkout and cancellation on the booking row or use one database transaction/state machine, and reject/void/refund late captures.

### Medium — Supervisors can read and modify support tickets across all service areas

The support routes allow supervisors to list every ticket and update any ticket by ID. Ticket creation also treats a supervisor as authorized for every booking. This bypasses the 7 km supervisor service-area boundary used by dispatch endpoints and exposes customer issue descriptions and resolution notes platform-wide. Apply service-area/booking ownership checks to supervisor ticket listing, creation, and updates, or remove supervisor access to those operations.

### Medium — One-use promotional offers can be redeemed concurrently

Booking creation checks previous uses before inserting the new booking. The checked-in SQL adds a unique per-customer constraint only for `FIRSTWASH`; other single-use offer codes have no equivalent uniqueness guarantee. Two concurrent checkouts can both pass the pre-check and receive the same discount. Enforce single-use redemption atomically in SQL for every offer that has that rule.

### Medium — Refund webhook events can move a completed refund back to failed

The refund webhook updates cancellation status for both `refund.processed` and `refund.failed` without checking the current state or provider event ordering. A delayed failure event can overwrite a previously recorded processed refund. Make terminal refund transitions monotonic and reconcile the provider's current refund state before changing a terminal record.

### High — RLS and Supabase API exposure are not established by this repository

Only selected tables have RLS enabled in checked-in migrations. Server queries use a service-role client, which bypasses RLS, and the frontend contains a direct Supabase washer/profile query. If the deployed project exposes tables without RLS, its public publishable key may bypass the API's owner checks. Audit live grants and policies; enable RLS and least-privilege policies on every exposed table. Do not expose the service-role key in frontend variables. A generic RLS migration was not created because the full schema and intended browser access policies are absent; blanket policies could lock out legitimate access or fail to protect relationships correctly.

### High — Several money and booking RPC definitions are missing from the repository

Application code relies on `reserve_finance_operation`, `begin_finance_operation`, `reconcile_finance_operation`, `record_cod_payment_once`, `confirm_customer_service`, and `respond_extra_charge`, but their definitions and grants are not present in checked-in migrations. These functions are called through the service-role client, so their SQL must enforce actor, owner, status-transition, idempotency, and locking rules. Their security cannot be verified from this codebase; add the deployed definitions to version control and audit them against the API checks.

### Medium — Payment order creation can race

`createPaymentOrder` checks for an existing payment, calls Razorpay, and only then inserts a `created` payment. Concurrent requests can both pass the check and create separate provider orders. Added `add_single_active_payment_per_booking.sql` to enforce one `created` or `paid` row per booking, and the handler now returns the winning order after a uniqueness conflict. Apply the migration after reconciling any existing duplicate active payment rows; the database constraint is required to close the race across multiple server instances.

### Medium — Rate limits and authentication-abuse controls depend on deployment settings

API requests are limited to 600 per 15 minutes per observed IP, with lower limits for sensitive routes and page-view events. Counters are process-local and do not coordinate across serverless instances. Browser-side direct Supabase Auth requests now have a local 20-attempt/15-minute throttle, but it can be reset by clearing browser storage and is not a server-side abuse boundary. Configure shared edge limits and Supabase Auth abuse protection. Set `TRUST_PROXY_HOPS` correctly for Vercel or the production proxy; the default is zero and can make per-IP keys inaccurate behind a proxy.

### Medium — MFA and account-strength controls need live Supabase configuration

No application MFA assurance check was found. Configure MFA for privileged roles and enforce the required assurance level if policy requires it. Verify email confirmation, password strength, breached-password checks, CAPTCHA, and account recovery controls in Supabase Auth.

## Issues fixed in source

- Scoped the supervisor roster to the signed-in supervisor's linked washers.
- Scoped the supervisor service-completion feed to linked washers.
- Added a required supervisor service-area address and map pin. Booking, escalation, extra-charge, operations, completion and washer-verification data is filtered to a 7 km radius; booking detail, assignment, acceptance, validation, and review actions check area membership on the backend. Admin and sub-admin operations retain their existing platform-wide access.
- Added a restrictive Vercel CSP and matching API Helmet CSP for current Supabase, Razorpay, Google Maps/Fonts, and OpenStreetMap origins. Review browser CSP reports after deployment and narrow the allowlist if any source is unused.
- Added a browser-side throttle for direct Supabase Auth sign-in, sign-up, recovery, resend, and verification calls. This does not replace server-side Supabase Auth protections or edge rate limits.
- Restricted nearby-washer lookup to customer role; it previously accepted any authenticated role.
- Added duplicate-review rejection and `add_unique_review_per_booking.sql` so concurrent submissions are blocked at the database. Resolve existing duplicate review rows before applying that migration.
- Added backend request and SPA page-view logs with request IDs, sanitized paths, status, duration, and actor details when available. Bodies, query strings, authorization headers, and IP addresses are excluded.
- Correlated error logs with the request ID and sanitized path.
- Added baseline security headers including CSP to Vercel static responses.

## Positive controls observed

- API access tokens are checked by Supabase Auth; role and active status are read server-side.
- Sensitive finance actions and administrator writes have role checks and dedicated limits. Payout destinations are encrypted by the backend.
- Payment verification checks signatures and validates captured provider amount, currency, and order.
- Customer booking/invoice and washer job paths generally apply ownership or assignment filters.
- Service-photo upload limits and signature checks exist; signed photo URLs are short-lived and booking-scoped.
- API Helmet headers, exact-origin CORS, bounded request bodies, production credential checks, and URL-constrained map-provider requests are present.

## Operational follow-up

Apply the security migrations after resolving duplicate-row prerequisites, and apply `backend/database/add_supervisor_service_areas.sql` before using supervisor operations. Then verify the live Supabase RLS/grants, storage bucket policies, Auth settings (MFA, email verification, password strength, CAPTCHA), trusted proxy count, shared rate limits, Vercel CSP in a real browser, and Razorpay webhook/payout configuration. Backend logs currently go to process stdout; configure centralized retention, access controls, and alerting in the hosting platform for durable security monitoring.
