import test from "node:test";
import assert from "node:assert/strict";
import { allowRoles } from "../src/middleware/roleMiddleware.js";

test("role permissions reject unauthorized profiles and allow permitted roles", () => {
  function check(role) {
    let result;
    const req = { profile: role ? { role } : null };
    const res = { status(code) { result = code; return this; }, json() { return this; } };
    allowRoles("supervisor")(req, res, () => { result = 200; });
    return result;
  }
  assert.equal(check(null), 401);
  assert.equal(check("customer"), 403);
  assert.equal(check("supervisor"), 200);
  let inactiveResult;
  const inactiveReq = { profile: { role: "supervisor", is_active: false } };
  const inactiveRes = { status(code) { inactiveResult = code; return this; }, json() { return this; } };
  allowRoles("supervisor")(inactiveReq, inactiveRes, () => { inactiveResult = 200; });
  assert.equal(inactiveResult, 403);
});
