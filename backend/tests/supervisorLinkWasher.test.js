import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { referenceId } from "../src/utils/referenceId.js";
const id = "22222222-2222-4222-8222-222222222222";
let owner = null, writes = [], lookups = [];
mock.module("../src/config/supabase.js", { namedExports: { supabaseAdmin: {
  auth: { admin: { getUserById: async () => ({ data: { user: { email: "washer@example.com" } } }) } },
  from(table) {
    let updating = false; const q = {};
    q.select = q.maybeSingle = q.is = () => q;
    q.eq = (...args) => { lookups.push(args); return q; };
    q.update = value => { updating = true; writes.push(value); return q; };
    q.then = resolve => Promise.resolve({ data: table === "profiles" ? { full_name: "Washer One", phone: "9876543210", role: "washer", is_active: true } : table === "washer_locations" ? { latitude: 20, longitude: 85 } : updating ? { id } : { id, user_id: id, supervisor_id: owner, is_active: true, status: "offline", is_verified: false, current_address: "Bhubaneswar" } }).then(resolve);
    return q;
  },
} } });
const { linkSupervisorWasher } = await import("../src/controllers/supervisor/supervisorWasherController.js");
async function invoke(name = "Washer One", washerId = referenceId("WSH", id)) {
  const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  await linkSupervisorWasher({ profile: { role: "supervisor" }, user: { id: "supervisor" }, body: { name, washerId } }, res);
  return res;
}
test("links generated ID and returns full details without changing verification", async () => {
  const res = await invoke();
  assert.equal(res.body.success, true);
  assert.equal(res.body.washer.email, "washer@example.com");
  assert.equal(res.body.washer.location.latitude, 20);
  assert.equal(res.body.washer.is_verified, false);
  assert.deepEqual(writes, [{ supervisor_id: "supervisor" }]);
  assert.ok(lookups.some(([column, value]) => column === "user_id" && value === id));
});
test("rejects mismatched names, invalid IDs and washers owned by another supervisor", async () => {
  const before = writes.length;
  assert.equal((await invoke("Wrong Name")).code, 400);
  assert.equal((await invoke("Washer One", "invalid")).code, 400);
  owner = "another-supervisor";
  assert.equal((await invoke()).code, 409);
  assert.equal(writes.length, before);
});
