import { supabaseAdmin } from "../../config/supabase.js";
import { assignWasherToBooking } from "../booking/bookingAssignmentService.js";
import { refundLateCapturedBookingPayment } from "../booking/cancellationRefundService.js";
import { createWasherEarning } from "../finance/earningService.js";

function databaseUpdateRequired(error) {
  return ["42883", "PGRST202"].includes(error?.code);
}

/** Persist a validated capture atomically, then run retryable post-payment work. */
export async function completeCapturedBookingPayment(payment, captured) {
  const { data: completion, error } = await supabaseAdmin.rpc("complete_booking_payment", {
    p_payment_id: payment.id,
    p_provider_payment_id: captured.id,
    p_provider_method: typeof captured.method === "string" ? captured.method : null,
  });

  if (error) {
    if (databaseUpdateRequired(error)) {
      throw Object.assign(
        new Error("Payment completion needs a database update. Apply supabase/migrations/20261016150000_carwash_payment_and_supervisor_assignment.sql, then retry."),
        { status: 503, cause: error },
      );
    }
    throw error;
  }
  if (!completion?.success || !completion.booking_id) {
    throw new Error("Payment completion returned an invalid result.");
  }

  if (completion.outcome === "cancelled") {
    let cancellation = null;
    let refundNeedsRetry = false;
    try {
      const { data: booking, error: bookingError } = await supabaseAdmin.from("bookings")
        .select("id,status,platform_fee")
        .eq("id", completion.booking_id)
        .maybeSingle();
      if (bookingError) throw bookingError;
      if (!booking) throw new Error("Cancelled booking not found after payment capture.");
      cancellation = await refundLateCapturedBookingPayment({
        ...payment,
        provider_payment_id: captured.id,
        amount: Number(captured.amount) / 100,
      }, booking);
    } catch (refundError) {
      refundNeedsRetry = true;
      // The cancellation refund reconciler retries pending refunds. The
      // capture is already committed, so do not tell the customer it failed.
      console.error("Late captured booking refund needs reconciliation:", {
        bookingId: completion.booking_id,
        name: typeof refundError.name === "string" ? refundError.name : "Error",
        code: typeof refundError.code === "string" ? refundError.code : undefined,
      });
      const { data: latestCancellation } = await supabaseAdmin.from("booking_cancellations")
        .select("status")
        .eq("booking_id", completion.booking_id)
        .maybeSingle();
      cancellation = latestCancellation;
    }

    return {
      ...completion,
      refundStatus: cancellation?.status || "refund_pending",
      postPaymentError: refundNeedsRetry,
    };
  }

  // Payment and booking are already committed. Retryable downstream work must
  // not turn a captured payment into a failed response to the customer.
  try {
    await assignWasherToBooking(completion.booking_id);
    const { data: booking, error: bookingError } = await supabaseAdmin.from("bookings")
      .select("id,status,assigned_washer_id")
      .eq("id", completion.booking_id)
      .maybeSingle();
    if (bookingError) throw bookingError;
    if (!booking) throw new Error("Booking not found after payment completion.");
    if (booking.assigned_washer_id) await createWasherEarning(booking.id);
    return { ...completion, status: booking.status, booking };
  } catch (postPaymentError) {
    console.error("Post-payment booking work needs reconciliation:", {
      bookingId: completion.booking_id,
      name: typeof postPaymentError.name === "string" ? postPaymentError.name : "Error",
      code: typeof postPaymentError.code === "string" ? postPaymentError.code : undefined,
    });
    return { ...completion, booking: null, postPaymentError: true };
  }
}
