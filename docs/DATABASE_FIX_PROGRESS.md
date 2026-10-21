# Database fix progress — 15 October 2026

## Implemented locally

- Profile privilege and recursive policy fix: 20261015090000.
- Direct client financial/workflow mutations restricted, legacy finder disabled, non-truncating booking numbers: 20261015100000.
- Legacy UUID accept RPC explicitly replaced transactionally by JSONB contract; inactive/missing supervisor fails closed; verified washer required: corrected 20261013120000 plus forward migration 20261015110000 for existing deployments.
- Backend reject update is conditional on pending status; a concurrent acceptance cannot be overwritten.

Tests: assignment legacy replacement/repeat execution/grants; profile recursion/self-promotion; direct finance writes; booking numbers above six digits. Five focused tests passed, including existing assignment-schema regressions.

## Deployment

Not applied to hosted Supabase. The forward assignment migration needs booking lifecycle/coordinate migrations already present. Do not rerun base SQL afterward: it can restore old functions and permissions. No CASCADE drop is used; unexpected dependencies should stop deployment for review.

## Still open; not claimed fixed

- Full booking lifecycle reconciliation (completed versus customer confirmation/payment closure).
- Assignment creation concurrency, consistent lock ordering across acceptance/manual assignment/rejection, expiry handling, competing offer cancellation and busy-state updates.
- Working-hours enforcement and operational retry workers.
- Explicit actor audit propagation for backend changes and duplicate history elimination.
- Full baseline/hosted integration validation and rollback testing.
- Missing product modules tracked in REQUIREMENTS_AUDIT_2026-10-15.md, including staff provisioning, configurable RBAC, support messages/timeline, wallet/coupons and tax/reconciliation workflows.

Do not interpret passing isolated tests as full production readiness.

## Follow-up implementation

- Review APIs now resolve customers.id from the signed-in user and use assigned_washer_id directly; removed the nonexistent total_jobs update and bounded review comments.
- Automatic selection and supervisor candidates now require verified washers and a configured shift covering the complete service duration. Missing/disabled shifts are not treated as available. Existing washers need washer_availability records before receiving offers.
- Assignment eligibility RPC enforces the same shift boundary. Acceptance/manual assignment now lock booking, then washer, then offer consistently; successful assignment marks the washer busy and cancels competing pending offers.
- Confirmed bookings are eligible for automatic assignment after supervisor acceptance.
- Local SQL exercise verifies successful manual assignment, busy status, competing cancellation, duplicate rejection and legacy RPC replacement. It is not a multi-connection concurrency stress test.
- Full backend suite: 65 passing tests.

Still not completed: customer confirmation/payment closure lifecycle reconciliation, atomic offer creation/expiry worker, comprehensive actor audit, full role onboarding and remaining product modules. Hosted migrations have not been applied.
