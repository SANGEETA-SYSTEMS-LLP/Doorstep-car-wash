# Input and injection security review

Reviewed on 2026-10-26.

## Findings and changes

- **SSRF: fixed.** `GEOCODING_BASE_URL` and `OSRM_BASE_URL` are the only configurable outbound map provider destinations. They must now be valid HTTPS URLs with no credentials, query, fragment, or nonstandard port. Constructed requests are checked to remain within the configured provider origin and path. The request coordinates and search text are encoded by URL APIs.
- **File uploads: validated.** Service photos are limited to five files, 5 MiB each, JPG/PNG/WebP MIME types, and matching image signatures; unexpected form fields are rejected. Multer errors now return safe 4xx responses rather than surfacing as generic server errors. Uploads require an authenticated washer and an assigned booking.
- **SQL injection: no direct SQL interpolation found in application request paths.** Database access uses Supabase query builder methods (`eq`, `in`, etc.) or fixed RPC names. Input remains subject to endpoint validation; keep SQL migrations and RPC implementations reviewed separately.
- **XSS: no raw HTML rendering sinks found** (`dangerouslySetInnerHTML`, `innerHTML`, `insertAdjacentHTML`) in frontend source. React text rendering escapes strings by default. Continue to validate URL schemes before adding new user-controlled links.
- **CSRF: API uses bearer-token authentication** through Supabase and does not establish an app cookie session. CORS allows configured frontend origins and does not itself replace CSRF controls. If cookie-based auth is introduced, add SameSite cookies and CSRF tokens/origin checks for mutations.

## Scope and limitations

This was a source review, not a penetration test. Database policies, Supabase storage bucket policies, deployed proxy/rate-limit configuration, and third-party provider behavior require separate environment-level verification. Production should set exact HTTPS `FRONTEND_URL` origins, trusted `TRUST_PROXY_HOPS`, and only trusted map provider URLs.
