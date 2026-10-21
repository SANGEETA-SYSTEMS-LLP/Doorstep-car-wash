# Review of supplied SQL files 001–051

Reviewed 15 October 2026 against the pasted SQL and repository. This is not a hosted database inspection. Do not rerun the base scripts over a deployed database: CREATE TABLE IF NOT EXISTS does not reconcile existing columns, and older policies/functions can overwrite newer fixes.

## Fix prepared and tested

20261015090000_harden_client_profile_updates.sql:
- Replaces the recursive profiles read policies from 044/046 with a SECURITY DEFINER role helper.
- The helper ignores inactive staff.
- Removes browser insert/update/delete privileges on profiles and washers, and update/delete on customers, including column-level update grants. Current application profile/availability changes use authenticated backend endpoints.
- Prevents a customer changing their role or a washer self-verifying through the broad own-row policies in 037/040.
- Tested against an isolated PostgreSQL instance with the supplied recursive-policy and broad-grant pattern, including repeat execution and denied updates. Not applied to hosted Supabase.

## Confirmed compatibility gaps

1. File 034 returns UUID from accept_booking_assignment. Repository migration 20261013120000 declares the same signature returning JSONB using CREATE FUNCTION. It cannot be applied unchanged on top of this baseline. An explicit reviewed function replacement and client return-contract migration are required; CREATE OR REPLACE cannot change its return type.
2. File 051 also conflicts with CREATE FUNCTION in that migration. It trusts p_supervisor_id without checking active role inside the function. Its service_role-only execution grant is important and must be retained.
3. File 033 omits geographic distance, skills, working hours and overlap checks. Repeated calls can re-offer the same washer. Do not use this as the production assignment engine.
4. File 034 does not lock the booking before checking its assignment. Different offers can race. Updating expired status then raising an exception rolls that update back. File 035 also needs a conditional atomic update/lock to avoid racing acceptance.
5. File 002 has no completed booking status. Current lifecycle implementation/migration still references that legacy status; reconcile it with service_completed → customer_confirmed → payment_completed → closed. The dashboard/map fixes already avoid querying completed against this enum.
6. payment_method has only online/cod. UPI/card/netbanking/wallet are UI methods; provider payment rows must map them to online (booking preferences may remain text). Do not blindly expand the enum without inspecting consumers.
7. File 039 permits browser-created bookings with client-provided amounts/status. Existing migration 20261013151000 revokes direct booking writes; retain it and use the server pricing endpoint.
8. File 046 grants both admin roles unrestricted direct writes to payment/earnings/settlement tables. This is not configurable RBAC and can bypass ledger workflows. File 045 also permits direct settlement mutation. Replace these with reviewed finance-operation permissions before production.
9. File 043 permits broad extra-charge updates, including amount/status. The controlled supervisor review and atomic customer-decision API must enforce dual approval; direct write privileges need review.
10. File 032 uses auth.uid(); service-role backend updates may produce null changed_by. Explicit actor propagation/audit logging is still required. File 051 can also generate duplicate history entries alongside the trigger.
11. File 031 intentionally creates customer profiles for all public signups. A requested supervisor/washer signup is not an activated staff account. Trusted provisioning must create/link the washer record and assign approved roles.
12. Files 001–051 do not include support_tickets/messages, refunds, invoice snapshots, payout reservation tables, audit logs, admin_permissions, KYC/bank documents or supervisor-zone relationships. Later repository migrations cover only some of these.
13. File 050 lists objects but does not assert required policies, RPC signatures, privileges or concurrency behavior. It is not an end-to-end acceptance test.
14. Booking numbers use LPAD(...,6,'0'); very long sequence values can be truncated. Use a non-truncating formatting expression before that threshold.

## Next implementation gates

- Use the supplied schema as the baseline for an isolated integration database; reconcile all incremental migrations and RPC signatures there first.
- Finish lifecycle and assignment concurrency/working-hour tests using that baseline.
- Implement staff provisioning/configurable RBAC and audit records, then missing support/finance/customer modules listed in REQUIREMENTS_AUDIT_2026-10-15.md.
- Verify migrations and provider sandbox workflows in a dedicated development Supabase project before deployment. No live data or provider transactions were changed during this review.

The application is not fully complete or production-verified by this SQL review.

## Latest attachment reconciliation
The attachment supplied in this session is now split into 51 files under `supabase/baseline`. Removed pasted numeric prefixes/trailing prose and restored the missing closing dollar delimiter in 002. Full baseline + migration execution exposed and fixed text-to-user_role casts in 20261012171000. A forward migration 20261015160000 replaces the corrected provisioning function, removes the duplicate baseline signup trigger and fills missing customer rows. Baseline definitions remain historical; the complete migration chain is required. Earlier compatibility findings above describe the original review; assignment return-contract and hardening replacements are now validated by the full-chain test. Remaining concurrency/provider/application gaps are not resolved merely by a successful schema install.
