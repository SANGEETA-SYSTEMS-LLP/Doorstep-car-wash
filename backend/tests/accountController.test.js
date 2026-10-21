import { test, mock } from "node:test";
import assert from "node:assert/strict";
let calls = [];
let fixtures = {};
const db = { from(table) {
  const call = { table, steps: [] }; calls.push(call);
  const query = {};
  for (const method of ["select", "eq", "in", "single", "maybeSingle", "update", "order", "range", "limit", "gte", "lt"]) query[method] = (...args) => { call.steps.push([method, ...args]); return query; };
  query.then = (resolve, reject) => Promise.resolve(fixtures[table] || { data: null }).then(resolve, reject);
  return query;
} };
mock.module("../src/config/supabase.js", { namedExports: { supabaseAdmin: db } });
const { getAccount, updateAccount, myEarnings, myEarningsSummary, getCustomerResources, getMyBookings } = await import("../src/controllers/accounts/accountController.js");
async function run(handler, extra = {}) {
  calls = []; let result; let error;
  await handler({ user: { id: "own-user", email: "test@example.com" }, query: {}, ...extra }, { json(value) { result = value; } }, value => { error = value; });
  return { result, error };
}
test("profile reads and writes remain scoped to authenticated identity", async () => {
  fixtures = { profiles: { data: { id: "own-user", full_name: "Name", role: "customer" } } };
  const read = await run(getAccount);
  assert.equal(read.result.profile.email, "test@example.com");
  assert.ok(calls[0].steps.some(s => s[0] === "eq" && s[1] === "id" && s[2] === "own-user"));
  const write = await run(updateAccount, { body: { full_name: " Name ", phone: "+919000000000" } });
  assert.equal(write.error, undefined);
  assert.ok(calls[0].steps.some(s => s[0] === "eq" && s[1] === "id" && s[2] === "own-user"));
  assert.equal(calls[0].steps.find(s => s[0] === "update")[1].full_name, "Name");
});
test("profile updates reject role escalation and invalid input before database access", async () => {
  for (const body of [null, { full_name: "Name", phone: "+919000000000", role: "super_admin" }, { full_name: "Name", phone: "invalid" }]) {
    const { error } = await run(updateAccount, { body });
    assert.equal(error.status, 400); assert.equal(calls.length, 0);
  }
});
test("earnings use the authenticated washer record and bounded pagination", async () => {
  fixtures = { washers: { data: { id: "washer-record" } }, washer_earnings: { data: [], count: 0 } };
  const { result, error } = await run(myEarnings, { query: { page: "2" } });
  assert.equal(error, undefined); assert.equal(result.page, 2);
  assert.ok(calls[0].steps.some(s => s[0] === "eq" && s[1] === "user_id" && s[2] === "own-user"));
  assert.ok(calls[1].steps.some(s => s[0] === "eq" && s[1] === "washer_id" && s[2] === "washer-record"));
  assert.deepEqual(calls[1].steps.find(s => s[0] === "range"), ["range", 25, 49]);
  assert.equal((await run(myEarnings, { query: { page: "-1" } })).error.status, 400);
  fixtures = { washers: { data: null } };
  assert.equal((await run(myEarnings)).error.status, 404);
});

test("earnings summary is scoped to the washer and a validated day range", async () => {
  fixtures = {
    washers: {data: {id: "washer-record"}},
    washer_earnings: {data: [
      {washer_amount: "400.00", status: "pending"},
      {washer_amount: 250, status: "settled"},
    ]},
  };
  const from = "2026-10-16T00:00:00.000Z";
  const to = "2026-10-17T00:00:00.000Z";
  const {result, error} = await run(myEarningsSummary, {query: {from, to}});
  assert.equal(error, undefined);
  assert.deepEqual(result, {success: true, earned: 650, pending: 400, settled: 250});
  assert.ok(calls[0].steps.some(s => s[0] === "eq" && s[1] === "user_id" && s[2] === "own-user"));
  assert.ok(calls[1].steps.some(s => s[0] === "eq" && s[1] === "washer_id" && s[2] === "washer-record"));
  assert.ok(calls[1].steps.some(s => s[0] === "gte" && s[1] === "created_at" && s[2] === from));
  assert.ok(calls[1].steps.some(s => s[0] === "lt" && s[1] === "created_at" && s[2] === to));
  assert.equal((await run(myEarningsSummary, {query: {from, to: from}})).error.status, 400);
});

test("customer resources are scoped to the signed-in customer and propagate failures", async () => {
 for (const resource of ["addresses", "vehicles"]) {
  fixtures = {customers: {data: {id: "owned-customer"}}, customer_addresses: {data: []}, vehicles: {data: []}};
  const response = await run(getCustomerResources, {params: {resource}});
  assert.deepEqual(response.result.rows, []);
  assert.ok(calls[0].steps.some(s => s[0] === "eq" && s[1] === "user_id" && s[2] === "own-user"));
  assert.ok(calls[1].steps.some(s => s[0] === "eq" && s[1] === "customer_id" && s[2] === "owned-customer"));
 }
 fixtures = {customers: {error: new Error("Database unavailable")}};
 assert.equal((await run(getCustomerResources, {params: {resource: "addresses"}})).error.message, "Database unavailable");
 fixtures = {customers: {data: null}};
 assert.deepEqual((await run(getCustomerResources, {params: {resource: "addresses"}})).result.rows, []);
 assert.equal(calls.length, 1);
});

test("customer bookings do not depend on optional payment_method schema", async () => {
 fixtures = {
  customers: {data: {id: "owned-customer"}},
  bookings: {data: [{id: "booking-1", status: "pending"}]},
 };
 const response = await run(getMyBookings);
 assert.equal(response.error, undefined);
 assert.deepEqual(response.result.bookings, [{id: "booking-1", status: "pending", washer: null}]);
 assert.ok(calls[0].steps.some(s => s[0] === "eq" && s[1] === "user_id" && s[2] === "own-user"));
 assert.ok(calls[1].steps.some(s => s[0] === "eq" && s[1] === "customer_id" && s[2] === "owned-customer"));
 const selectedColumns = calls[1].steps.find(s => s[0] === "select")[1];
 assert.doesNotMatch(selectedColumns, /payment_method/);

 fixtures = {customers: {data: null}};
 assert.deepEqual((await run(getMyBookings)).result.bookings, []);
 assert.equal(calls.length, 1);
});

test("customer booking list contains only public contact details for its assigned washer", async () => {
 fixtures = {
  customers: {data: {id: "owned-customer"}},
  bookings: {data: [{id: "booking-2", status: "washer_assigned", assigned_washer_id: "washer-1"}]},
  washers: {data: [{id: "washer-1", user_id: "washer-user", rating: 4.8, jobs_completed: 12, status: "busy"}]},
  profiles: {data: [{id: "washer-user", full_name: "Ravi Kumar", phone: "+919000000000", avatar_url: null, role: "washer", email: "private@example.com"}]},
 };
 const response = await run(getMyBookings);
 assert.equal(response.error, undefined);
 assert.deepEqual(response.result.bookings[0].washer, {
  id: "washer-1", name: "Ravi Kumar", phone: "+919000000000", avatarUrl: null,
  rating: 4.8, totalJobs: 12, status: "busy",
 });
 assert.doesNotMatch(JSON.stringify(response.result), /private@example.com|washer-user/);
 assert.ok(calls[2].steps.some(step => step[0] === "in" && step[1] === "id"));
 assert.ok(calls[3].steps.some(step => step[0] === "in" && step[1] === "id"));
});
