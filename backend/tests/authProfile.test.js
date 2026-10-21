import { test, mock } from "node:test";
import assert from "node:assert/strict";

let authResult;
let profileResult;
let queriedId;
mock.module("../src/config/supabase.js", { namedExports: {
  supabaseAuth: { auth: { getUser: async () => authResult } },
  supabaseAdmin: { from: () => ({ select: () => ({ eq: (_column, id) => {
    queriedId = id;
    return { maybeSingle: async () => profileResult };
  } }) }) },
} });
const { requireAuth } = await import("../src/middleware/authMiddleware.js");

test("profile loading verifies identity and distinguishes missing profiles from database errors", async () => {
  async function run(token = "Bearer valid") {
    const req = { headers: { authorization: token } };
    let status; let body; let passed = false;
    await requireAuth(req, { status(value) { status = value; return this; }, json(value) { body = value; } }, () => { passed = true; });
    return { req, status, body, passed };
  }
  authResult = { data: { user: { id: "verified-user" } }, error: null };
  profileResult = { data: { id: "verified-user", role: "customer" }, error: null };
  const success = await run();
  assert.equal(success.passed, true);
  assert.equal(queriedId, "verified-user");
  assert.equal(success.req.profile.role, "customer");
  profileResult = { data: { id: "verified-user", role: "customer", is_active: false }, error: null };
  const inactive = await run();
  assert.equal(inactive.status, 403);
  assert.equal(inactive.passed, false);
  profileResult = { data: null, error: { code: "42P17", message: "policy recursion" } };
  assert.equal((await run()).status, 503);
  profileResult = { data: null, error: null };
  assert.equal((await run()).status, 404);
  queriedId = null;
  authResult = { data: { user: null }, error: { status: 401 } };
  assert.equal((await run()).status, 401);
  assert.equal(queriedId, null);
  assert.equal((await run("")).status, 401);
});
