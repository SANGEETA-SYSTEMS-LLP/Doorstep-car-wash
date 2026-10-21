import { test, mock } from "node:test";
import assert from "node:assert/strict";

const rowsByTable = {};
const queriedTables = [];
const db = {
  from(table) {
    queriedTables.push(table);
    const query = {};
    for (const method of ["select", "order", "range", "eq", "in"]) query[method] = () => query;
    query.then = (resolve, reject) => Promise.resolve(rowsByTable[table] || { data: [], count: 0, error: null }).then(resolve, reject);
    return query;
  },
  auth: { admin: { async getUserById(id) { return { data: { user: { email: `${id}@example.test` } }, error: null }; } } },
};
mock.module("../src/config/supabase.js", { namedExports: { supabaseAdmin: db } });
const { listResource } = await import("../src/controllers/admin/adminController.js");

async function load(resource, role = "super_admin") {
  let body;
  let error;
  await listResource({ params: { resource }, query: {}, profile: { role } }, { json(value) { body = value; } }, value => { error = value; });
  if (error) throw error;
  return body;
}

test("Admin washer directory includes contact, service and masked bank payout method only", async () => {
  queriedTables.length = 0;
  rowsByTable.washers = { data: [{ id: "washer-1", user_id: "user-1", status: "available", current_address: "Main road", service_radius_km: 5 }], count: 1 };
  rowsByTable.profiles = { data: [{ id: "user-1", full_name: "Washer One", phone: "9999999999" }] };
  rowsByTable.washer_payout_accounts = { data: [{ washer_id: "washer-1", account_label: "Bank account •••• 1234 (HDFC0001234)", fund_account_id: "must-not-leak" }] };
  const result = await load("washers");
  assert.equal(result.rows[0].full_name, "Washer One");
  assert.equal(result.rows[0].email, "user-1@example.test");
  assert.equal(result.rows[0].payout_method, "Bank transfer (RazorpayX)");
  assert.equal(result.rows[0].payout_destination, "Bank account •••• 1234 (HDFC0001234)");
  assert.equal("fund_account_id" in result.rows[0], false);
  const subAdmin = await load("washers", "sub_admin");
  assert.equal("payout_method" in subAdmin.rows[0], false);
  assert.equal(subAdmin.rows[0].email, "user-1@example.test");
  assert.equal(queriedTables.includes("washer_payout_accounts"), true);
});

test("customer directory includes contact, saved addresses and vehicles", async () => {
  rowsByTable.customers = { data: [{ id: "customer-1", user_id: "user-2", total_bookings: 3 }], count: 1 };
  rowsByTable.profiles = { data: [{ id: "user-2", full_name: "Customer One", phone: "8888888888" }] };
  rowsByTable.customer_addresses = { data: [{ customer_id: "customer-1", label: "Home", address_line: "12 Main Road", city: "Bhubaneswar", postal_code: "751001" }] };
  rowsByTable.vehicles = { data: [{ customer_id: "customer-1", brand: "Tata", model: "Nexon", vehicle_number: "OD02AB1234", vehicle_type: "suv", seating_capacity: 5, is_active: true }] };
  const result = await load("customers");
  assert.equal(result.rows[0].full_name, "Customer One");
  assert.match(result.rows[0].saved_addresses, /12 Main Road/);
  assert.match(result.rows[0].vehicles, /Tata Nexon/);
});
