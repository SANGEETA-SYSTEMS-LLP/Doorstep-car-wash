# Local test mode

Start the backend with `cd backend` then `npm run dev`. Start the frontend in another terminal with `cd frontend` then `npm run dev`. Open the Vite localhost URL and sign in.

The test banner links to all implemented role dashboards: customer, washer, supervisor, admin, support, and accountant. Their sidebar links open the remaining pages. Detail pages require a real booking ID; use the booking lists to open them.

The development backend accepts every HTTP method across role boundaries for authenticated users with a profile, on loopback connections only. It binds to 127.0.0.1 in test mode. Production and normal backend startup retain role restrictions.

This enables role access; it does not invent records or bypass booking ownership, database RLS/RPC checks, required washer profiles, OTPs, payment validation, or workflow prerequisites. Use the appropriate test accounts and assigned bookings for those flows. Actions write to the configured database and payments use the configured provider: use a test database and test payment credentials.

To disable backend test access, stop it and run `npm start` with TEST_MODE unset or false. Frontend production builds always enforce roles.

Refund and payout actions require an actual finance role even on localhost. See [booking and finance setup](docs/BOOKING_FINANCE_SETUP.md) for new migrations, provider configuration and test coverage.
