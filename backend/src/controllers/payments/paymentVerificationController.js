import { supabaseAdmin, getRazorpay, createWasherEarning } from "./paymentDependencies.js";
import { customerIdForUser } from "./paymentDependencies.js";
import { validateCapturedPayment } from "../../services/payments/paymentValidation.js";
import { assignWasherToBooking } from "../../services/booking/bookingAssignmentService.js";
import { refundLateCapturedBookingPayment } from "../../services/booking/cancellationRefundService.js";
import crypto from "node:crypto";

export async function verifyPayment(
  req,
  res
) {
  try {
    const razorpay = getRazorpay();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;
    const customerId = await customerIdForUser(req.user.id);

    if (typeof razorpay_order_id !== "string" || !/^order_[A-Za-z0-9]{6,64}$/.test(razorpay_order_id) ||
      typeof razorpay_payment_id !== "string" || !/^pay_[A-Za-z0-9]{6,64}$/.test(razorpay_payment_id) ||
      typeof razorpay_signature !== "string" || !/^[a-f0-9]{64}$/i.test(razorpay_signature)) {
      return res.status(400).json({
        message:
          "Payment verification details are missing.",
      });
    }

    const {
      data: payment,
      error: paymentError,
    } = await supabaseAdmin
      .from("payments")
      .select(`
        *,
        booking:bookings (
          id,
          customer_id,
          status,
          platform_fee
        )
      `)
      .eq(
        "provider_order_id",
        razorpay_order_id
      )
      .maybeSingle();

    if (
      paymentError ||
      !payment
    ) {
      return res.status(404).json({
        message:
          "Payment order not found.",
      });
    }

    if (payment.customer_id !== customerId) {
      return res.status(403).json({
        message:
          "Not authorized.",
      });
    }

    const body =
      `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          process.env
            .RAZORPAY_KEY_SECRET
        )
        .update(body)
        .digest("hex");

    const supplied =
      Buffer.from(
        razorpay_signature,
        "utf8"
      );

    const expected =
      Buffer.from(
        expectedSignature,
        "utf8"
      );

    const valid =
      supplied.length ===
        expected.length &&
      crypto.timingSafeEqual(
        supplied,
        expected
      );

    if (!valid) {
      return res.status(400).json({
        message:
          "Invalid payment signature.",
      });
    }

    const captured = await razorpay.payments.fetch(razorpay_payment_id);
    validateCapturedPayment(captured, payment);

    const now =
      new Date().toISOString();

    const { data: updatedPayment, error: updatePaymentError } = await supabaseAdmin
      .from("payments")
      .update({
        status:
          "paid",

        provider_payment_id:
          razorpay_payment_id,

        provider_method:
          typeof captured.method === "string" ? captured.method : null,

        paid_at:
          now,

        updated_at:
          now,
      })
      .eq("id", payment.id)
      .in("status", ["created", "failed", "paid"])
      .or(`provider_payment_id.is.null,provider_payment_id.eq.${razorpay_payment_id}`)
      .select("id,status,provider_payment_id")
      .maybeSingle();

    if (updatePaymentError) {
      throw updatePaymentError;
    }

    // A previously paid row is idempotent only for the same provider payment.
    // Never replace the provider payment ID attached to a successful order.
    const { data: latestPayment, error: latestPaymentError } = await supabaseAdmin.from("payments")
      .select("id,status,provider_payment_id")
      .eq("id", payment.id)
      .maybeSingle();
    if (latestPaymentError) throw latestPaymentError;
    if (!updatedPayment && (latestPayment?.status !== "paid" || latestPayment.provider_payment_id !== razorpay_payment_id)) {
      return res.status(409).json({ success: false, message: "This order has already been completed with a different payment. Contact support." });
    }

    const { data: currentBooking, error: currentBookingError } = await supabaseAdmin.from("bookings")
      .select("id,status,platform_fee")
      .eq("id", payment.booking_id)
      .maybeSingle();
    if (currentBookingError) throw currentBookingError;
    if (!currentBooking) throw new Error("Booking not found after payment capture.");
    if (currentBooking.status === "cancelled") {
      const cancellation = await refundLateCapturedBookingPayment({ ...payment, provider_payment_id: razorpay_payment_id, amount: captured.amount / 100 }, currentBooking);
      return res.json({
        success: true,
        bookingId: payment.booking_id,
        status: "cancelled",
        refundStatus: cancellation?.status || "not_applicable",
        message: "This booking was cancelled. Any captured payment is being returned to the original payment method, excluding the platform fee.",
      });
    }

    const { error: reviveExpiredBookingError } = await supabaseAdmin.from("bookings")
      .update({ status: "pending", updated_at: now })
      .eq("id", payment.booking_id)
      .eq("status", "expired");
    if (reviveExpiredBookingError) throw reviveExpiredBookingError;

    await createWasherEarning(
      payment.booking_id
    );
    await assignWasherToBooking(payment.booking_id);

    return res.json({
      success: true,

      bookingId:
        payment.booking_id,

      status:
        payment.booking?.status || "pending",
    });
  } catch (error) {
    console.error("Payment verification failed", {
      name: typeof error.name === "string" ? error.name : "Error",
      code: typeof error.code === "string" ? error.code : undefined,
    });

    return res.status(error.status || 502).json({
      success: false,
      message: error.status === 503
        ? error.message
        : "We could not confirm the payment yet. Check the booking status before retrying.",
    });
  }
}
