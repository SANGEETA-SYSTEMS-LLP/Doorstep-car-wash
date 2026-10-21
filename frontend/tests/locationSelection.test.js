import { test } from "node:test";
import assert from "node:assert/strict";
import { pinLocation, resolveLocationSelection, validServiceAddress } from "../src/services/locations/locationSelection.js";
const position = { lat: 20.29, lng: 85.82 };
test("denied geocoding retains exact coordinates and checks coverage", async () => {
  let checked;
  const result = await resolveLocationSelection(position, undefined, {
    lookup: async () => { throw new Error("REQUEST_DENIED"); },
    coverage: async pin => { checked = pin; return { available: true, zone: { name: "Test zone" } }; },
  });
  assert.equal(result.location.latitude, position.lat);
  assert.equal(result.location.longitude, position.lng);
  assert.equal(result.location.address, "");
  assert.equal(checked.latitude, position.lat);
  assert.equal(result.coverage.available, true);
  assert.match(result.notice, /enter the complete service address/);
  assert.equal(validServiceAddress(result.location), false);
  assert.equal(validServiceAddress({ ...result.location, address: "House 12, Test Road, Bhubaneswar" }), true);
});
test("Places and saved addresses skip geocoding but still validate coverage", async () => {
  let lookups = 0;
  const selected = { ...pinLocation(position), address: "House 12, Test Road, Bhubaneswar", addressId: "saved-address" };
  const result = await resolveLocationSelection(position, selected, { lookup: async () => { lookups++; }, coverage: async () => ({ available: false }) });
  assert.equal(lookups, 0); assert.equal(result.location.address, selected.address);
  assert.equal(result.location.addressId, selected.addressId); assert.equal(result.coverage.available, false);
});
test("coverage failures keep the pin but never invent availability", async () => {
  const result = await resolveLocationSelection(position, undefined, { lookup: async () => { throw new Error("denied"); }, coverage: async () => { throw new Error("API unavailable"); } });
  assert.equal(result.coverage, null); assert.equal(result.error, "API unavailable");
  assert.equal(result.location.latitude, position.lat);
});
test("invalid pins and incomplete addresses cannot be confirmed", () => {
  assert.throws(() => pinLocation({ lat: 91, lng: 0 }), /valid point/);
  for (const location of [null, { ...pinLocation(position), address: "Odisha" }, { ...pinLocation(position), address: " ".repeat(20) }, { latitude: null, longitude: 85, address: "A complete street address" }]) assert.equal(validServiceAddress(location), false);
});
