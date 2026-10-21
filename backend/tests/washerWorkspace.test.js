import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { referenceId } from "../src/utils/referenceId.js";
let fixtures = {};
let calls = [];
const db = { from(table) {
  const call = { table, steps: [] }; calls.push(call);
  const query = {};
  for (const method of ["select", "eq", "gt", "in", "order", "limit", "maybeSingle"]) query[method] = (...args) => { call.steps.push([method, ...args]); return query; };
  query.then = (resolve, reject) => Promise.resolve(typeof fixtures[table] === "function" ? fixtures[table](call) : fixtures[table] || { data: [] }).then(resolve, reject);
  return query;
} };
mock.module("../src/config/supabase.js", { namedExports: { supabaseAdmin: db } });
const { washerBooking, washerWorkspace, washerForUser } = await import("../src/services/washer/washerWorkspaceService.js");
const user = "11111111-1111-4111-8111-111111111111";
const customerUser = "22222222-2222-4222-8222-222222222222";
const washer = { id: "washer-record", user_id: user, is_active: true, status: "available" };
const booking = { id: "booking", customer_id: "customer-record", vehicle_id: "vehicle", address_id: "address", package_id: "package", assigned_washer_id: washer.id, status: "washer_assigned" };
function reset(extra = {}) {
  calls = [];
  fixtures = {
    washers: { data: washer }, bookings: { data: booking },
    customers: { data: [{ id: "customer-record", user_id: customerUser }] },
    profiles: { data: [{ id: customerUser, full_name: "Test Customer", phone: "+919000000000" }] },
    vehicles: { data: [{ id: "vehicle", brand: "Tata", model: "Nexon", vehicle_number: "TEST123" }] },
    customer_addresses: { data: [{ id: "address", address_line: "Test Road", tower: "B", flat_number: "502", latitude: 17, longitude: 78 }] },
    service_packages: { data: [{ id: "package", name: "Exterior wash", duration_minutes: 30 }] },
    payments: { data: [{ booking_id: "booking", status: "paid", payment_method: "upi" }] }, ...extra,
  };
}
test("reference IDs preserve UUID uniqueness and distinguish the two roles", () => {
  assert.equal(referenceId("CUS", user), referenceId("CUS", user.toUpperCase()));
  assert.notEqual(referenceId("CUS", user), referenceId("WSH", user));
  assert.notEqual(referenceId("CUS", user), referenceId("CUS", customerUser));
  assert.match(referenceId("WSH", user), /^WSH-[A-Z0-9]{25}$/);
  assert.equal(referenceId("CUS", null), null);
});
test("job detail resolves customer profile and enforces assigned washer record ownership", async () => {
  reset();
  const result = await washerBooking(user, "booking");
  assert.equal(result.customer.name, "Test Customer");
  assert.equal(result.customer.referenceId, referenceId("CUS", customerUser));
  assert.equal(result.washerReferenceId, referenceId("WSH", user));
  assert.equal(result.location.address, "Test Road, B, 502");
  assert.equal(result.vehicle.vehicle_number, "TEST123");
  assert.equal(result.payment.status, "paid");
  const query = calls.find(c => c.table === "bookings");
  assert.ok(query.steps.some(s => s[0] === "eq" && s[1] === "assigned_washer_id" && s[2] === washer.id));
  assert.ok(!query.steps[0][1].includes("service_otp"));
  assert.doesNotMatch(query.steps[0][1], /service_address|payment_method|latitude|flat_number/);
});
test("unauthorized booking never loads customer contact records", async () => {
  reset({ bookings: { data: null } });
  await assert.rejects(washerBooking(user, "other-booking"), { status: 404 });
  assert.ok(!calls.some(c => c.table === "profiles" || c.table === "customers"));
});
test("missing or inactive washer accounts cannot access workspace", async () => {
  reset({ washers: { data: null } });
  await assert.rejects(washerForUser(user), { status: 404 });
  reset({ washers: { data: { ...washer, is_active: false } } });
  await assert.rejects(washerForUser(user), { status: 403 });
});
test("workspace filters stale booking offers and scopes all assignment reads", async () => {
  reset({
    booking_assignments: { data: [{ id: "offer-1", booking_id: "booking" }, { id: "offer-2", booking_id: "taken" }] },
    bookings: call => ({ data: call.steps.some(s => s[0] === "in") ? [{ ...booking, assigned_washer_id: null, status: "finding_washer" }, { ...booking, id: "taken" }] : [] }),
  });
  const result = await washerWorkspace(user);
  assert.equal(result.assignments.length, 1);
  assert.equal(result.assignments[0].booking.customer.name, "Test Customer");
  const query = calls.find(c => c.table === "booking_assignments");
  assert.ok(query.steps.some(s => s[0] === "eq" && s[1] === "washer_id" && s[2] === washer.id));
  assert.ok(query.steps.some(s => s[0] === "gt" && s[1] === "expires_at"));
});
