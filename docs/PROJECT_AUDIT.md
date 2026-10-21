> Current document comparison: [15 October 2026 requirements audit](./REQUIREMENTS_AUDIT_2026-10-15.md). Older snapshots below include stale route and configuration claims.

> Latest booking/finance implementation and remaining live prerequisites: [BOOKING_FINANCE_SETUP.md](./BOOKING_FINANCE_SETUP.md). This follow-up supersedes older missing-feature notes below for the operations map, finance transaction UI, service invoices and operational reports. New finance migrations are not yet applied to hosted Supabase.

# Project completion audit — 13 October 2026

Status is based on source inspection, a read-only Supabase REST schema inspection, frontend build/lint, and automated tests. A page existing or a successful build is not proof of a working end-to-end flow. The project is NOT production-complete.

## Module status

| Module | Status | Evidence and remaining work |
|---|---|---|
| 1. Project setup | Implemented; configuration validation pending | React/Vite, Express, Supabase clients, API client, routes and auth context exist. Added env examples and setup guide. Keep existing services rather than duplicate clients. |
| 2. Database | Many entities exist; application contracts inconsistent | Live tables include profiles, customers, customer_addresses, vehicles, societies, society_towers, services, service_packages, washers, washer_locations, washer_availability, washer_skills, bookings, booking_assignments, booking_status_history, payments, reviews, extra_charge_requests, washer_earnings, washer_settlements, notifications, service_zones and checklist/photo tables. Local migrations are incremental, not a reproducible baseline. Verify foreign keys, RPCs, policies, triggers, constraints and storage before applying changes. |
| 3. Authentication | Partial | Register/login/logout/session and role guards exist. Password reset/update is wired. Admin, accountant, and staff support consoles have frontend routes. Test email delivery, reset redirects, and profile/customer provisioning. |
| 4. Customer frontend | Partial | Booking flow, vehicles/packages, payment/history and review integrations exist. New map-based selection and address persistence added. Customer name and phone now load from and save to the authenticated profile; email is read-only because email changes require the provider's verification flow. Support creation/history is connected to the staff ticket API; offers remain incomplete. Schedule/pricing/booking creation need authoritative backend validation. |
| 5. Maps | Integration implemented; provider/live verification pending | Replaced decorative maps in location selection, customer home, assignment search, tracking and washer navigation. Added Places search, current location, map selection/reverse geocoding, real markers, Routes distance/ETA, Google navigation link and service-zone coverage. Google key is not configured yet. Supervisor operations map remains missing. |
| 6. Washer system | Partial; live schema migration still required | Dashboard/incoming jobs/accept-reject/navigation/service stages exist. Availability now persists through the backend; the UI still caches state locally. Service OTP/photo/validation columns are covered by an unapplied migration. Authenticated profile editing and paginated washer earnings are implemented; live persistence and some dashboard statistics remain unverified. |
| 7. Booking engine | Partial; atomic acceptance now defined | Candidate selection considers distance, fresh location, skills, radius, schedule conflicts and ranking. New database RPC migration serializes washer acceptance/manual assignment and rechecks key eligibility conditions. Working hours, live schema compatibility and concurrency behavior remain to be verified; automatic offer generation still needs operational validation. |
| 8. Supervisor | Partial | Dashboard/jobs/escalations/manual assignment/extra-charge screens exist. Dashboard now counts pending extra-charge requests from the database. Operations map, washer management, delay detection and broader issue workflows are missing. |
| 9. Admin | Partial; authenticated console is now routed | Admin and accountant Express routers are mounted under `/api/admin` and `/api/accountant`. The frontend now routes admin roles to the dashboard and generic resource pages, and accountants to read-only payment, earning and settlement lists. Existing resource definitions cover customers, washers, supervisors, societies, bookings, services, packages, zones, payments, earnings and settlements. Refunds, coupons, reports, settings and broader admin actions are not implemented. |
| 10. Support/accountant/production | Support ticket MVP implemented; remaining operations incomplete | Added Supabase support-ticket migration, authenticated customer create/list API, role-gated staff triage/update API and customer/staff screens. Accountant has read-only finance listings, but no reconciliation, payout or invoice workflow. Refund execution, notifications, audit logs, production security acceptance and deployment remain unverified. |

## Schema findings and remaining verification

- Booking assignment and washer workspace now use assigned_washer_id and washers.id. Verify remaining lifecycle paths against the live foreign keys.
- bookings.customer_id relates to a customer record in createBooking, while multiple backend actions compare it directly to req.user.id. Resolve customers.id from authenticated user, then enforce ownership.
- Recheck candidate selection and supervisor washer listing against live schema before production use; the audit's earlier `active`, `total_jobs`, `washer_skills.active`, and location timestamp/accuracy findings were not verified against a current schema export in this task.
- booking_assignments has `offered_at`, not `assigned_at`.
- The lifecycle migration adds service OTP, arrival, start, validation and completion metadata, but has not been applied to the live database.
- `accept_booking_assignment` and `supervisor_assign_washer` are now defined in an additive migration. They serialize acceptance, verify role/washer ownership, and recheck active availability, location freshness, skills, radius and booking overlap. The migration has not been applied or validated against the live Supabase schema; working-hours constraints are not represented in current source/schema evidence.
- booking_service_photos uses `photo_url`; lifecycle code now uses that field and signs stored photo paths for display.
- Existing address-less bookings can still show Address unavailable in supervisor lists; new map bookings save address_id.
- backend/src/services/washerJobService.js appears to be a misplaced frontend API wrapper importing a nonexistent ./api. Check usage before removal.
- Extra-charge customer approval and booking-total update now use an authorization-checked atomic RPC defined in `supabase/migrations/20261013130000_make_extra_charge_approval_atomic.sql`; the migration has not been applied or verified against the live schema.

