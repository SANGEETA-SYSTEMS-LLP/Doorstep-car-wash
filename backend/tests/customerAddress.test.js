import { test, mock } from "node:test";
import assert from "node:assert/strict";
let calls, results;
mock.module("../src/config/supabase.js", { namedExports: { supabaseAdmin: { from(table) {
  const call = { table, steps: [] }; calls.push(call);
  const result = results.shift();
  const query = { then: resolve => Promise.resolve(result).then(resolve) };
  for (const name of ["select", "eq", "maybeSingle", "single", "insert", "update", "delete"]) {
    query[name] = (...args) => { call.steps.push([name, ...args]); return query; };
  }
  return query;
} } } });
const { saveAddress, updateAddress, deleteAddress } = await import("../src/controllers/customerAddressController.js");
const id = "11111111-1111-4111-8111-111111111111";
const body = { address_line: "12 Main Street, Test City", latitude: 20.76435, longitude: 86.39586 };
async function run(handler, input = body, fixtures = [{ data: { id: "owned-customer" } }, { data: { id } }]) {
  calls = []; results = [...fixtures];
  let response, error, status;
  await handler({ user: { id: "verified-user" }, body: input, params: { id } }, {
    status(value) { status = value; return this; }, json(value) { response = value; },
  }, value => { error = value; });
  return { response, error, status };
}
test("address creation derives ownership from verified user", async () => {
  const result = await run(saveAddress);
  assert.equal(result.status, 201);
  assert.deepEqual(result.response, { id });
  assert.ok(calls[0].steps.some(s => s[0] === "eq" && s[1] === "user_id" && s[2] === "verified-user"));
  assert.equal(calls[1].steps.find(s => s[0] === "insert")[1].customer_id, "owned-customer");
});
test("address mutations reject invalid input and client-supplied ownership", async () => {
  for (const invalid of [{ ...body, customer_id: "other" }, { ...body, latitude: null }, { ...body, longitude: 181 }, { ...body, address_line: "short" }]) {
    assert.equal((await run(saveAddress, invalid)).error.status, 400);
    assert.equal(calls.length, 0);
  }
});
test("updates and deletes restrict writes to the signed-in customer's addresses", async () => {
  for (const handler of [updateAddress, deleteAddress]) {
    assert.equal((await run(handler)).error, undefined);
    assert.ok(calls[1].steps.some(s => s[0] === "eq" && s[1] === "customer_id" && s[2] === "owned-customer"));
    assert.ok(calls[1].steps.some(s => s[0] === "eq" && s[1] === "id" && s[2] === id));
    assert.equal((await run(handler, body, [{ data: { id: "owned-customer" } }, { data: null }])).error.status, 404);
  }
});
test("booking confirmation reuses unchanged addresses and rejects another customer's address", async () => {
  const existing = { ...body, id };
  assert.deepEqual((await run(saveAddress, { ...body, address_id: id }, [{ data: { id: "owned-customer" } }, { data: existing }])).response, { id });
  assert.equal(calls.length, 2);
  assert.equal((await run(saveAddress, { ...body, address_id: id }, [{ data: { id: "owned-customer" } }, { data: null }])).error.status, 404);
  assert.equal(calls.length, 2);
});
test("linked booking addresses cannot be deleted", async () => {
  const result = await run(deleteAddress, body, [{ data: { id: "owned-customer" } }, { error: { code: "23503" } }]);
  assert.equal(result.error.status, 409);
  assert.match(result.error.message, /linked to a booking/);
});
