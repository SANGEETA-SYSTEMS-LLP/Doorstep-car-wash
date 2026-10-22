import { test, mock } from "node:test";
import assert from "node:assert/strict";

let washer, payoutAccount, calls, updateValues;
const database = { from(table) {
  const query = {};
  calls.push(table);
  query.select = () => query;
  query.eq = () => query;
  query.in = () => query;
  query.limit = () => query;
  query.update = values => { updateValues = values; return query; };
  query.maybeSingle = async () => ({
    data: table === "washer_payout_accounts" ? payoutAccount : { id: washer.id, status: "available" },
    error: null,
  });
  query.then = (resolve, reject) => Promise.resolve({ data: [], error: null }).then(resolve, reject);
  return query;
} };

mock.module("../src/config/supabase.js", { namedExports: { supabaseAdmin: database } });
mock.module("../src/services/washer/washerWorkspaceService.js", { namedExports: {
  washerForUser: async () => washer,
  washerWorkspace: async () => ({}),
  washerBooking: async () => ({}),
  activeJobStatuses: [],
} });
const { setAvailability } = await import("../src/controllers/washer/washerWorkspaceController.js");

function reset(overrides = {}) {
  washer = { id: "washer-1", status: "offline", is_verified: true, ...overrides.washer };
  payoutAccount = overrides.payoutAccount === undefined
    ? { washer_id: washer.id, account_label: "Bank account •••• 6789", destination_encrypted: "encrypted" }
    : overrides.payoutAccount;
  calls = [];
  updateValues = null;
}

async function run(online = true) {
  let status = 200;
  let body;
  const response = {
    status(value) { status = value; return this; },
    json(value) { body = value; return this; },
  };
  await setAvailability({ body: { online }, user: { id: "washer-user" } }, response);
  return { status, body };
}

test("washer cannot go online before saving payout details", async () => {
  reset({ payoutAccount: null });
  const result = await run();
  assert.equal(result.status, 403);
  assert.match(result.body.message, /payout account/i);
  assert.deepEqual(calls, ["washer_payout_accounts"]);
  assert.equal(updateValues, null);
});

test("verified washer with a saved payout destination can go online", async () => {
  reset();
  const result = await run();
  assert.equal(result.status, 200);
  assert.equal(updateValues.status, "available");
});

test("unverified washer cannot go online even with payout details", async () => {
  reset({ washer: { is_verified: false } });
  const result = await run();
  assert.equal(result.status, 403);
  assert.match(result.body.message, /verification/i);
  assert.deepEqual(calls, []);
});
