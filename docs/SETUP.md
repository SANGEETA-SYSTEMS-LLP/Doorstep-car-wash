# Development setup

The existing frontend/services directory is the API layer. Keep using it instead of duplicating the same clients under frontend/api. Layouts currently live in both components/layout and layouts; this is a naming inconsistency, not a missing feature.

## Run locally

Use Node.js 24 or a compatible current runtime. In frontend and backend separately, run npm install. Copy each .env.example to .env only when .env does not already exist. Never overwrite existing credentials. In separate terminals run npm run dev in backend and frontend. Open the Vite localhost URL and sign in.

Backend role authorization is enforced during development and production. Use accounts with the appropriate roles when exercising role-specific APIs and pages.

## Google Maps

In frontend/.env set VITE_GOOGLE_MAPS_API_KEY. Enable billing and Maps JavaScript API, Places API (New), Geocoding API, and Routes API in the Google Cloud project. Restrict the browser key by allowed HTTP referrers and required APIs. Include your localhost development origin and deployed domain. Set VITE_GOOGLE_MAPS_MAP_ID to a map ID you create for production; development falls back to DEMO_MAP_ID. Restart Vite after changing environment values.

The integration uses PlaceAutocompleteElement, reverse geocoding, AdvancedMarkerElement and the Routes library. Do not put a Supabase secret or unrestricted server key in a VITE_ variable. No Google key was provided during implementation, so live provider behavior has not yet been verified.

Coverage is determined from active service_zones circles. A society alone does not enable booking. A zone tied to an inactive society is excluded. Configure real societies/zones before attempting a booking. No sample geography is silently inserted. Address saving requires a customers row for the signed-in account and appropriate customer_addresses RLS policies.

Location access needs HTTPS or localhost and browser permission. Washer tracking reads updated_at and polls every 15 seconds alongside realtime; driving routes refresh every 30 seconds. Existing accepted jobs saved before this change may lack coordinates and must be reloaded from the database as part of the washer workflow repair.

## Password recovery

In Vercel, set the frontend environment variable `VITE_SITE_URL` to the public production origin (for example, `https://doorstep-car-wash-gold.vercel.app`) and redeploy. In Supabase Authentication URL Configuration, set the Site URL to that production origin and add its `/reset-password` URL to the redirect allow list. Keep `http://localhost:5173/reset-password` in the allow list for local development. Recovery requests now explicitly target the configured production URL (with a production fallback); local development continues to use its current origin. Supabase will only honor redirect URLs included in its allow list. Configure production mail delivery and verify with a test account.

## Checks

- frontend: npm test, npm run lint, npm run build
- backend: npm test

Backend tests use Node's experimental module mocking to avoid external services. Passing these checks is not a substitute for completing the live acceptance checklist in PROJECT_AUDIT.md.

## Documentation references

- https://developers.google.com/maps/documentation/javascript/load-maps-js-api
- https://developers.google.com/maps/documentation/javascript/place-autocomplete-new
- https://developers.google.com/maps/documentation/javascript/geocoding
- https://developers.google.com/maps/documentation/javascript/reference/route
- https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail
- https://supabase.com/docs/guides/auth/redirect-urls
