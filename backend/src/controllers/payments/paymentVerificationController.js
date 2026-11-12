import { supabaseAdmin, getRazorpay } from "./paymentDependencies.js";
import { customerIdForUser } from "./paymentDependencies.js";
import { validateCapturedPayment } from "../../services/payments/paymentValidation.js";
import { completeCapturedBookingPayment } from "../../services/payments/completeCapturedBookingPayment.js";
import crypto from "node:crypto";

export async function verifyPayment(req, res) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body || {};

    if (typeof razorpay_order_id !== "string" || !/^order_[A-Za-z0-9]{6,64}$/.test(razorpay_order_id)
      || typeof razorpay_payment_id !== "string" || !/^pay_[A-Za-z0-9]{6,64}$/.test(razorpay_payment_id)
      || typeof razorpay_signature !== "string" || !/^[a-f0-9]{64}$/i.test(razorpay_signature)) {
      return res.status(400).json({ success: false, message: "Payment verification details are missing." });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw Object.assign(new Error("Online payments are not configured."), { status: 503 });

    const customerId = await customerIdForUser(req.user.id);
    const { data: payment, error: paymentError } = await supabaseAdmin.from("payments")
      .select(`
        *,
        booking:bookings (
          id,
          customer_id,
          status,
          platform_fee
        )
      `)
      .eq("provider_order_id", razorpay_order_id)
      .maybeSingle();
    if (paymentError) throw paymentError;
    if (!payment) return res.status(404).json({ success: false, message: "Payment order not found." });
    if (payment.customer_id !== customerId) return res.status(403).json({ success: false, message: "Not authorized." });

    const expectedSignature = crypto.createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest();
    const suppliedSignature = Buffer.from(razorpay_signature, "hex");
    if (suppliedSignature.length !== expectedSignature.length
      || !crypto.timingSafeEqual(suppliedSignature, expectedSignature)) {
      return res.status(400).json({ success: false, message: "Invalid payment signature." });
    }

    const razorpay = getRazorpay();
    const captured = await razorpay.payments.fetch(razorpay_payment_id);
    const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);
    const orderPayments = await razorpay.orders.fetchPayments(razorpay_order_id);

    console.log("ORDER PAYMENT DETAILS", {
      count: orderPayments.count,
      payments: (orderPayments.items || []).map((item) => ({
        id: item.id,
        amount: item.amount,
        status: item.status,
        order_id: item.order_id,
        method: item.method,
        fee: item.fee,
        tax: item.tax,
        amount_refunded: item.amount_refunded,
      })),
    });

    console.log("Razorpay payment reconciliation", {
      payment: {
        status: captured.status,
        amountPaise: captured.amount,
        currency: captured.currency,
        captured: captured.captured,
        feePaise: captured.fee,
        taxPaise: captured.tax,
        orderIdMatches: captured.order_id === razorpay_order_id,
      },
      order: {
        amountPaise: razorpayOrder.amount,
        amountPaidPaise: razorpayOrder.amount_paid,
        amountDuePaise: razorpayOrder.amount_due,
        currency: razorpayOrder.currency,
        status: razorpayOrder.status,
        idMatches: razorpayOrder.id === razorpay_order_id,
      },
      database: {
        amountRupees: payment.amount,
        expectedAmountPaise: Math.round(Number(payment.amount) * 100),
        orderIdMatches: payment.provider_order_id === razorpay_order_id,
      },
    });

    validateCapturedPayment(captured, payment, razorpay_payment_id, razorpayOrder);

    const completion = await completeCapturedBookingPayment(payment, captured);
    if (completion.outcome === "cancelled") {
      return res.json({
        success: true,
        bookingId: completion.booking_id,
        status: "cancelled",
        paymentStatus: "paid",
        refundStatus: completion.refundStatus,
        message: "The booking was cancelled before payment capture. The captured payment is being returned to the original payment method.",
      });
    }

    return res.json({
      success: true,
      bookingId: completion.booking_id,
      status: completion.booking?.status || completion.status,
      paymentStatus: "paid",
      message: "Payment completed successfully. Your booking is awaiting washer assignment.",
    });
  } catch (error) {
    console.error("Payment verification failed", {
      name: typeof error.name === "string" ? error.name : "Error",
      code: typeof error.code === "string" ? error.code : undefined,
      status: Number.isInteger(error.status) ? error.status : undefined,
      message: typeof error.message === "string" ? error.message : undefined,
    });

    const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 500
      ? error.status
      : error.status === 503 ? 503 : 502;
    return res.status(status).json({
      success: false,
      message: error.status === 503
        ? error.message
        : "We could not confirm the payment yet. Check the booking status before retrying.",
    });
  }
}
