import { supabaseAdmin, razorpay, createWasherEarning } from "./paymentDependencies.js";
import { customerIdForUser } from "./paymentDependencies.js";
import { validateCapturedPayment } from "../../services/payments/paymentValidation.js";
import crypto from "node:crypto";

export async function createPaymentOrder(
  req,
  res
) {
  try {
    const { bookingId } =
      req.params;
    const customerId = await customerIdForUser(req.user.id);

    const {
      data: booking,
      error: bookingError,
    } = await supabaseAdmin
      .from("bookings")
      .select(`
        id,
        booking_number,
        customer_id,
        status,
        total_amount,
        payment_method
      `)
      .eq("id", bookingId)
      .eq("customer_id", customerId)
      .maybeSingle();

    if (
      bookingError ||
      !booking
    ) {
      return res.status(404).json({
        message:
          "Booking not found.",
      });
    }

    const paymentEligible = booking.payment_method === "cod"
      ? ["customer_confirmed", "closed"].includes(booking.status)
      : ["pending", "customer_confirmed"].includes(booking.status);
    if (!paymentEligible) {
      return res.status(400).json({
        message:
          "This booking is not eligible for online payment.",
      });
    }

    /*
     * Critical:
     * Amount comes from database,
     * NOT req.body.
     */

    const amount =
      Number(
        booking.total_amount
      );

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return res.status(400).json({
        message:
          "Invalid booking amount.",
      });
    }

    const amountPaise =
      Math.round(
        amount * 100
      );

    const { data: existingPayment, error: existingError } = await supabaseAdmin.from("payments").select("id,status,amount,provider_order_id").eq("booking_id", booking.id).in("status", ["created", "paid"]).maybeSingle();
    if (existingError) throw existingError;
    if (existingPayment?.status === "paid") return res.status(409).json({ message: "This booking is already paid." });
    if (existingPayment) {
      if (Number(existingPayment.amount) !== amount || !existingPayment.provider_order_id) return res.status(409).json({ message: "Existing payment needs reconciliation before another order can be created." });
      return res.json({ success: true, paymentId: existingPayment.id, orderId: existingPayment.provider_order_id, amount: amountPaise, currency: "INR", keyId: process.env.RAZORPAY_KEY_ID, bookingNumber: booking.booking_number });
    }

    const order =
      await razorpay.orders.create({
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

    const {
      data: payment,
      error: paymentError,
    } = await supabaseAdmin
      .from("payments")
      .insert({
        booking_id:
          booking.id,

        customer_id:
          booking.customer_id,

        amount,

        payment_method:
          "online",

        status:
          "created",

        provider:
          "razorpay",

        provider_order_id:
          order.id,
      })
      .select("*")
      .single();

    if (paymentError) {
      if (paymentError.code === "23505") {
        const { data: winner, error: winnerError } = await supabaseAdmin.from("payments")
          .select("id,status,amount,provider_order_id")
          .eq("booking_id", booking.id)
          .in("status", ["created", "paid"])
          .maybeSingle();
        if (winnerError) throw winnerError;
        if (winner?.status === "paid") return res.status(409).json({ message: "This booking is already paid." });
        if (winner && Number(winner.amount) === amount && winner.provider_order_id) {
          return res.json({ success: true, paymentId: winner.id, orderId: winner.provider_order_id,
            amount: amountPaise, currency: "INR", keyId: process.env.RAZORPAY_KEY_ID,
            bookingNumber: booking.booking_number });
        }
        return res.status(409).json({ message: "Another checkout is being created for this booking. Retry shortly." });
      }
      throw paymentError;
    }

    return res.status(201).json({
      success: true,

      paymentId:
        payment.id,

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

    return res.status(502).json({
      success: false,
      message: "Unable to create the payment right now. Please retry shortly.",
    });
  }
}

