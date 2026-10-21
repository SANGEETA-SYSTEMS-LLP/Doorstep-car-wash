# OpenStreetMap setup
Leaflet now powers ServiceMap for customer, washer and supervisor screens. Existing coordinate props and click callbacks are preserved. Google keys are no longer read by these components. Browser geolocation needs localhost or HTTPS and user permission.

Basic tiles default to https://tile.openstreetmap.org/{z}/{x}/{y}.png with attribution. Optional frontend variables VITE_MAP_TILE_URL and VITE_MAP_ATTRIBUTION select another provider. Public tiles are best-effort, not an unlimited hosting service: https://operations.osmfoundation.org/policies/tiles/ . Do not prefetch or bulk download tiles.

## Address lookup
Address search defaults to the public Nominatim service at `https://nominatim.openstreetmap.org`; set backend GEOCODING_BASE_URL to override it with a provider you operate or are authorized to use (trailing slash supported). GEOCODING_USER_AGENT should identify your deployment and include a public contact in production. Public Nominatim requires reading and following https://operations.osmfoundation.org/policies/nominatim/ : maximum 1 request/second across the entire application, no autocomplete, no confidential data. This implementation uses explicit search, bounded daily cache and a single-process request gate. Multi-instance production deployments need a shared limiter/cache or their own provider. Flat and customer details are never sent to geocoding.

Customers and washers use the shared explicit address search for public places such as apartments, societies, offices, landmarks and streets. Search results include the place name when the provider returns one; selecting a result puts its coordinates on the map. Private flat and unit details should be entered separately and are not searched or sent to the geocoder.

## Driving routes
Set backend OSRM_BASE_URL to an OSRM-compatible routing service you operate or are authorized to use. Without it, markers still work and route/ETA shows unavailable rather than a fabricated estimate. OSRM estimates are not live traffic ETAs.

Restart backend after configuring providers; restart Vite after frontend variable changes. No database migration is needed. Google keys may be removed manually once other integrations have been checked.
