import { supabaseAdmin as db } from "../../config/supabase.js";
import { providerRequest } from "../finance/financeProvider.js";

export async function processCancellationRefund(cancellation) {
  if (!cancellation?.id || cancellation.status !== "refund_pending" || !cancellation.payment_id) return cancellation;
  const { data: payment, error: paymentError } = await db.from("payments")
    .select("provider_payment_id").eq("id", cancellation.payment_id).maybeSingle();
  if (paymentError) throw paymentError;
  if (!payment?.provider_payment_id) throw new Error("Paid payment provider reference is unavailable.");

  const refund = cancellation.provider_refund_id
    ? await providerRequest(`refunds/${encodeURIComponent(cancellation.provider_refund_id)}`)
    : await providerRequest(
      `payments/${encodeURIComponent(payment.provider_payment_id)}/refund`,
      {
        method: "POST",
        body: {
          amount: Number(cancellation.refund_amount_paise),
          notes: { booking_id: cancellation.booking_id, cancellation_id: cancellation.id },
        },
        idempotencyKey: cancellation.id,
      },
    );
  if (refund.payment_id !== payment.provider_payment_id
    || Number(refund.amount) !== Number(cancellation.refund_amount_paise)
    || refund.currency !== "INR" || !refund.id) {
    throw new Error("Payment provider refund response did not match the cancellation.");
  }

  const providerStatus = String(refund.status || "pending").toLowerCase();
  const status = providerStatus === "processed" ? "refund_processed"
    : providerStatus === "failed" ? "refund_failed" : "refund_pending";
  const { data: updated, error: updateError } = await db.from("booking_cancellations").update({
    provider_refund_id: refund.id,
    provider_status: providerStatus,
    status,
    updated_at: new Date().toISOString(),
  }).eq("id", cancellation.id).eq("status", "refund_pending").select("*").maybeSingle();
  if (updateError) throw updateError;
  if (!updated) {
    const { data: latest, error: latestError } = await db.from("booking_cancellations").select("*")
      .eq("id", cancellation.id).maybeSingle();
    if (latestError) throw latestError;
    return latest || cancellation;
  }
  return updated;
}

export async function reconcilePendingBookingCancellationRefunds() {
  const { data, error } = await db.from("booking_cancellations")
    .select("id,booking_id,payment_id,refund_amount_paise,provider_refund_id,status")
    .eq("status", "refund_pending").order("updated_at", { ascending: true }).limit(50);
  if (["42P01", "PGRST205"].includes(error?.code)) return;
  if (error) throw error;
  for (const cancellation of data || []) {
    try {
      await processCancellationRefund(cancellation);
    } catch (processError) {
      console.error("Cancellation refund reconciliation:", processError.message);
    }
  }
}
