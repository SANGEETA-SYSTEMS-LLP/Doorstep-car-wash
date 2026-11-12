import { test, mock } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

const bookingId = "123e4567-e89b-42d3-a456-426614174000";
const orderId = "order_abcdef123456";
const paymentId = "pay_abcdef123456";
let fixtures;
let calls;
let orders;
let earnings;
let captured;

const db = {
  from(table) {
    const call = { table, steps: [] };
    calls.push(call);
    const query = {};
    for (const method of ["select", "eq", "in", "is", "maybeSingle", "single", "insert", "update", "or", "limit"]) {
      query[method] = (...args) => { call.steps.push([method, ...args]); return query; };
    }
    query.then = (resolve, reject) => {
      let data = fixtures[table]?.data ?? null;
      if (table === "payments" && call.steps.some(step => step[0] === "update" && step[1]?.provider_order_id)) {
        data = { id: "payment-row", status: "created", amount: 500, provider_order_id: orderId };
      }
      return Promise.resolve({ data, error: null }).then(resolve, reject);
    };
    return query;
  },
  async rpc(name, args) {
    calls.push({ rpc: name, args });
    if (name === "complete_booking_payment") {
      fixtures.bookings.data.status = "payment_completed";
      return { data: { success: true, outcome: "completed", booking_id: bookingId, status: "payment_completed" }, error: null };
    }
    if (name !== "reserve_razorpay_payment_order") throw new Error(`Unexpected RPC ${name}`);
    const booking = fixtures.bookings.data;
    if (args.p_booking_id !== booking.id) return { data: null, error: { code: "P0002", message: "Booking not found." } };
    const onlineEligible = ["pending", "customer_confirmed", "closed"].includes(booking.status);
    const codEligible = ["customer_confirmed", "closed"].includes(booking.status);
    if (booking.payment_method === "cod" ? !codEligible : !onlineEligible) {
      return { data: null, error: { code: "55000", message: "This booking is not eligible for online payment." } };
    }
    const payment = fixtures.payments.data || { id: "payment-row", status: "created", amount: booking.total_amount, provider_order_id: null };
    return { data: { booking, payment, created: !fixtures.payments.data }, error: null };
  },
};

mock.module("../src/config/supabase.js", { namedExports: { supabaseAdmin: db } });
const razorpay = {
  payments: { fetch: async () => captured },
  orders: { create: async () => { orders++; return { id: orderId, amount: 50000, currency: "INR" }; } },
};
mock.module("../src/config/razorpay.js", { namedExports: { getRazorpay: () => razorpay } });
mock.module("../src/services/booking/bookingAssignmentService.js", {
  namedExports: { assignWasherToBooking: async () => ({ assigned: false, requires_supervisor: true }) },
});
mock.module("../src/services/booking/cancellationRefundService.js", {
  namedExports: { refundLateCapturedBookingPayment: async () => ({ status: "refund_pending" }) },
});
mock.module("../src/services/finance/earningService.js", {
  namedExports: { createWasherEarning: async () => { earnings++; } },
});

const { createPaymentOrder, verifyPayment, razorpayWebhook } = await import("../src/controllers/payments/paymentController.js");
process.env.RAZORPAY_KEY_SECRET = "test-secret";
process.env.RAZORPAY_WEBHOOK_SECRET = "webhook-secret";

function reset() {
  calls = [];
  orders = 0;
  earnings = 0;
  fixtures = {
    customers: { data: { id: "customer-record" } },
    bookings: { data: { id: bookingId, customer_id: "customer-record", status: "pending", payment_method: "upi", total_amount: 500, booking_number: "CW-TEST", assigned_washer_id: null } },
    payments: { data: null },
  };
  captured = { id: paymentId, order_id: orderId, amount: 50000, currency: "INR", status: "captured", method: "card" };
}

async function run(handler, extra = {}) {
  let status = 200;
  let result;
  await handler({ user: { id: "user" }, params: { bookingId }, body: {}, ...extra }, {
    status(code) { status = code; return this; },
    json(data) { result = data; return this; },
    send(data) { result = data; return this; },
  });
  return { status, result };
}