## Completed in this batch

- Mounted the existing authenticated admin and accountant API routers in Express.
- Added role-gated frontend admin dashboard/resource routes and accountant payment/earning/settlement views.
- Added a Supabase-backed support ticket schema, customer booking-ownership checks, staff triage/status/priority/resolution APIs, and customer/support consoles. Migration is checked in but not applied to a live Supabase project.
- Added atomic Supabase RPC definitions for washer offer acceptance and supervisor assignment. They recheck assignment eligibility and serialize washer assignment operations; migration execution and actual table compatibility remain unverified.
- Added an atomic customer extra-charge decision RPC that validates booking/request ownership, locks the request and booking, updates the charge and total together, and prevents duplicate customer decisions. Corrected washer extra-charge ownership to resolve `washers.id`; supervisor dashboard now queries pending requests. Migration execution and live schema compatibility remain unverified.
- Replaced hard-coded customer profile data and the no-op save action with authenticated profile loading and a validated backend update for name and phone. Email is displayed read-only rather than being changed without a verified email-change flow.
- Added supervisor active-job and job-detail realtime refresh for booking changes.
- Read-only schema inspection; no database mutations or migrations applied.
- Real forgot-password request and reset-password page.
- Google Maps shared loader, Places search, reverse geocoding and map markers.
- Service coverage endpoint with validated coordinates and active zone/society lookup.
- Save real customer address and include address_id in new bookings.
- Replace fixed coordinates, decorative map panels and fabricated distance/ETA in integrated screens.
- Correct location read/write fields and include destination coordinates in newly accepted washer jobs.
- Geographic validation and coverage tests; runnable frontend/backend test scripts; environment templates and setup documentation.

## Ordered completion queue

1. Finish live configuration: Google key/APIs, Supabase recovery redirect, test accounts.
2. Export/review actual foreign keys, RPC definitions and RLS. Reconcile customer/washer identity and all schema mismatches above. Prepare reviewed migrations only where truly needed.
3. Move booking creation/pricing/coverage checks to the backend; finish washer profile persistence and verify every role's ownership rules.
4. Repair atomic assignment/acceptance/expiry, working hours and conflict checks; complete OTP/photos/start/finish lifecycle.
5. Run the full customer-to-washer booking and payment scenario against test data.
6. Complete supervisor operations map, washer management, reassignment, delay/issue management and verify the new atomic charge-approval migration.
7. Build seven-role admin/support/accountant modules on verified tables, including societies/zones/service pricing.
8. Complete notifications, settlements/refunds/invoices/reports/audit logs; production RBAC, deployment and acceptance tests.

## Validation and acceptance

Automated in the current worktree: 31 backend tests and 1 frontend test pass; frontend production build passes (large bundle warning). Frontend lint completes with existing warnings; lint does not establish runtime correctness. The admin/accountant/support endpoint mounting and role-gated UI compile, but no authenticated live API request was run.

Live checks still required:
- Register creates usable profile/customer rows; login/logout and recovery email work.
- Search an address, allow/deny geolocation, select a map point, verify covered/uncovered areas and persist the correct address/coordinates.
- Create a booking with authoritative price, successful test payment or cash flow, and correct ownership.
- Washer goes online, shares a location, receives/accepts an eligible job and recovers it after refresh.
- Customer sees fresh washer markers and real route estimates; navigation targets the actual booking address.
- Arrival, OTP, photos, checklist, completion, customer confirmation and earnings all persist correctly.
- Supervisor resolves escalation by real assignment; extra charges require both approvals exactly once after the new migration is applied and tested against Supabase.
- Cross-role and cross-customer requests are rejected by backend authorization.

No claim of full completion should be made until the queue and live acceptance checks are complete.

## Washer booking follow-up — 13 October 2026

Replaced the washer dashboard, incoming request cards, jobs list and job detail mock data with authenticated workspace/detail APIs. Added stable CUS-/WSH- account references, real contact actions and persisted availability/location updates. Repaired booking-assignment field names (assigned_washer_id, is_active, jobs_completed, updated_at, offered_at, scheduled_start_time), start-assignment customer ownership and start-journey washer ownership. Removed earnings creation from the acceptance client flow. These items supersede the corresponding earlier snapshot findings; other lifecycle/financial gaps remain. See WASHER_BOOKINGS.md for the exact scope and live validation prerequisites.

## Latest integration verification

- Mounted `/api/account` so customer/washer profile editing and washer earnings reach authenticated controllers. Added tests for ownership, rejected role changes and earnings pagination.
- Connected customer support to `/api/support/my` using the existing ticket schema and form components. Removed the unused competing support implementation and its conflicting migration before application.
- Added Admin, Support and Accountant links to local test navigation. Staff console navigation now follows the active route, including cross-role local testing.
- Frontend production build passes; bundle-size warning remains. Lint exits successfully with warnings. These checks do not replace authenticated browser or live database testing.
- Google Maps browser key is still absent from frontend/.env. No live migrations were applied in this task.
