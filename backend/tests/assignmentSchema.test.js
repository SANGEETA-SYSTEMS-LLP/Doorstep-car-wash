import { test, mock } from "node:test";
import assert from "node:assert/strict";
let calls = [];
let assigned = false;
let bookingStatus = "finding_washer";
const db = { from(table) {
  const call = { table, steps: [] }; calls.push(call);
  const query = {};
  for (const method of ["select", "eq", "in", "update", "upsert", "maybeSingle", "single"]) query[method] = (...args) => { call.steps.push([method, ...args]); return query; };
  query.then = (resolve, reject) => {
    let data;
    if (table === "bookings") {
      if (call.steps.some(s => s[0] === "update")) data = null;
      else if (call.steps.some(s => s[0] === "eq" && s[1] === "assigned_washer_id")) data = [];
      else data = { id: "booking", booking_number: "CW-1", status: bookingStatus, assigned_washer_id: assigned ? "another-washer" : null, latitude: 17, longitude: 78, scheduled_date: "2026-10-13", scheduled_start_time: "10:00:00", package: { service_id: "service", duration_minutes: 30 } };
    }
    if (table === "washers") data = [{ id: "washer-record", user_id: "washer-account", is_active: true, status: "available", jobs_completed: 10, service_radius_km: 5, rating: 4.8, availability: [{ day_of_week: 2, start_time: "08:00:00", end_time: "18:00:00", is_available: true }], skills: [{ service_id: "service" }], location: { latitude: 17, longitude: 78, updated_at: new Date().toISOString() } }];
    if (table === "booking_assignments") data = call.steps.some(s => s[0] === "upsert") ? { id: "offer" } : [];
    return Promise.resolve({ data }).then(resolve, reject);
  };
  return query;
} };
mock.module("../src/config/supabase.js", { namedExports: { supabaseAdmin: db } });
const { assignWasherToBooking } = await import("../src/services/bookingAssignmentService.js");
test("eligible washer receives an offer using actual schema columns and record IDs", async () => {
  calls = []; assigned = false;
  const result = await assignWasherToBooking("booking");
  assert.equal(result.assigned, true);
  assert.equal(result.washer.id, "washer-record");
  const washerQuery = calls.find(c => c.table === "washers");
  assert.ok(washerQuery.steps.some(s => s[0] === "eq" && s[1] === "is_active"));
  const selected = washerQuery.steps.find(s => s[0] === "select")[1];
  assert.ok(selected.includes("jobs_completed"));
  assert.ok(selected.includes("updated_at"));
  assert.ok(!selected.includes("last_updated_at"));
  const conflict = calls.find(c => c.table === "bookings" && c.steps.some(s => s[0] === "eq" && s[1] === "assigned_washer_id"));
  assert.ok(conflict.steps.some(s => s[0] === "eq" && s[1] === "assigned_washer_id" && s[2] === "washer-record"));
  const offer = calls.find(c => c.steps.some(s => s[0] === "upsert")).steps.find(s => s[0] === "upsert")[1];
  assert.equal(offer.washer_id, "washer-record");
  assert.ok(offer.offered_at);
  assert.equal(offer.assigned_at, undefined);
});
test("already assigned booking does not create another offer", async () => {
  calls = []; assigned = true;
  await assert.rejects(assignWasherToBooking("booking"), /already has an assigned washer/);
  assert.ok(!calls.some(c => c.table === "booking_assignments"));
});

test("pending bookings cannot bypass supervisor review through automatic assignment", async () => {
 calls=[];assigned=false;bookingStatus="pending";
 try { await assert.rejects(assignWasherToBooking("booking"),/cannot be assigned/); assert.equal(calls.length,1); }
 finally {bookingStatus="finding_washer";}
});
