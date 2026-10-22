# Washer booking experience

Implemented screens: washer dashboard, incoming request cards, My Bookings list, booking detail and navigation contact actions.

Incoming requests and assigned bookings come from authenticated Express endpoints. The backend resolves washers.user_id to washers.id, filters assignments by that record, excludes expired offers and only loads customer details for the resulting bookings. Direct detail URLs require assigned_washer_id to match the signed-in washer record. Inactive/missing washer accounts are rejected.

Washer onboarding flow: complete registration, sign in, open Profile, and save bank or UPI payout details. Supervisor verification is also required before going online. The dashboard keeps incoming assignments hidden and blocks going online until both the saved payout destination and supervisor verification are present. RazorpayX credentials are not needed to save the destination or receive eligible job offers; they are needed later to initiate provider transfers. The supervisor's available-washer list and the database assignment checks also exclude washers without a saved payout destination.

The washer uploads before/after photos and completes the service checklist. Submitting the after photos moves the booking to `service_completed`, which is pending validation. Either the assigned washer or an authorized supervisor can validate the photos; validation moves the booking to `completed` for the customer, washer, and supervisor. The customer can view the uploaded photos and live completion status but cannot bypass staff validation. The lifecycle migration adds missing booking timestamp and validation metadata columns.

Washer offer acceptance and supervisor assignment are implemented as atomic database functions in `backend/database/repair_washer_assignment_acceptance.sql`. The eligibility function also requires a saved payout destination, and rechecks washer identity, active/verified/available state, recent location, service radius and overlapping assigned bookings. On an existing Supabase project, apply `backend/database/add_encrypted_washer_payout_destinations.sql` first if it has not been applied, then re-run the assignment repair SQL after deploying the backend changes; the application code alone cannot update the hosted database function. The current schema evidence does not define washer working-hour columns, so working-hours enforcement remains unimplemented.

Cards show booking number, customer name and reference ID, phone links, vehicle/registration/colour/type, package and duration, schedule, complete address, customer notes, total, payment method/status and offer distance/expiry. They do not include service OTPs or payment provider secrets.

Requests refresh through realtime events with a 10-second polling fallback. My Bookings displays the latest 100 assigned records with All/Active/Completed filters. Availability is saved to the washer record; going online first captures the current location, then continues sending location updates while the dashboard is open. Accepted jobs reload from the backend on detail/navigation URLs.

## Separate IDs

Customer IDs start CUS- and washer IDs start WSH-. The suffix is a stable base-36 encoding of the full account UUID (25 characters). The entire UUID is retained, so no truncation collisions are introduced. These display references are computed, not new database columns; existing records receive them automatically and UUID authorization is unchanged. A customer's ID stays the same across bookings, as does the washer's ID. Each booking retains its separate booking_number and database UUID.

Customer IDs appear in the customer layout and washer booking cards. Washer IDs appear on the washer dashboard/details and customer tracking after assignment. References are not credentials or authorization tokens.

## Verification

Automated tests cover stable IDs, customer enrichment, washer ownership, rejected unauthorized detail lookups, inactive accounts, pending-offer filtering, and role/photo-gated service validation. Frontend build and focused lint pass. Live booking creation/acceptance still requires a test customer, eligible washer with skills/location, and working assignment RPCs. Apply the lifecycle migration before using arrival OTP and service validation. Google Maps rendering requires the configured browser key.
