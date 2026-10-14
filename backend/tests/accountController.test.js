import { test, mock } from "node:test";
import assert from "node:assert/strict";
let calls = [];
let fixtures = {};
const db = { from(table) {
  const call = { table, steps: [] }; calls.push(call);
  const query = {};
  for (const method of ["select", "eq", "single", "maybeSingle", "update", "order", "range"]) query[method] = (...args) => { call.steps.push([method, ...args]); return query; };
  query.then = (resolve, reject) => Promise.resolve(fixtures[table] || { data: null }).then(resolve, reject);
  return query;
} };
mock.module("../src/config/supabase.js", { namedExports: { supabaseAdmin: db } });
const { getAccount, updateAccount, myEarnings } = await import("../src/controllers/accountController.js");
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
