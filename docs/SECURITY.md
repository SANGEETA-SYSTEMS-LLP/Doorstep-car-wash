# Security baseline

The repository now applies API security headers, strict frontend-origin checks, bounded JSON and webhook bodies, per-IP API throttling, and tighter limits on address searches, payment actions, payout changes, administrative writes, and page-view events. Backend logs each request's method, sanitized path, status, duration, request ID, and authenticated actor role when available. SPA route views are sent to a backend event endpoint; request bodies, query strings, tokens, and IP addresses are not logged. The API does not use cookie authentication; protected requests require a Supabase access token in the `Authorization` header.

## Production deployment

1. Set `NODE_ENV=production`. `npm start` defaults to production; `npm run dev` explicitly uses development mode.
2. Set `FRONTEND_URL` to the exact HTTPS origin of the deployed frontend. Do not include paths or wildcards.
3. Serve the API over HTTPS. If a trusted reverse proxy sits in front of it, set `TRUST_PROXY_HOPS` to the exact number of trusted proxy hops. Leave it at `0` when the API is directly exposed. Never trust a client-controlled forwarding header.
4. Enforce an additional distributed rate limit at the CDN, load balancer, or API gateway when running more than one backend instance. The Express limiter uses in-memory counters per process.
5. The frontend host and API now send a baseline Content Security Policy for the configured Supabase project domains, Razorpay Checkout, Google Maps, Google Fonts, and OpenStreetMap tiles/geocoding. Verify actual browser console reports on production and remove any origin or inline allowance that the app does not need. The policy intentionally does not allow `unsafe-eval`.
6. Set production Razorpay and Supabase secrets only in the hosting provider's secret manager. Keep `RAZORPAYX_MOCK_ENABLED=false`; simulation is enabled only when `NODE_ENV=development`.
7. Keep `PAYOUT_DATA_ENCRYPTION_KEY` stable, independent, backed up securely, and available only to the backend. Replacing it without decrypting and re-encrypting saved payout destinations makes them unreadable.
8. Keep Supabase service-role/secret keys out of all `VITE_*` variables. Use the publishable/anon key in the browser and enable Row Level Security on every exposed table, with policies for each customer, washer, staff role, and operation. The service-role key bypasses RLS, so backend ownership and role checks remain essential.
9. In Supabase Auth, require verified email where appropriate, configure strong password rules and MFA for staff, and enable CAPTCHA or abuse protection for public sign-up and recovery flows. The browser client also throttles direct Auth requests to 20 attempts per 15 minutes per browser profile; this is an additional UX guard and can be reset by clearing browser storage, so Supabase Auth controls remain required.
10. Keep service-photo storage private. The backend should issue short-lived signed URLs only after checking booking ownership or assignment.
11. Configure the payment provider webhook with the matching server-side webhook secret. Review payout permissions and run a controlled provider test before enabling live transfers.

## Local development

The local payout simulator is deliberately limited to `NODE_ENV=development` and `RAZORPAYX_MOCK_ENABLED=true`. It must never be treated as a real settlement. Keep local `.env` files untracked and do not paste their contents into logs, issues, or chat.

Browser state: Supabase JS persists the authentication session so users stay signed in; the API reads the access token from that SDK session and sends it as a bearer token. Do not copy tokens into additional `localStorage` keys or logs. Washer job snapshots are memory-only because they can contain customer contact and address details; the app clears legacy persisted washer snapshots on startup. Booking drafts in `carWashBooking` contain booking details but no auth tokens; clear this key on shared/public devices.

Production startup rejects common placeholder Supabase service-role and Razorpay test/example secrets. Keep the real credentials in the deployment secret manager and rotate provider keys if they were exposed outside the trusted secret store. Do not treat local ignored `.env` files as a production secret manager.

## Verification limits

This repository does not contain the complete production database schema, Supabase project settings, hosting configuration, CDN rules, or provider account settings. Those controls must be checked in the corresponding dashboards before calling a production deployment secure. The in-process limiter is a useful baseline, not a substitute for a shared production rate-limit store or edge protection. Configure the Vercel firewall/edge rate limits for API and Auth endpoints, set the exact trusted `TRUST_PROXY_HOPS`, and confirm Supabase Auth email, password, MFA and CAPTCHA settings in the live project.
