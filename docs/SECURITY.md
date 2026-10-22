# Security baseline

The repository now applies API security headers, strict frontend-origin checks, bounded JSON and webhook bodies, per-IP API throttling, and tighter limits on address searches, payment actions, payout changes, and administrative writes. The API does not use cookie authentication; protected requests require a Supabase access token in the `Authorization` header.

## Production deployment

1. Set `NODE_ENV=production`. `npm start` defaults to production; `npm run dev` explicitly uses development mode.
2. Set `FRONTEND_URL` to the exact HTTPS origin of the deployed frontend. Do not include paths or wildcards.
3. Serve the API over HTTPS. If a trusted reverse proxy sits in front of it, set `TRUST_PROXY_HOPS` to the exact number of trusted proxy hops. Leave it at `0` when the API is directly exposed. Never trust a client-controlled forwarding header.
4. Enforce an additional distributed rate limit at the CDN, load balancer, or API gateway when running more than one backend instance. The Express limiter uses in-memory counters per process.
5. Configure the frontend host to send a Content Security Policy, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `frame-ancestors 'none'`. Allow only the required Supabase, Razorpay Checkout, map, and image origins; avoid `unsafe-eval`.
6. Set production Razorpay and Supabase secrets only in the hosting provider's secret manager. Keep `RAZORPAYX_MOCK_ENABLED=false`; simulation is enabled only when `NODE_ENV=development`.
7. Keep `PAYOUT_DATA_ENCRYPTION_KEY` stable, independent, backed up securely, and available only to the backend. Replacing it without decrypting and re-encrypting saved payout destinations makes them unreadable.
8. Keep Supabase service-role/secret keys out of all `VITE_*` variables. Use the publishable/anon key in the browser and enable Row Level Security on every exposed table, with policies for each customer, washer, staff role, and operation. The service-role key bypasses RLS, so backend ownership and role checks remain essential.
9. In Supabase Auth, require verified email where appropriate, configure strong password rules and MFA for staff, and enable CAPTCHA or abuse protection for public sign-up and recovery flows.
10. Keep service-photo storage private. The backend should issue short-lived signed URLs only after checking booking ownership or assignment.
11. Configure the payment provider webhook with the matching server-side webhook secret. Review payout permissions and run a controlled provider test before enabling live transfers.

## Local development

The local payout simulator is deliberately limited to `NODE_ENV=development` and `RAZORPAYX_MOCK_ENABLED=true`. It must never be treated as a real settlement. Keep local `.env` files untracked and do not paste their contents into logs, issues, or chat.

## Verification limits

This repository does not contain the complete production database schema, Supabase project settings, hosting configuration, CDN rules, or provider account settings. Those controls must be checked in the corresponding dashboards before calling a production deployment secure. The in-process limiter is a useful baseline, not a substitute for a shared production rate-limit store or edge protection.