const signature = () => crypto.createHmac("sha256", "test-secret").update(`${orderId}|${paymentId}`).digest("hex");

test("payment order amount comes from the database and reuses an existing order", async () => {
  reset();
  fixtures.payments = { data: { id: "payment-row", status: "created", amount: 500, provider_order_id: orderId } };
  const result = await run(createPaymentOrder, { body: { amount: 1 } });
  assert.equal(result.result.amount, 50000);
  assert.equal(result.result.orderId, orderId);
  assert.equal(orders, 0);
});

test("paid bookings cannot create another checkout order", async () => {
  reset();
  fixtures.payments = { data: { id: "payment-row", status: "paid", amount: 500, provider_order_id: orderId } };
  assert.equal((await run(createPaymentOrder)).status, 409);
  assert.equal(orders, 0);
});

test("a valid signature still requires a captured matching currency, amount, payment and order", async () => {
  for (const patch of [{ status: "authorized" }, { amount: 1 }, { currency: "USD" }, { order_id: "order_other123456" }, { id: "pay_other123456" }]) {
    reset();
    fixtures.payments = { data: { id: "payment-row", amount: 500, customer_id: "customer-record", provider_order_id: orderId, booking_id: bookingId } };
    captured = { ...captured, ...patch };
    const result = await run(verifyPayment, { body: { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature() } });
    assert.equal(result.status, 400);
    assert.equal(calls.some(call => call.rpc === "complete_booking_payment"), false);
  }
});

test("captured checkout uses the atomic completion RPC and preserves its booking status", async () => {
  reset();
  fixtures.payments = { data: { id: "payment-row", amount: 500, customer_id: "customer-record", provider_order_id: orderId, booking_id: bookingId } };
  const result = await run(verifyPayment, { body: { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature() } });
  assert.equal(result.status, 200);
  assert.equal(result.result.status, "payment_completed");
  assert.equal(result.result.paymentStatus, "paid");
  assert.ok(calls.some(call => call.rpc === "complete_booking_payment"));
  assert.equal(earnings, 0);
});

test("verification rejects another customer before fetching or completing payment", async () => {
  reset();
  fixtures.payments = { data: { customer_id: "other-customer" } };
  assert.equal((await run(verifyPayment, { body: { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature() } })).status, 403);
  assert.equal(calls.some(call => call.rpc === "complete_booking_payment"), false);
});

test("webhook rejects tampered signatures without database writes", async () => {
  reset();
  const result = await run(razorpayWebhook, { headers: { "x-razorpay-signature": "invalid" }, body: Buffer.from("{}") });
  assert.equal(result.status, 400);
  assert.equal(calls.length, 0);
});

test("captured-payment webhook uses the same atomic completion path", async () => {
  reset();
  fixtures.payments = { data: { id: "payment-row", amount: 500, customer_id: "customer-record", provider_order_id: orderId, booking_id: bookingId } };
  const body = Buffer.from(JSON.stringify({
    event: "payment.captured",
    payload: { payment: { entity: captured } },
  }));
  const webhookSignature = crypto.createHmac("sha256", "webhook-secret").update(body).digest("hex");
  const result = await run(razorpayWebhook, { headers: { "x-razorpay-signature": webhookSignature }, body });
  assert.equal(result.status, 200);
  assert.ok(calls.some(call => call.rpc === "complete_booking_payment"));
});

test("pay-after-service online checkout keeps COD eligibility separate", async () => {
  reset();
  fixtures.bookings.data.payment_method = "cod";
  assert.equal((await run(createPaymentOrder)).status, 400);
  assert.equal(orders, 0);
  fixtures.bookings.data.status = "customer_confirmed";
  fixtures.payments = { data: { id: "payment-row", status: "created", amount: 500, provider_order_id: orderId } };
  assert.equal((await run(createPaymentOrder)).status, 200);
  fixtures.bookings.data.status = "closed";
  assert.equal((await run(createPaymentOrder)).status, 200);
  fixtures.payments = { data: { id: "payment-row", status: "paid", amount: 500, provider_order_id: orderId } };
  assert.equal((await run(createPaymentOrder)).status, 409);
});
