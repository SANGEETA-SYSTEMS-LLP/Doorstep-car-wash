import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { validateCapturedPayment } from "../src/services/payments/paymentValidation.js";

let completion;
let booking;
let assignmentCalls;
let earningCalls;
let refundCalls;
let assignmentFailure;

const db = {
  rpc: async (name, args) => {
    assert.equal(name, "complete_booking_payment");
    assert.deepEqual(args, {
      p_payment_id: "payment-id",
      p_provider_payment_id: "pay_abcdef123456",
      p_provider_method: "card",
    });
    return { data: completion, error: null };
  },
  from(table) {
    const query = {};
    for (const method of ["select", "eq", "maybeSingle"]) query[method] = () => query;
    query.then = (resolve, reject) => Promise.resolve({
      data: table === "bookings" ? booking : null,
      error: null,
    }).then(resolve, reject);
    return query;
  },
};

mock.module("../src/config/supabase.js", { namedExports: { supabaseAdmin: db } });
mock.module("../src/services/booking/bookingAssignmentService.js", {
  namedExports: { assignWasherToBooking: async () => {
    assignmentCalls++;
    if (assignmentFailure) throw assignmentFailure;
  } },
});
mock.module("../src/services/booking/cancellationRefundService.js", {
  namedExports: { refundLateCapturedBookingPayment: async (...args) => {
    refundCalls.push(args);
    return { status: "refund_pending" };
  } },
});
mock.module("../src/services/finance/earningService.js", {
  namedExports: { createWasherEarning: async () => { earningCalls++; } },
});

const { completeCapturedBookingPayment } = await import("../src/services/payments/completeCapturedBookingPayment.js");

function reset() {
  completion = { success: true, outcome: "completed", booking_id: "booking-id", status: "payment_completed" };
  booking = { id: "booking-id", status: "payment_completed", assigned_washer_id: null };
  assignmentCalls = 0;
  earningCalls = 0;
  refundCalls = [];
  assignmentFailure = null;
}

const payment = { id: "payment-id", booking_id: "booking-id", amount: 118 };
const captured = { id: "pay_abcdef123456", method: "card", amount: 11800 };

test("captured payment validation requires the exact requested payment ID", () => {
  const order = { ...payment, provider_order_id: "order_abcdef123456" };
  assert.equal(validateCapturedPayment({ ...captured, order_id: order.provider_order_id, currency: "INR", status: "captured" }, order, captured.id), undefined);
  assert.throws(() => validateCapturedPayment({ ...captured, id: "pay_different123", order_id: order.provider_order_id, currency: "INR", status: "captured" }, order, captured.id), /does not match/);
});

test("payment completion keeps the database status and skips earning without a washer", async () => {
  reset();
  const result = await completeCapturedBookingPayment(payment, captured);
  assert.equal(result.status, "payment_completed");
  assert.equal(result.booking.status, "payment_completed");
  assert.equal(assignmentCalls, 1);
  assert.equal(earningCalls, 0);
});

test("earning is created only after a washer is assigned", async () => {
  reset();
  booking.assigned_washer_id = "washer-id";
  await completeCapturedBookingPayment(payment, captured);
  assert.equal(earningCalls, 1);
});

test("post-payment assignment errors do not turn a captured payment into failure", async () => {
  reset();
  assignmentFailure = new Error("temporary assignment outage");
  const result = await completeCapturedBookingPayment(payment, captured);
  assert.equal(result.postPaymentError, true);
  assert.equal(result.success, true);
});

test("cancelled bookings start the late-capture refund and are not reassigned", async () => {
  reset();
  completion = { success: true, outcome: "cancelled", booking_id: "booking-id", status: "cancelled" };
  booking = { id: "booking-id", status: "cancelled", platform_fee: 0 };
  const result = await completeCapturedBookingPayment(payment, captured);
  assert.equal(result.refundStatus, "refund_pending");
  assert.equal(refundCalls.length, 1);
  assert.equal(assignmentCalls, 0);
  assert.equal(earningCalls, 0);
});
