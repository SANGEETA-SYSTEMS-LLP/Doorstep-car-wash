# Authentication and access review

Reviewed on 2026-10-26. This is a source review; it does not inspect live Supabase Auth settings, deployed rate-limit infrastructure, or production database policies.

## Findings

- **Authentication:** API requests validate bearer tokens with Supabase Auth `getUser`; the app role and active state are read from the server-side `profiles` table. A profile role is not taken from user-editable auth metadata.
- **Broken object access:** Most customer and washer paths reviewed scope records to the authenticated owner/assigned washer. Invoice lookup had read a booking by supplied ID before its ownership check. It now adds the authenticated customer's `customer_id` to the booking query and validates the UUID before lookup.
- **Permissions:** Role middleware is applied at route groups and sensitive finance routes use a narrower role check. Continue auditing every new route for both role and object ownership checks.
- **Rate limiting:** API-wide, public lookup, payment, payout-change, and admin mutation limits exist. A process-local limiter is not shared across server instances, and auth attempts go directly from the browser to Supabase Auth, so the API limiter does not cover sign-in/password-reset attempts. Configure distributed edge/Supabase Auth limits in production.
- **Passwords:** Supabase Auth accepts and stores account passwords; the app does not hash them itself. Signup and reset UI enforce only a minimum of 8 characters; supervisor-created accounts enforce 8–128 characters. Configure Supabase Auth password strength, leaked-password checks, email verification, and breached-password protection in the project settings.
- **MFA:** No app-level MFA enrollment or assurance-level enforcement was found. Enable/configure MFA for privileged roles in Supabase and enforce an adequate `aal` on sensitive API routes if MFA is required by policy.
- **RLS:** The checked-in `backend/database` SQL contains no table-level `ENABLE ROW LEVEL SECURITY` policy migration. The backend uses a service-role Supabase client, which bypasses RLS. Do not expose that key in frontend builds; use API ownership checks for service-role operations and add/test RLS policies for direct browser access. Live project policy state cannot be verified from this repository.

## Change made

Customer invoice lookup now applies ownership in the database query itself, so a guessed booking ID cannot be used to retrieve another customer's invoice. A focused test was added for the owner-scoping branch.
