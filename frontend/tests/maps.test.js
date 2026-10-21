import { test } from "node:test";
import assert from "node:assert/strict";
import { coordinates, locationFromPlace, reverseGeocode } from "../src/services/locations/maps.js";
test("map coordinates reject missing and out-of-range values without losing zero", () => {
  assert.deepEqual(coordinates({ latitude: 0, longitude: 0 }), { lat: 0, lng: 0 });
  assert.deepEqual(coordinates({ latitude: "17.4", longitude: "78.3" }), { lat: 17.4, lng: 78.3 });
  for (const value of [null, {}, { latitude: null, longitude: 1 }, { latitude: "", longitude: 1 }, { latitude: 91, longitude: 0 }, { latitude: 0, longitude: 181 }]) assert.equal(coordinates(value), null);
});

test("search selections preserve Places address details without requiring a geocoder", () => {
  const location = locationFromPlace({ id: "place-test", formattedAddress: "Test Road, Hyderabad", displayName: "Test Road", location: { toJSON: () => ({ lat: 17.4, lng: 78.3 }) }, addressComponents: [{ types: ["locality"], longText: "Hyderabad" }] });
  assert.equal(location.address, "Test Road, Hyderabad");
  assert.equal(location.city, "Hyderabad");
  assert.equal(location.latitude, 17.4);
  assert.equal(location.placeId, "place-test");
  assert.throws(() => locationFromPlace({}), /complete address/);
});
test("denied reverse geocoding offers search instead of exposing a provider exception", async () => {
  const previous = globalThis.window;
  globalThis.window = { google: { maps: { importLibrary: async () => ({ Geocoder: class { async geocode() { throw new Error("GEOCODER_GEOCODE: REQUEST_DENIED"); } } }) } } };
  try { await assert.rejects(reverseGeocode({ lat: 17.4, lng: 78.3 }), /search suggestions/); }
  finally { if (previous === undefined) delete globalThis.window; else globalThis.window = previous; }
});
