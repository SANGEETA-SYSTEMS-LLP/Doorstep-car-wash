import { test, mock } from "node:test";
import assert from "node:assert/strict";
let created = [], deleted = [], fail = false;
const id = "22222222-2222-4222-8222-222222222222";
mock.module("../src/config/supabase.js", { namedExports: { supabaseAdmin: {
  auth: { admin: {
    createUser: async input => { created.push(input); return { data: { user: { id } } }; },
    deleteUser: async value => { deleted.push(value); return {}; },
  } },
  from(table) {
    const q = {};
    for (const method of ["update", "eq", "select", "single"]) q[method] = () => q;
    q.then = resolve => Promise.resolve({ data: { id: "washer-record", user_id: id, status: "offline", is_verified: false }, error: fail && table === "washers" ? new Error("write failed") : null }).then(resolve);
    return q;
  },
} } });
mock.module("../src/services/washerSignupService.js", { namedExports: { provisionPendingWasher: async () => {} } });
const { addSupervisorWasher } = await import("../src/controllers/supervisorWasherController.js");
const body = { name: "Washer One", password: "Test-password-123", phone: "9876543210", email: "washer@example.com", location: { address: "Bhubaneswar Odisha 751001", latitude: 20.27, longitude: 85.84 } };
async function invoke(value = body, role = "supervisor") {
  const res = { status(code) { this.code = code; return this; }, json(data) { this.body = data; return this; } };
  await addSupervisorWasher({ body: value, profile: { role }, user: { id: "supervisor" } }, res);
  return res;
}
test("supervisor creates a pending washer and receives a generated ID without exposing a password", async () => {
  const res = await invoke();
  assert.equal(res.code, 201);
  assert.match(res.body.washer.referenceId, /^WSH-/);
  assert.equal(res.body.washer.is_verified, false);
  assert.equal(created[0].email_confirm, true);
  assert.equal(created[0].password, body.password);
  assert.equal(created[0].user_metadata.requested_role, "washer");
  assert.equal(JSON.stringify(res.body).includes(created[0].password), false);
});
test("invalid coordinates and unauthorized roles cannot create accounts", async () => {
  const before = created.length;
  assert.equal((await invoke({ ...body, location: { ...body.location, latitude: 999 } })).code, 400);
  assert.equal((await invoke(body, "customer")).code, 403);
  assert.equal(created.length, before);
});
test("failed provisioning cleans up only the newly created account", async () => {
  fail = true;
  assert.equal((await invoke()).code, 500);
  assert.deepEqual(deleted, [id]);
  fail = false;
});

test("missing, short and oversized passwords are rejected before account creation", async () => {
  const before = created.length;
  for (const password of [undefined, "short", "x".repeat(129)]) {
    assert.equal((await invoke({ ...body, password })).code, 400);
  }
  assert.equal(created.length, before);
});
