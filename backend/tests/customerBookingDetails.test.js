import { test, mock } from "node:test";
import assert from "node:assert/strict";

let fixtures = {};
let calls = [];

const supabaseAdmin = {
  from(table) {
    const call = { table, filters: [] };
    calls.push(call);
    const query = {
      select() { return query; },
      eq(...filter) { call.filters.push(filter); return query; },
      maybeSingle() {
        const rows = fixtures[table] || [];
        const row = rows.find((candidate) =>
          call.filters.every(([column, value]) => candidate[column] === value)
        );
        return Promise.resolve({ data: row || null, error: null });
      },
    };
    return query;
  },
};

mock.module("../src/config/supabase.js", {
  namedExports: { supabaseAdmin },
});

const { getCustomerBookingDetails } =
  await import("../src/controllers/customerBookingController.js");

const customerUserId = "11111111-1111-4111-8111-111111111111";
const bookingId = "22222222-2222-4222-8222-222222222222";
const washerId = "33333333-3333-4333-8333-333333333333";
const washerUserId = "44444444-4444-4444-8444-444444444444";

function reset(owned = true) {
  calls = [];
  fixtures = {
    customers: [{ id: "customer-record", user_id: customerUserId }],
    bookings: owned
      ? [{
        id: bookingId,
        customer_id: "customer-record",
        vehicle_id: "vehicle-record",
        package_id: "package-record",
        assigned_washer_id: washerId,
        status: "washer_assigned",
        service_otp_hash: "must-not-be-returned",
        service_otp_expires_at: "2026-10-14T09:00:00.000Z",
      }]
      : [],
    vehicles: [{
      id: "vehicle-record",
      brand: "Tata",
      model: "Nexon",
      vehicle_number: "TEST123",
    }],
    service_packages: [{
      id: "package-record",
      name: "Exterior wash",
      duration_minutes: 30,
    }],
    washers: [{
      id: washerId,
      user_id: washerUserId,
      rating: 4.8,
      jobs_completed: 42,
      status: "busy",
    }],
    profiles: [{
      id: washerUserId,
      full_name: "Washer Partner",
      phone: "+919876543210",
      avatar_url: null,
    }],
  };
}

async function invoke() {
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  await getCustomerBookingDetails(
    { params: { bookingId }, user: { id: customerUserId } },
    response
  );
  return response;
}

test("customer booking details include only the assigned washer's public contact details", async () => {
  reset();
  const response = await invoke();

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.booking.vehicle.model, "Nexon");
  assert.equal(response.body.booking.package.name, "Exterior wash");
  assert.equal(response.body.booking.washer.name, "Washer Partner");
  assert.equal(response.body.booking.washer.phone, "+919876543210");
  assert.equal(response.body.booking.washer.totalJobs, 42);
  assert.equal("service_otp_hash" in response.body.booking, false);
  assert.equal("service_otp_expires_at" in response.body.booking, false);
  assert.ok(calls.find((call) => call.table === "bookings").filters.some(
    ([column, value]) => column === "customer_id" && value === "customer-record"
  ));
});

test("customers cannot load another customer's booking or washer contact information", async () => {
  reset(false);
  const response = await invoke();

  assert.equal(response.statusCode, 404);
  assert.equal(calls.some((call) => call.table === "washers"), false);
  assert.equal(calls.some((call) => call.table === "profiles"), false);
});
