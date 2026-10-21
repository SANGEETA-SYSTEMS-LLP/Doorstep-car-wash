import { test, mock } from "node:test";
import assert from "node:assert/strict";

let booking;
const db = {
  from(table) {
    const query = { table, steps: [] };
    for (const method of ["select", "eq", "update", "insert"]) {
      query[method] = (...args) => {
        query.steps.push([method, ...args]);
        return query;
      };
    }
    query.maybeSingle = async () => result(query);
    query.single = async () => result(query);
    query.then = (resolve, reject) => Promise.resolve(result(query)).then(resolve, reject);
    return query;
  },
};

function result(query) {
  const { table, steps } = query;
  if (table === "customers") return { data: { id: "customer" } };
  if (table === "bookings") {
    if (steps.some(([method]) => method === "update")) {
      const expectedStatus = steps.find(([method, column]) => method === "eq" && column === "status")?.[2];
      if (booking.status !== expectedStatus) return { data: null };
      booking.status = "closed";
      return { data: { id: booking.id } };
    }
    return { data: { ...booking, customer_id: "customer", assigned_washer_id: "washer" } };
  }
  if (table === "washers") return { data: { id: "washer" } };
  if (table === "reviews" && steps.some(([method]) => method === "insert")) {
    return { data: { id: "review", rating: 5 } };
  }
  if (table === "reviews") return { data: [{ rating: 5 }] };
  return { data: null };
}

mock.module("../src/config/supabase.js", { namedExports: { supabaseAdmin: db } });
const { createReview, skipReview } = await import("../src/controllers/reviews/reviewController.js");

function resetBooking() {
  booking = { id: "booking", status: "customer_confirmed" };
}

function response() {
  return {
    code: 200,
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("customer can close a confirmed service without recording payment", async () => {
  resetBooking();
  const res = response();
  await skipReview({ user: { id: "user" }, params: { bookingId: "booking" } }, res);
  assert.equal(res.code, 200);
  assert.equal(res.body.status, "closed");
  assert.equal(booking.status, "closed");
});

test("customer can rate and close a confirmed service without recording payment", async () => {
  resetBooking();
  const res = response();
  await createReview(
    { user: { id: "user" }, params: { bookingId: "booking" }, body: { rating: 5 } },
    res,
  );
  assert.equal(res.code, 201);
  assert.equal(booking.status, "closed");
});
