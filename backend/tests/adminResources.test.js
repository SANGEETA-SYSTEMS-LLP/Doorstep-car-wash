import test from "node:test";
import assert from "node:assert/strict";
import { resources, validateResourceInput } from "../src/config/adminResources.js";
test("catalogue writes reject unknown fields and financial mutations", () => {
  assert.throws(() => validateResourceInput(resources.societies, { role: "super_admin" }, true), { status: 400 });
  assert.throws(() => validateResourceInput(resources.payments, { amount: 1 }), { status: 405 });
  assert.throws(() => validateResourceInput(resources.societies, {}, true), { status: 400 });
});
test("coverage coordinates and radius are validated before database writes", () => {
  const input = { name: "North zone", latitude: 17, longitude: 78, radius_km: 3, is_active: true };
  assert.deepEqual(validateResourceInput(resources.zones, input), input);
  for (const [key, value] of [["latitude", 91], ["longitude", -181], ["radius_km", 0], ["latitude", "17"], ["is_active", "true"]]) assert.throws(() => validateResourceInput(resources.zones, { ...input, [key]: value }), { status: 400 });
});
test("pricing rejects invalid values and preserves explicit deactivation", () => {
  assert.throws(() => validateResourceInput(resources.packages, { price: -1 }, true), { status: 400 });
  assert.throws(() => validateResourceInput(resources.packages, { duration_minutes: 1.5 }, true), { status: 400 });
  assert.throws(() => validateResourceInput(resources.packages, { washer_commission_percent: 101 }, true), { status: 400 });
  assert.deepEqual(validateResourceInput(resources.services, { is_active: false }, true), { is_active: false });
});
