import { supabaseAdmin, createWasherEarning } from "./paymentDependencies.js";
import { validateCapturedPayment } from "../../services/payments/paymentValidation.js";
import { assignWasherToBooking } from "../../services/booking/bookingAssignmentService.js";
import { refundLateCapturedBookingPayment } from "../../services/booking/cancellationRefundService.js";
import crypto from "node:crypto";

export async function razorpayWebhook(
  req,
  res
) {
  try {
    const signature =
      req.headers[
        "x-razorpay-signature"
      ];

    if (typeof signature !== "string" || !/^[a-f0-9]{64}$/i.test(signature)) {
      return res.status(400).send(
        "Invalid signature"
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

    if (["refund.processed", "refund.failed"].includes(event.event)) {
      const refund = event.payload?.refund?.entity;
      if (refund?.id && refund?.payment_id && refund?.notes?.cancellation_id) {
        const { data: cancellation, error: cancellationError } = await supabaseAdmin
          .from("booking_cancellations").select("id,payment_id,refund_amount_paise")
          .eq("id", refund.notes.cancellation_id).maybeSingle();
        if (cancellationError) throw cancellationError;
        if (cancellation) {
          const { data: payment, error: paymentError } = await supabaseAdmin.from("payments")
            .select("provider_payment_id").eq("id", cancellation.payment_id).maybeSingle();
          if (paymentError) throw paymentError;
          if (!payment || payment.provider_payment_id !== refund.payment_id
            || Number(refund.amount) !== Number(cancellation.refund_amount_paise)
            || refund.currency !== "INR") {
            throw new Error("Refund webhook does not match the saved cancellation.");
          }
          const status = event.event === "refund.processed" ? "refund_processed" : "refund_failed";
          const { error: updateError } = await supabaseAdmin.from("booking_cancellations").update({
            provider_refund_id: refund.id,
            provider_status: refund.status || event.event.slice("refund.".length),
            status,
            updated_at: new Date().toISOString(),
          }).eq("id", cancellation.id);
          if (updateError) throw updateError;
        }
      }
    }

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

                provider_method:
                  typeof entity.method === "string" ? entity.method : null,

                paid_at: now,

                updated_at: now,
              })
              .eq("id", payment.id);

            if (paymentUpdateError) {
              throw paymentUpdateError;
            }
          }

          const { data: currentBooking, error: currentBookingError } = await supabaseAdmin.from("bookings")
            .select("id,status,platform_fee")
            .eq("id", payment.booking_id)
            .maybeSingle();
          if (currentBookingError) throw currentBookingError;
          if (!currentBooking) throw new Error("Booking not found after payment capture.");
          if (currentBooking.status === "cancelled") {
            await refundLateCapturedBookingPayment({ ...payment, provider_payment_id: entity.id }, currentBooking);
            return res.status(200).send("OK");
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

          const { error: reviveExpiredBookingError } = await supabaseAdmin.from("bookings")
            .update({ status: "pending", updated_at: now })
            .eq("id", payment.booking_id)
            .eq("status", "expired");
          if (reviveExpiredBookingError) throw reviveExpiredBookingError;

          await createWasherEarning(
            payment.booking_id
          );
          await assignWasherToBooking(payment.booking_id);
        }
      }
    }

    return res.status(200).send(
      "OK"
    );
  } catch (error) {
    console.error("Razorpay webhook processing failed", {
      name: typeof error.name === "string" ? error.name : "Error",
      code: typeof error.code === "string" ? error.code : undefined,
    });

    return res.status(500).send(
      "Webhook processing failed"
    );
  }
}
