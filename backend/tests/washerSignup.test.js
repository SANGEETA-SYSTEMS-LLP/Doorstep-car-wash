import { test, mock } from "node:test";
import assert from "node:assert/strict";
let calls = [];
let profileState;
mock.module("../src/config/supabase.js", { namedExports: { supabaseAdmin: { from(table) {
  const call = { table, steps: [] }; calls.push(call);
  const q = {
    then: resolve => Promise.resolve({ error: null }).then(resolve),
    maybeSingle: async () => {
      call.steps.push(["maybeSingle"]);
      if (table === "profiles" && call.steps.some(step => step[0] === "update")) {
        profileState = { ...profileState, role: "washer" };
        return { data: profileState, error: null };
      }
      return { data: table === "profiles" ? profileState : null, error: null };
    },
  };
  for (const method of ["upsert", "update", "eq", "select"]) q[method] = (...args) => { call.steps.push([method, ...args]); return q; };
  return q;
} } } });
const { reconcileWasherSignup } = await import("../src/services/washer/washerSignupService.js");
const user = { id: "user", user_metadata: { requested_role: "washer" } };
test("legacy washer signups get washer access but never automatic verification", async () => {
  calls = [];
  profileState = { id: "user", role: "customer", is_active: true };
  assert.equal((await reconcileWasherSignup(user, { role: "customer", is_active: true })).role, "washer");
  const washerCall = calls.find(call => call.table === "washers");
  assert.ok(washerCall.steps.some(step => step[0] === "upsert" && step[1].is_verified === false && step[1].status === "offline"));
  const profileUpdate = calls.find(call => call.table === "profiles" && call.steps.some(step => step[0] === "update"));
  assert.ok(profileUpdate.steps.some(step => step[0] === "eq" && step[1] === "role" && step[2] === "customer"));
});
test("normal customers, suspended profiles and privileged staff roles are unchanged", async () => {
  for (const [account, profile] of [[{ id: "user" }, { role: "customer" }], [user, { role: "customer", is_active: false }], [user, { role: "supervisor" }], [{ ...user, user_metadata: { requested_role: "super_admin" } }, { role: "customer" }]]) {
    calls = [];
    assert.equal(await reconcileWasherSignup(account, profile), profile);
    assert.equal(calls.length, 0);
  }
});
