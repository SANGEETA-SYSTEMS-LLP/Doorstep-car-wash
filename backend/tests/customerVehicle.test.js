import { test, mock } from "node:test";
import assert from "node:assert/strict";
let calls, results;
mock.module("../src/config/supabase.js", { namedExports: { supabaseAdmin: { from(table) {
  const call = { table, steps: [] }; calls.push(call);
  const result = results.shift();
  const query = { then: resolve => Promise.resolve(result).then(resolve) };
  for (const name of ["select", "eq", "maybeSingle", "single", "insert", "delete"]) {
    query[name] = (...args) => { call.steps.push([name, ...args]); return query; };
  }
  return query;
} } } });
const { createCustomerVehicle: create, deleteCustomerVehicle: remove } = await import("../src/controllers/customerVehicleController.js");
const id = "11111111-1111-4111-8111-111111111111";
const body = { vehicle_number: " od 02 ab 1234 ", vehicle_type: " Pickup truck ", brand: "TATA", model: "Test", colour: "black", seating_capacity: 7 };
async function run(handler, input = body, fixtures = [{ data: { id: "owned-customer" } }, { data: { id } }]) {
  calls = []; results = [...fixtures];
  let response, error, status;
  await handler({ user: { id: "verified-user" }, body: input, params: { id } }, {
    status(value) { status = value; return this; }, json(value) { response = value; },
  }, value => { error = value; });
  return { response, error, status };
}
test("vehicle creation supports custom types and derives ownership from the session", async () => {
  assert.equal((await run(create)).status, 201);
  assert.ok(calls[0].steps.some(s => s[0] === "eq" && s[1] === "user_id" && s[2] === "verified-user"));
  const values = calls[1].steps.find(s => s[0] === "insert")[1];
  assert.equal(values.customer_id, "owned-customer");
  assert.equal(values.vehicle_type, "Pickup truck");
  assert.equal(values.vehicle_number, "OD 02 AB 1234");
  assert.equal(values.seating_capacity, 7);
  assert.ok(calls[1].steps.some(s => s[0] === "select" && s[1].includes("seating_capacity")));
});
test("vehicle creation accepts legacy camel-case form payloads without trusting client ownership", async () => {
  const legacy = { vehicleNumber: body.vehicle_number, vehicleType: "other", customVehicleType: "Pickup truck", brand: body.brand, model: body.model, colour: body.colour, seatingCapacity: 7, customer_id: "another-customer" };
  assert.equal((await run(create, legacy)).status, 201);
  const values = calls[1].steps.find(s => s[0] === "insert")[1];
  assert.equal(values.customer_id, "owned-customer");
  assert.equal(values.vehicle_type, "Pickup truck");
  assert.equal(values.seating_capacity, 7);
});
test("vehicle creation rejects unsupported and invalid fields", async () => {
  for (const input of [{ ...body, is_default: true }, { ...body, vehicle_type: " " }, { ...body, vehicle_type: "x".repeat(51) }, { ...body, brand: null }, { ...body, seating_capacity: 1 }, { ...body, seating_capacity: 5.5 }]) {
    assert.equal((await run(create, input)).error.status, 400);
    assert.equal(calls.length, 0);
  }
});
test("vehicle deletion is scoped to the owner and reports missing vehicles", async () => {
  assert.equal((await run(remove)).error, undefined);
  assert.ok(calls[1].steps.some(s => s[0] === "eq" && s[1] === "customer_id" && s[2] === "owned-customer"));
  assert.equal((await run(remove, body, [{ data: { id: "owner" } }, { data: null }])).error.status, 404);
});
test("duplicates and vehicles linked to bookings return useful conflict errors", async () => {
  assert.equal((await run(create, body, [{ data: { id: "owner" } }, { error: { code: "23505" } }])).error.status, 409);
  assert.equal((await run(remove, body, [{ data: { id: "owner" } }, { error: { code: "23503" } }])).error.status, 409);
});
