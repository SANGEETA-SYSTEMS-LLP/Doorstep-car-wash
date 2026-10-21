import { test, mock } from "node:test";
import assert from "node:assert/strict";

const fixtures = {
  washer_earnings: { data: [{ id: "earning-1", booking_id: "booking-1", washer_id: "washer-1", washer_amount: 425, status: "pending", settled_at: null, created_at: "2026-10-20T10:00:00Z" }], count: 1 },
  washers: { data: [{ id: "washer-1", user_id: "user-1" }] },
  bookings: { data: [{ id: "booking-1", payment_method: "upi" }] },
  washer_payout_accounts: { data: [{ washer_id: "washer-1", account_label: "Bank account •••• 6789 (HDFC0001234)", updated_at: "2026-10-19T10:00:00Z" }] },
  payments: { data: [{ booking_id: "booking-1", status: "paid", payment_method: "upi" }] },
  profiles: { data: [{ id: "user-1", full_name: "Asha Washer", phone: "+919876543210" }] },
};

mock.module("../src/config/supabase.js", { namedExports: { supabaseAdmin: { from(table) {
  const query = {};
  for (const method of ["select", "eq", "order", "range", "in"]) query[method] = () => query;
  query.then = (resolve, reject) => Promise.resolve(fixtures[table] || { data: [], error: null }).then(resolve, reject);
  return query;
} } } });

const { listWasherPayouts } = await import("../src/controllers/financeController.js");

test("pending payout list includes washer payment details and only exposes masked payout information", async () => {
  let result;
  let error;
  await listWasherPayouts({ query: { status: "pending", page: "1" } }, { json(value) { result = value; } }, value => { error = value; });
  assert.equal(error, undefined);
  assert.equal(result.rows[0].washer_name, "Asha Washer");
  assert.equal(result.rows[0].washer_phone, "+919876543210");
  assert.equal(result.rows[0].payment_method, "Bank transfer (RazorpayX)");
  assert.equal(result.rows[0].payment_destination, "Bank account •••• 6789 (HDFC0001234)");
  assert.equal(result.rows[0].washer_amount, 425);
  assert.equal(result.rows[0].customer_payment_method, "upi");
  assert.equal(result.rows[0].payment_status, "Pending");
  assert.equal(result.rows[0].payout_eligible, true);
  assert.equal(JSON.stringify(result).includes("fund_account_id"), false);
});
