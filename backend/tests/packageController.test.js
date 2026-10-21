import { test, mock } from "node:test";
import assert from "node:assert/strict";
let calls, fixtures;
mock.module("../src/config/supabase.js", { namedExports: { supabaseAdmin: { from(table) {
  const call = { table, steps: [] }; calls.push(call);
  const result = fixtures.shift();
  const query = { then: resolve => Promise.resolve(result).then(resolve) };
  for (const method of ["select", "eq", "in", "ilike", "order", "limit", "maybeSingle", "single", "update", "insert"]) query[method] = (...args) => { call.steps.push([method, ...args]); return query; };
  return query;
} } } });
const { ensureOneTimeWashPackages, listPackages, validatePackage } = await import("../src/controllers/packageController.js");
const id = "11111111-1111-4111-8111-111111111111";
const pack = { id, vehicle_type: "suv", price: 499, is_active: true };
async function run(handler, results, extra = {}) {
  calls = []; fixtures = [...results]; let response, error;
  await handler({ user: { id: "verified-user" }, query: { vehicleType: "suv" }, body: { packageId: id, vehicleId: id }, ...extra }, { json(value) { response = value; } }, value => { error = value; });
  return { response, error };
}
test("package catalog includes matching category aliases and shared all-vehicle tiers", async () => {
  assert.deepEqual((await run(listPackages, [{ data: [pack] }])).response.packages, [pack]);
  assert.ok(calls[0].steps.some(s => s[0] === "eq" && s[1] === "is_active" && s[2] === true));
  assert.ok(calls[0].steps.some(s => s[0] === "in" && s[1] === "vehicle_type" && s[2].includes("suv") && s[2].includes("all vehicles")));
  assert.deepEqual(calls[0].steps.at(-1), ["order", "price", { ascending: true }]);
  assert.equal((await run(listPackages, [], { query: { vehicleType: ["suv"] } })).error.status, 400);
});
test("package validation scopes the vehicle to the signed-in customer", async () => {
  const result = await run(validatePackage, [{ data: { id: "customer" } }, { data: { vehicle_type: "suv" } }, { data: pack }]);
  assert.equal(result.response.package.price, 499);
  assert.ok(calls[0].steps.some(s => s[0] === "eq" && s[1] === "user_id" && s[2] === "verified-user"));
  assert.ok(calls[1].steps.some(s => s[0] === "eq" && s[1] === "customer_id" && s[2] === "customer"));
  assert.equal((await run(validatePackage, [{ data: { id: "customer" } }, { data: null }])).error.status, 404);
});
test("validation rejects incompatible, inactive or invalid-price packages", async () => {
  for (const data of [null, { ...pack, vehicle_type: "sedan" }, { ...pack, price: 0 }, { ...pack, price: "invalid" }]) {
    const result = await run(validatePackage, [{ data: { id: "customer" } }, { data: { vehicle_type: "suv" } }, { data }]);
    assert.ok(result.error);
    assert.ok(calls[2].steps.some(s => s[0] === "eq" && s[1] === "is_active" && s[2] === true));
  }
});

test("shared one-time wash tiers are valid for luxury vehicles", async () => {
  const shared = { ...pack, vehicle_type: "all vehicles", price: 100 };
  const result = await run(validatePackage, [{ data: { id: "customer" } }, { data: { vehicle_type: "luxury" } }, { data: shared }]);
  assert.equal(result.response.package.vehicle_type, "all vehicles");
  assert.equal(result.response.package.price, 100);
});

test("one-time tiers are provisioned at fixed prices and shared across vehicle types", async () => {
  calls = [];
  fixtures = [
    { data: { id: "customer-1" } },
    { data: { id, vehicle_type: "luxury" } },
    { data: [{ id: "wash-service", name: "Exterior Wash" }] },
    { data: { duration_minutes: 30, washer_commission_percent: 65 } },
    { data: [] },
    { data: { id: "tier-100", name: "Essential Exterior Wash", price: 100, vehicle_type: "all vehicles" } },
    { data: { id: "tier-130", name: "Plus Exterior Wash", price: 130, vehicle_type: "all vehicles" } },
    { data: { id: "tier-150", name: "Premium Exterior Wash", price: 150, vehicle_type: "all vehicles" } },
  ];
  let response, error;
  await ensureOneTimeWashPackages({ user: { id: "verified-user" }, body: { vehicleId: id } }, { json(value) { response = value; } }, value => { error = value; });
  assert.equal(error, undefined);
  assert.deepEqual(response.packages.map(item => item.price), [100, 130, 150]);
  assert.ok(calls.some(call => call.table === "service_packages" && call.steps.some(step => step[0] === "insert" && step[1].vehicle_type === "all vehicles")));
});
