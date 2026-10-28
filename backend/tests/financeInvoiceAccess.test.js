import { test, mock } from "node:test";
import assert from "node:assert/strict";

const calls = [];
const query = {
  select(fields) { calls.push(["select", fields]); return this; },
  eq(column, value) { calls.push(["eq", column, value]); return this; },
  maybeSingle() { return Promise.resolve({ data: null, error: null }); },
};
const db = { from(table) { calls.push(["from", table]); return query; } };
mock.module("../src/config/supabase.js", { namedExports: { supabaseAdmin: db } });

const { getInvoice } = await import("../src/controllers/finance/financeDocumentsController.js");

test("invoice lookup scopes customer booking query to authenticated customer", async () => {
  const response = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  await getInvoice({ params: { bookingId: "9f9b56cb-f7ad-4d83-9cdd-cfbb1130214d" }, profile: { role: "customer" }, user: { id: "customer-user" }, query: {} }, response, (error) => { throw error; });
  assert.equal(response.statusCode, 404);
  assert.deepEqual(calls.filter((call) => call[0] === "eq"), [["eq", "user_id", "customer-user"]]);
  assert.equal(calls.some((call) => call[0] === "eq" && call[1] === "customer_id"), false);
});
