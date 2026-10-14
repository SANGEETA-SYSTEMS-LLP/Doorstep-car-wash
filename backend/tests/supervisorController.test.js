import { test, mock } from "node:test";
import assert from "node:assert/strict";

let results = {};
let calls = [];
const client = {
  from(table) {
    const call = { table, steps: [] };
    calls.push(call);
    const query = {};
    for (const method of ["select", "in", "or", "order", "gte", "eq"]) {
      query[method] = (...args) => { call.steps.push([method, ...args]); return query; };
    }
    query.then = (resolve, reject) => Promise.resolve(results[table] || { data: [] }).then(resolve, reject);
    return query;
  },
};
mock.module("../src/config/supabase.js", { namedExports: { supabaseAdmin: client } });
mock.module("../src/services/bookingAssignmentService.js", {
  namedExports: { washerHasScheduleConflict: async () => false },
});
const { getEscalations, getActiveJobs, getSupervisorDashboard } =
  await import("../src/controllers/supervisorController.js");

async function invoke(handler, fixtures) {
  results = fixtures;
  calls = [];
  const res = {
    code: 200,
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
  };
  await handler({}, res);
  return res;
}

const booking = {
  id: "booking-1", address_id: "address-1", vehicle_id: "vehicle-1",
  package_id: "package-1", assigned_washer_id: "washer-1",
  scheduled_start_time: "09:30:00", status: "support_escalated",
};
const fixtures = {
  bookings: { data: [booking] },
  customer_addresses: { data: [{ id: "address-1", address_line: "Main Road", tower: "A", city: "Pune" }] },
  vehicles: { data: [{ id: "vehicle-1", brand: "Tata", model: "Nexon" }] },
  service_packages: { data: [{ id: "package-1", name: "Full wash" }] },
};

test("escalations use schema columns, include support escalations, and preserve display fields", async () => {
  const res = await invoke(getEscalations, fixtures);
  assert.equal(res.code, 200);
  const row = res.body.escalations[0];
  assert.equal(row.service_address, "Main Road, A, Pune");
  assert.equal(row.scheduled_time, "09:30:00");
  assert.equal(row.assigned_washer_id, "washer-1");
  assert.equal(row.vehicle.model, "Nexon");
  assert.equal(row.package.name, "Full wash");
  assert.deepEqual(calls[0].steps, [
    ["select", "*"],
    ["or", "requires_supervisor.eq.true,status.eq.support_escalated"],
    ["order", "created_at", { ascending: false }],
  ]);
  assert.deepEqual(calls.find(c => c.table === "customer_addresses").steps[1], ["in", "id", ["address-1"]]);
});

test("empty escalation results skip all related queries", async () => {
  const res = await invoke(getEscalations, { bookings: { data: [] } });
  assert.deepEqual(res.body, { success: true, escalations: [] });
  assert.equal(calls.length, 1);
});

test("missing related records retain bookings with an address fallback", async () => {
  const res = await invoke(getEscalations, { bookings: { data: [booking, { id: "booking-2" }] } });
  assert.equal(res.body.escalations.length, 2);
  assert.equal(res.body.escalations[0].service_address, "Address unavailable");
  assert.equal(res.body.escalations[0].address, null);
  assert.equal(res.body.escalations[0].vehicle, null);
});

test("active jobs sort by scheduled date and preserve related data", async () => {
  const res = await invoke(getActiveJobs, fixtures);
  assert.equal(res.body.jobs[0].package.name, "Full wash");
  assert.deepEqual(calls[0].steps, [
    ["select", "*"],
    ["in", "status", ["pending", "confirmed", "finding_washer", "washer_assigned", "washer_on_the_way", "washer_arrived", "otp_verified", "service_started", "service_completed"]],
    ["order", "scheduled_date", { ascending: true }],
  ]);
});

test("booking and address errors return failures instead of misleading empty lists", async () => {
  const log = mock.method(console, "error", () => {});
  try {
    for (const handler of [getEscalations, getActiveJobs]) {
      assert.equal((await invoke(handler, { bookings: { error: { message: "Booking query failed" } } })).code, 500);
      assert.equal((await invoke(handler, { ...fixtures, customer_addresses: { error: { message: "Address query failed" } } })).code, 500);
    }
  } finally { log.mock.restore(); }
});

test("dashboard counts pending extra charges and the same escalation criteria", async () => {
  const res = await invoke(getSupervisorDashboard, {
    bookings: { count: 3 },
    extra_charge_requests: { count: 5 },
  });
  assert.equal(res.code, 200);
  assert.deepEqual(res.body.stats, { activeJobs: 3, escalations: 3, pendingExtraCharges: 5, completedToday: 3 });
  assert.equal(calls.length, 4);
  assert.equal(calls.filter(c => c.table === "bookings").length, 3);
  assert.ok(calls[1].steps.some(s => s[0] === "or" && s[1] === "requires_supervisor.eq.true,status.eq.support_escalated"));
  assert.ok(calls.find(c => c.table === "extra_charge_requests").steps.some(s => s[0] === "eq" && s[1] === "status" && s[2] === "pending"));
});
