import { supabaseAdmin, razorpay, createWasherEarning } from "./paymentDependencies.js";
import { validateCapturedPayment } from "../../services/payments/paymentValidation.js";
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