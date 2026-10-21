import { test, mock } from "node:test";
import assert from "node:assert/strict";

let dataByTable = {};
mock.module("../src/config/supabase.js", {
  namedExports: {
    supabaseAdmin: {
      from(table) {
        const query = {};
        for (const method of ["select", "range", "in", "not", "eq"]) query[method] = () => query;
        query.then = (resolve, reject) => Promise.resolve({ data: dataByTable[table] || [], error: null }).then(resolve, reject);
        return query;
      },
    },
  },
});

const { getSupervisorWasherRoster } = await import("../src/controllers/supervisorWasherRosterController.js");

test("supervisor roster returns washer status, accepted work, and earnings summaries", async () => {
  dataByTable = {
    washers: [
      { id: "washer-a", user_id: "user-a", status: "available", is_active: true, is_verified: true, rating: 4.8, jobs_completed: 3, current_address: "Central Pune service area" },
      { id: "washer-b", user_id: "user-b", status: "offline", is_active: true, is_verified: false, rating: 0, jobs_completed: 0, current_address: "West Pune service area" },
    ],
    profiles: [
      { id: "user-a", full_name: "Asha Washer", phone: "+919876543210", role: "washer", is_active: true },
      { id: "user-b", full_name: "Bina Washer", phone: "+919876543211", role: "washer", is_active: true },
    ],
    bookings: [
      { id: "booking-a", assigned_washer_id: "washer-a", status: "washer_assigned" },
      { id: "booking-b", assigned_washer_id: "washer-a", status: "closed" },
    ],
    booking_assignments: [
      { booking_id: "booking-a", washer_id: "washer-a", status: "accepted" },
      { booking_id: "booking-b", washer_id: "washer-a", status: "accepted" },
    ],
    washer_earnings: [
      { washer_id: "washer-a", gross_amount: 600, platform_commission: 100, washer_amount: 500, status: "pending" },
      { washer_id: "washer-a", gross_amount: 300, platform_commission: 50, washer_amount: 250, status: "settled" },
    ],
  };

  const res = { json(body) { this.body = body; return this; } };
  let error;
  await getSupervisorWasherRoster({}, res, value => { error = value; });

  assert.equal(error, undefined);
  assert.deepEqual(res.body.summary, {
    washers: 2, online: 1, verified: 1, pendingVerification: 1, inactive: 0,
    acceptedAssignments: 2, activeJobs: 1, grossEarnings: 900, platformCommission: 150,
    totalEarnings: 750, pendingEarnings: 500, pendingPayout: 500, settledEarnings: 250,
  });
  assert.equal(res.body.washers[0].name, "Asha Washer");
  assert.equal(res.body.washers[0].acceptedAssignments, 2);
  assert.equal(res.body.washers[0].pendingEarnings, 500);
  assert.equal(res.body.washers[1].verified, false);
});
