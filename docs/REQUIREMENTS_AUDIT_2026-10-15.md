# Document comparison — 15 October 2026

This audit compares the supplied Customer → Booking → Supervisor → Washer → Service → Payment document with the current implementation. The project is **not yet production-complete**. Tests use mocks/local SQL; passing them is not proof that hosted Supabase, Google Maps or payment providers are configured correctly.

## Verification in this session

- 60 backend tests passed, including ownership checks, authoritative booking pricing, payment verification, assignment, support validation, and local SQL refund/payout reservations.
- 10 frontend tests passed: coordinates/address lookup, package compatibility and India-time scheduling.
- Frontend production build passed; existing large-bundle warning remains.
- Live Supabase schema inspection was declined. No database changes or real payments were made. Previous schema observations must not be treated as current verification.
- Authenticated browser acceptance testing was not performed.

## Changes made in this session

- Added the missing staff Support dashboard: list/filter tickets, inspect complaint details, update status/priority/resolution note, loading/error handling.
- Restored support-role login routing to /support instead of the public home page.
- Added protected /support and /admin/support routes and support navigation.
- Added /admin/operations and links from the Admin/Super Admin management workspace to the existing live operations map.
- Staff support endpoints now return the same actionable unavailable response as customer endpoints when support storage is absent.

## Requirements matrix

| Document section | Current evidence | Still missing or unverified |
| --- | --- | --- |
| Seven roles/auth | Single Supabase auth, role guards, role-specific pages; requested staff role stored at signup | Staff approval/provisioning UI; configurable permissions; live email verification/reset tests |
| Customer | Map/address/vehicle/package/schedule/review/payment/tracking/history/profile flows; validated saved address and package selection | Profile photo, customer wallet ledger, complete offers flow, real end-to-end checkout |
| Washer | Assigned-only job data, accept/reject, navigation, availability, OTP/photo/service code, earnings | Active washer onboarding, protected KYC/bank management, emergency contacts and cancellation metrics; live lifecycle validation |
| Societies | Manual society/zone catalogue and automatic geographic lookup | Map-assisted admin creation, Place ID/tower management and supervisor-zone assignment |
| Coverage | All valid locations accepted, optional society metadata | Intentionally retains earlier explicit all-city requirement; does not restore document's restricted-area rejection |
| Supervisor | Request inbox, accept pending booking, assignment, map, delays, escalations, extra-charge approvals | Supervisor ownership/area scoping, reassignment of already active jobs, cancellation views, modify-charge workflow; concurrency/live validation |
| Support | Customer create/history and staff triage UI/API now connected | Booking timeline, messages/photos, staff assignment, escalated status and detailed complaint categories; migration readiness |
| Accountant | Payments/earnings/settlements, refund and automatic RazorpayX payout code, invoices/reports | Real provider credentials/webhooks and sandbox verification; GST/tax configuration, supervisor settlements, COD reconciliation, discount accounting |
| Sub Admin | Existing role-based administration | Configurable per-module permissions; current backend allows both admin roles on shared catalogue routes |
| Super Admin | Management/finance hub and direct operations/support links | Role administration, coupons/reviews management, notifications administration, settings and full audit UI |
| Map layers | Shared map components and operational booking/washer markers | Society workload aggregation, documented status colours/layers, live browser/provider checks |
| Assignment | Skills, freshness, radius, distance/rating and overlap checks; atomic RPC definitions | Working-hours enforcement, zone/shift policy, expiry/retry worker operation and deployed RPC verification |
| Status lifecycle | Most stage handlers exist | Reconcile all handlers with documented customer_confirmed → payment_completed → closed sequence; legacy completed status/fields still need migration/contract review |
| Database | Incremental migrations for assignment, support, charges, lifecycle, finance, idempotency and notifications | Verified baseline, deployed migration inventory, RLS/RPC/storage verification, comprehensive audit logging |

## Required completion sequence

1. Confirm a dedicated development database and inspect its schema/RPCs/policies before applying incremental migrations. Earlier live errors showed missing support/invoice tables and lifecycle fields; do not blindly apply SQL to a database shared with production.
2. Reconcile lifecycle state transitions and timestamps with the document and run customer/washer/supervisor acceptance on test accounts.
3. Finish staff provisioning and configurable RBAC, including backend enforcement and immutable audit records.
4. Implement working-hours/assignment expiry and active-job reassignment with atomic ownership/status checks.
5. Finish support booking timelines, messages/attachments and escalation workflow.
6. Add map-assisted society/tower administration and supervisor area relationships while preserving all-city booking access.
7. Complete KYC/banking access controls and staff onboarding.
8. Complete wallet/coupons, finance reconciliation, tax settings, supervisor settlements and operational reports.
9. Run Google Maps and Razorpay/RazorpayX sandbox acceptance; verify webhooks, retry/idempotency, customer confirmation and ledger balances.
10. Production acceptance: cross-role data isolation, RLS, secrets, storage policies, backups, deployment, monitoring and recovery.

No statement that “everything works” is justified until these remaining checks and features are complete.
