# Washer booking experience

Implemented screens: washer dashboard, incoming request cards, My Bookings list, booking detail and navigation contact actions.

Incoming requests and assigned bookings come from authenticated Express endpoints. The backend resolves washers.user_id to washers.id, filters assignments by that record, excludes expired offers and only loads customer details for the resulting bookings. Direct detail URLs require assigned_washer_id to match the signed-in washer record. Inactive/missing washer accounts are rejected even in local role-test mode.

After a customer pays and schedules a booking, the washer receives an offer and the supervisor can accept by assigning an eligible washer. A washer can also accept their own offer. Both paths assign the booking through the existing assignment flow; arrival OTP verification is still required before service can start.

The washer uploads before/after photos and completes the service checklist. Submitting the after photos moves the booking to `service_completed`, which is pending validation. Either the assigned washer or an authorized supervisor can validate the photos; validation moves the booking to `completed` for the customer, washer, and supervisor. The customer can view the uploaded photos and live completion status but cannot bypass staff validation. The lifecycle migration adds missing booking timestamp and validation metadata columns.

Washer offer acceptance and supervisor assignment are implemented as atomic database functions in `supabase/migrations/20261013120000_add_atomic_booking_assignment_rpcs.sql`. The functions recheck washer identity, active/available state, recent location, skill, service radius and overlapping assigned bookings under serialized database locks. Apply and verify the lifecycle and assignment migrations in the intended Supabase project before enabling this flow. The current schema evidence does not define washer working-hour columns, so working-hours enforcement remains unimplemented.

Cards show booking number, customer name and reference ID, phone links, vehicle/registration/colour/type, package and duration, schedule, complete address, customer notes, total, payment method/status and offer distance/expiry. They do not include service OTPs or payment provider secrets.

Requests refresh through realtime events with a 10-second polling fallback. My Bookings displays the latest 100 assigned records with All/Active/Completed filters. Availability is saved to the washer record; going online first captures the current location, then continues sending location updates while the dashboard is open. Accepted jobs reload from the backend on detail/navigation URLs.

## Separate IDs

Customer IDs start CUS- and washer IDs start WSH-. The suffix is a stable base-36 encoding of the full account UUID (25 characters). The entire UUID is retained, so no truncation collisions are introduced. These display references are computed, not new database columns; existing records receive them automatically and UUID authorization is unchanged. A customer's ID stays the same across bookings, as does the washer's ID. Each booking retains its separate booking_number and database UUID.

Customer IDs appear in the customer layout and washer booking cards. Washer IDs appear on the washer dashboard/details and customer tracking after assignment. References are not credentials or authorization tokens.

## Verification

Automated tests cover stable IDs, customer enrichment, washer ownership, rejected unauthorized detail lookups, inactive accounts, pending-offer filtering, and role/photo-gated service validation. Frontend build and focused lint pass. Live booking creation/acceptance still requires a test customer, eligible washer with skills/location, and working assignment RPCs. Apply the lifecycle migration before using arrival OTP and service validation. Google Maps rendering requires the configured browser key.
