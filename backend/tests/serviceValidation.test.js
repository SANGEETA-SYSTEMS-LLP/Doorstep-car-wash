import { test, mock } from "node:test";
import assert from "node:assert/strict";

let booking;
let washer;
let afterPhoto;
let updatePayload;
let earningCalls;

const db = {
  from(table) {
    const query = {
      action: "select",
      filters: {},
      select() { return query; },
      update(payload) {
        query.action = "update";
        updatePayload = payload;
        return query;
      },
      eq(column, value) {
        query.filters[column] = value;
        return query;
      },
      limit() { return query; },
      maybeSingle() {
        if (table === "bookings" && query.action === "update") {
          return Promise.resolve({
            data: { ...booking, ...updatePayload },
            error: null,
          });
        }
        const data = table === "bookings"
          ? booking
          : table === "washers"
            ? washer
            : afterPhoto;
        return Promise.resolve({ data, error: null });
      },
    };
    return query;
  },
};

mock.module("../src/config/supabase.js", {
  namedExports: { supabaseAdmin: db },
});
mock.module("../src/services/earningService.js", {
  namedExports: {
    createWasherEarning: async () => {
      earningCalls += 1;
      return null;
    },
  },
});
const { validateServiceCompletion } = await import("../src/services/serviceValidationService.js");

function reset() {
  booking = {
    id: "booking-1",
    assigned_washer_id: "washer-1",
    status: "service_completed",
  };
  washer = { id: "washer-1" };
  afterPhoto = { id: "photo-1" };
  updatePayload = null;
  earningCalls = 0;
}

test("supervisor validates submitted after photos and completes the booking", async () => {
  reset();
  const result = await validateServiceCompletion({
    bookingId: booking.id,
    userId: "supervisor-user",
    role: "supervisor",
  });

  assert.equal(result.status, "completed");
  assert.equal(updatePayload.status, "completed");
  assert.equal(updatePayload.service_validated_by, "supervisor-user");
  assert.equal(updatePayload.service_validated_role, "supervisor");
  assert.equal(earningCalls, 1);
});

test("only the assigned washer can validate as a washer", async () => {
  reset();
  washer = { id: "another-washer" };
  await assert.rejects(
    validateServiceCompletion({
      bookingId: booking.id,
      userId: "washer-user",
      role: "washer",
    }),
    { status: 403 },
  );
  assert.equal(updatePayload, null);
});

test("after-service photos are required before validation", async () => {
  reset();
  afterPhoto = null;
  await assert.rejects(
    validateServiceCompletion({
      bookingId: booking.id,
      userId: "supervisor-user",
      role: "supervisor",
    }),
    { status: 400 },
  );
  assert.equal(updatePayload, null);
  assert.equal(earningCalls, 0);
});

test("non-review roles cannot validate service completion", async () => {
  reset();
  await assert.rejects(
    validateServiceCompletion({
      bookingId: booking.id,
      userId: "customer-user",
      role: "customer",
    }),
    { status: 403 },
  );
});
