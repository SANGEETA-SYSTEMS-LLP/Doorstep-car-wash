import { supabaseAdmin, getRazorpay } from "./paymentDependencies.js";
import { customerIdForUser } from "./paymentDependencies.js";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function createPaymentOrder(
  req,
  res
) {
  try {
    const razorpay = getRazorpay();
    const { bookingId } =
      req.params;
    if (!uuidPattern.test(bookingId || "")) {
      return res.status(400).json({ message: "Invalid booking ID." });
    }
    const customerId = await customerIdForUser(req.user.id);

    // The SQL RPC locks the booking row and reserves one payment row in the
    // same transaction. Cancellation uses the same booking-first lock order.
    const { data: reservation, error: reservationError } = await supabaseAdmin.rpc("reserve_razorpay_payment_order", {
      p_booking_id: bookingId,
      p_customer_id: customerId,
    });
    if (reservationError) {
      if (["42883", "PGRST202"].includes(reservationError.code)) {
        return res.status(503).json({ message: "Payment checkout needs a database update. Apply backend/database/add_atomic_payment_order_reservation.sql, then retry." });
      }
      if (reservationError.code === "P0002") return res.status(404).json({ message: "Booking not found." });
      if (reservationError.code === "55000") {
        const message = reservationError.message || "This booking is not eligible for online payment.";
        const status = /payment window has expired/i.test(message) ? 410 : /cancelled/i.test(message) ? 409 : 400;
        return res.status(status).json({ message });
      }
      throw reservationError;
    }
    const booking = reservation?.booking;
    const totalAmount = Number(booking?.total_amount);
    const amountPaise = Math.round(totalAmount * 100);
    if (!booking?.id || !booking.booking_number || !Number.isFinite(totalAmount)
      || totalAmount <= 0 || !Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
      throw new Error("Payment reservation returned invalid booking details.");
    }
    const payment = reservation?.payment;
    if (!payment?.id) throw new Error("Payment reservation returned incomplete data.");
    if (payment.status === "paid") return res.status(409).json({ message: "This booking is already paid." });
    if (Number(payment.amount) !== totalAmount) return res.status(409).json({ message: "Existing payment amount needs reconciliation before checkout." });

    if (payment.provider_order_id) {
      const { data: currentBooking, error: currentBookingError } = await supabaseAdmin.from("bookings")
        .select("status").eq("id", booking.id).eq("customer_id", customerId).maybeSingle();
      if (currentBookingError) throw currentBookingError;
      if (!currentBooking || currentBooking.status === "cancelled") return res.status(409).json({ message: "This booking was cancelled before checkout could continue." });
      return res.json({ success: true, paymentId: payment.id, orderId: payment.provider_order_id, amount: amountPaise, currency: "INR", keyId: process.env.RAZORPAY_KEY_ID, bookingNumber: booking.booking_number });
    }
    if (!reservation.created) return res.status(409).json({ message: "Checkout is already being prepared for this booking. Retry shortly." });

    let order;
    try {
      order = await razorpay.orders.create({
        amount:
          amountPaise,

        currency:
          "INR",

        receipt:
          booking.booking_number,

        notes: {
          booking_id:
            booking.id,

          customer_id:
            booking.customer_id,
        },
      });
    } catch (providerError) {
      const { error: releaseError } = await supabaseAdmin.from("payments")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", payment.id).eq("status", "created").is("provider_order_id", null);
      if (releaseError) console.error("Payment reservation release failed:", { code: releaseError.code });
      throw providerError;
    }
    if (!/^order_[A-Za-z0-9]+$/.test(order?.id || "") || order.amount !== amountPaise || order.currency !== "INR") {
      await supabaseAdmin.from("payments").update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", payment.id).eq("status", "created").is("provider_order_id", null);
      throw new Error("Payment provider returned an invalid order response.");
    }

    const { data: updatedPayment, error: paymentError } = await supabaseAdmin.from("payments")
      .update({ provider_order_id: order.id, updated_at: new Date().toISOString() })
      .eq("id", payment.id).eq("status", "created")
      .select("id,status,amount,provider_order_id").maybeSingle();
    if (paymentError) throw paymentError;
    if (!updatedPayment?.provider_order_id) throw new Error("The provider order could not be attached to its reserved payment.");

    const { data: currentBooking, error: currentBookingError } = await supabaseAdmin.from("bookings")
      .select("status").eq("id", booking.id).eq("customer_id", customerId).maybeSingle();
    if (currentBookingError) throw currentBookingError;
    if (!currentBooking || currentBooking.status === "cancelled") return res.status(409).json({ message: "This booking was cancelled before checkout could continue." });

    return res.status(201).json({
      success: true,

      paymentId:
      updatedPayment.id,

      orderId:
        order.id,

      amount:
        order.amount,

      currency:
        order.currency,

      keyId:
        process.env.RAZORPAY_KEY_ID,

      bookingNumber:
        booking.booking_number,
    });
  } catch (error) {
    console.error("Create payment order failed", {
      name: typeof error.name === "string" ? error.name : "Error",
      code: typeof error.code === "string" ? error.code : undefined,
    });

    return res.status(error.status || 502).json({
      success: false,
      message: error.status === 503
        ? error.message
        : "Unable to create the payment right now. Please retry shortly.",
    });
  }
}

