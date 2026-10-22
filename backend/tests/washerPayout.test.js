import { test, mock } from "node:test";
import assert from "node:assert/strict";
process.env.PAYOUT_DATA_ENCRYPTION_KEY = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
let calls, providerCalls, fixtures;
mock.module("../src/config/supabase.js", { namedExports: { supabaseAdmin: { from(table) {
  const call = { table, steps: [] }; calls.push(call);
  const q = { then: resolve => Promise.resolve(fixtures[table] || { data: null }).then(resolve) };
  for (const name of ["select", "eq", "maybeSingle", "upsert", "limit"]) q[name] = (...args) => { call.steps.push([name, ...args]); return q; };
  return q;
} } } });
mock.module("../src/services/finance/financeProvider.js", { namedExports: { isProviderConfigured: () => false, providerRequest: async (path, options) => {
  providerCalls.push({ path, options });
  return path === "contacts" ? { id: "cont_test" } : { id: "fa_test", active: true, contact_id: "cont_test", account_type: "bank_account" };
} } });
const { saveWasherPayout, getWasherPayout } = await import("../src/controllers/washer/washerPayoutController.js");
const { getCustomerPaymentOptions } = await import("../src/controllers/customers/customerPaymentOptionsController.js");
function reset() { calls = []; providerCalls = []; fixtures = { washers: { data: { id: "own-washer", is_active: true, user_id: "washer-user" } } }; }
async function run(handler, extra = {}) {
  let status = 200, result, error;
  await handler({ user: { id: "user" }, profile: { role: "washer" }, params: { bookingId: "booking" }, body: { name: "Test Name", accountNumber: "1234567890", ifsc: "HDFC0000001" }, ...extra },
    { status(value) { status = value; return this; }, json(value) { result = value; } }, e => { error = e; });
  return { status, result, error };
}
test("washer can save own payout details without RazorpayX and stores no plaintext bank number", async () => {
  reset(); const result = await run(saveWasherPayout);
  assert.equal(result.status, 200);
  assert.ok(calls[0].steps.some(s => s[0] === "eq" && s[1] === "user_id" && s[2] === "user"));
  const values = calls[1].steps.find(s => s[0] === "upsert")[1];
  assert.equal(values.washer_id, "own-washer"); assert.equal(values.fund_account_id, null);
  assert.equal(result.result.providerConfigured, false);
  assert.equal(JSON.stringify(values).includes("1234567890"), false);
  assert.equal(typeof values.destination_encrypted, "string");
  assert.equal(providerCalls.length, 0);
});
test("customers cannot change payout destinations and invalid bank details never reach provider", async () => {
  reset(); assert.equal((await run(saveWasherPayout, { profile: { role: "customer" } })).status, 403);
  assert.equal(providerCalls.length, 0);
  reset(); assert.equal((await run(saveWasherPayout, { body: { name: "Test", accountNumber: "bad", ifsc: "invalid" } })).status, 400);
  assert.equal(providerCalls.length, 0);
});
test("washer reads only masked payout label", async () => {
  reset(); fixtures.washer_payout_accounts = { data: { account_label: "Bank •••• 7890" } };
  const result = await run(getWasherPayout);
  assert.equal(result.result.account.account_label, "Bank •••• 7890");
  assert.equal(result.result.providerConfigured, false);
  assert.equal(calls[1].steps[0][1], "account_label,updated_at");
});
test("customer payment options require an owned confirmed booking and hide payout data", async () => {
  reset(); fixtures.customers = { data: { id: "own-customer" } }; fixtures.bookings = { data: null };
  assert.equal((await run(getCustomerPaymentOptions)).status, 404);
  assert.ok(calls[1].steps.some(s => s[0] === "eq" && s[1] === "customer_id" && s[2] === "own-customer"));
  fixtures.bookings = { data: { id: "booking", status: "service_completed" } };
  assert.equal((await run(getCustomerPaymentOptions)).status, 409);
  fixtures.bookings = { data: { id: "booking", status: "customer_confirmed", assigned_washer_id: "own-washer", total_amount: 500 } };
  fixtures.profiles = { data: { full_name: "Washer" } }; fixtures.payments = { data: [{ id: "paid" }] };
  const result = await run(getCustomerPaymentOptions);
  assert.equal(result.result.paid, true); assert.equal(result.result.washerName, "Washer");
  assert.equal(JSON.stringify(result.result).includes("fund_account"), false);
});
