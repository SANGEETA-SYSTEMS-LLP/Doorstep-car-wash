import { validateCapturedPayment } from "../services/paymentValidation.js";
import crypto from "crypto";

import {
  supabaseAdmin,
} from "../config/supabase.js";

import {
  razorpay,
} from "../config/razorpay.js";

import {
  createWasherEarning,
} from "../services/earningService.js";

async function customerIdForUser(userId) {
  const { data, error } = await supabaseAdmin
    .from("customers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Customer profile not found.");
  return data.id;
}

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

    if (
      ![
        "pending",
        "customer_confirmed",
      ].includes(booking.status) ||
      booking.payment_method === "cod"
    ) {
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
    console.error(
      "Create payment order:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Unable to create payment.",
    });
  }
}

export async function verifyPayment(
  req,
  res
) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;
    const customerId = await customerIdForUser(req.user.id);

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
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
          status
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

    const {
      error: updatePaymentError,
    } = await supabaseAdmin
      .from("payments")
      .update({
        status:
          "paid",

        provider_payment_id:
          razorpay_payment_id,

        provider_signature:
          razorpay_signature,

        paid_at:
          now,

        updated_at:
          now,
      })
      .eq("id", payment.id);

    if (updatePaymentError) {
      throw updatePaymentError;
    }

    await createWasherEarning(
      payment.booking_id
    );

    return res.json({
      success: true,

      bookingId:
        payment.booking_id,

      status:
        payment.booking?.status || "pending",
    });
  } catch (error) {
    console.error(
      "Verify payment:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message,
    });
  }
}
export async function recordCodPayment(
  req,
  res
) {
  try {
    const { bookingId } =
      req.params;
    const { data: washer, error: washerError } = await supabaseAdmin
      .from("washers")
      .select("id")
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (washerError) throw washerError;
    if (!washer) return res.status(403).json({ message: "Washer profile not found." });

    const {
      data: booking,
      error,
    } = await supabaseAdmin
      .from("bookings")
      .select(`
        id,
        customer_id,
        assigned_washer_id,
        total_amount,
        payment_method,
        status
      `)
      .eq("id", bookingId)
      .eq("assigned_washer_id", washer.id)
      .maybeSingle();

    if (
      error ||
      !booking
    ) {
      return res.status(404).json({
        message:
          "Booking not found.",
      });
    }

    if (
      booking.payment_method !==
      "cod"
    ) {
      return res.status(400).json({
        message:
          "Booking is not COD.",
      });
    }

    if (
      booking.status !==
      "completed"
    ) {
      return res.status(400).json({
        message:
          "Service must be validated before recording payment.",
      });
    }

    const { data: payment, error: paymentError } = await supabaseAdmin.rpc("record_cod_payment_once", { p_booking_id: booking.id, p_washer_id: washer.id });
    if (paymentError) throw paymentError;

    await createWasherEarning(
      booking.id
    );

    return res.json({
      success: true,
      payment,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error.message,
    });
  }
}

export async function razorpayWebhook(
  req,
  res
) {
  try {
    const signature =
      req.headers[
        "x-razorpay-signature"
      ];

    if (!signature) {
      return res.status(400).send(
        "Missing signature"
      );
    }

    const webhookSecret =
      process.env
        .RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error(
        "Missing Razorpay webhook configuration."
      );
    }

    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).send(
        "Invalid request body"
      );
    }

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          webhookSecret
        )
        .update(req.body)
        .digest("hex");

    const supplied =
      Buffer.from(
        signature,
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
      return res.status(400).send(
        "Invalid signature"
      );
    }

    const event =
      JSON.parse(
        req.body.toString("utf8")
      );

    if (
      event.event ===
      "payment.captured"
    ) {
      const entity =
        event.payload
          ?.payment
          ?.entity;

      if (entity?.order_id) {
        const now =
          new Date().toISOString();

        const {
          data: payment,
          error: paymentLookupError,
        } = await supabaseAdmin
          .from("payments")
          .select("*")
          .eq(
            "provider_order_id",
            entity.order_id
          )
          .maybeSingle();

        if (paymentLookupError) {
          throw paymentLookupError;
        }

        if (payment) {
          validateCapturedPayment(entity, payment);
          if (payment.status !== "paid") {
            const {
              error: paymentUpdateError,
            } = await supabaseAdmin
              .from("payments")
              .update({
                status: "paid",

                provider_payment_id:
                  entity.id,

                paid_at: now,

                updated_at: now,
              })
              .eq("id", payment.id);

            if (paymentUpdateError) {
              throw paymentUpdateError;
            }
          }

          const {
            error: bookingUpdateError,
          } = await supabaseAdmin
            .from("bookings")
            .update({
              status:
                "payment_completed",

              updated_at: now,
            })
            .eq(
              "id",
              payment.booking_id
            )
            .eq(
              "status",
              "customer_confirmed"
            );

          if (bookingUpdateError) {
            throw bookingUpdateError;
          }

          await createWasherEarning(
            payment.booking_id
          );
        }
      }
    }

    return res.status(200).send(
      "OK"
    );
  } catch (error) {
    console.error(
      "Razorpay webhook:",
      error
    );

    return res.status(500).send(
      "Webhook processing failed"
    );
  }
}