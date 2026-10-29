import { supabaseAdmin as db } from "../../config/supabase.js";
import { processCancellationRefund } from "../../services/booking/cancellationRefundService.js";
import { processUnpaidBookingExpiry } from "../../services/booking/unpaidBookingExpiryService.js";

function expiredBookingResponse(res) {
  return res.json({
    success: true,
    bookingStatus: "expired",
    cancellationStatus: "not_applicable",
    refundAmount: 0,
    platformFeeRetained: 0,
    refundStatus: "not_applicable",
    message: "This booking expired because payment was not completed within 30 minutes. It has been removed from your active booking history; no refund was due.",
  });
}

export async function cancelCustomerBooking(req, res, next) {
  try {
    const { data: customer, error: customerError } = await db.from("customers")
      .select("id").eq("user_id", req.user.id).maybeSingle();
    if (customerError) throw customerError;
    if (customer?.id) {
      try {
        const expiredIds = await processUnpaidBookingExpiry(new Date(), customer.id);
        if (expiredIds?.includes(req.params.bookingId)) {
          return expiredBookingResponse(res);
        }
      } catch (expiryError) {
        console.error("Booking expiry before cancellation:", {
          code: typeof expiryError.code === "string" ? expiryError.code : undefined,
          name: typeof expiryError.name === "string" ? expiryError.name : "Error",
        });
      }
    }

    const { data: cancellation, error } = await db.rpc("cancel_customer_booking", {
      p_booking_id: req.params.bookingId,
      p_customer_user_id: req.user.id,
    });
    if (error) {
      if (["42883", "42P01", "PGRST202"].includes(error.code)) {
        return res.status(503).json({ message: "Booking cancellation needs a database update. Apply backend/database/add_customer_booking_cancellation_refunds.sql, then retry." });
      }
      if (error.code === "55000") {
        const { data: booking, error: bookingError } = await db.from("bookings")
          .select("id,status").eq("id", req.params.bookingId).eq("customer_id", customer?.id).maybeSingle();
        if (!bookingError && booking?.status === "expired") {
          const { data: paidPayment, error: paymentError } = await db.from("payments")
            .select("id").eq("booking_id", booking.id).eq("status", "paid").limit(1).maybeSingle();
          if (!paymentError && !paidPayment) return expiredBookingResponse(res);
        }
      }
      const status = error.code === "P0002" ? 404 : error.code === "55000" ? 409 : 400;
      return res.status(status).json({ message: error.message || "Unable to cancel this booking." });
    }

    const refundAmount = Number(cancellation.refund_amount_paise || 0) / 100;
    const platformFeeRetained = Number(cancellation.platform_fee_paise || 0) / 100;
    const latePaymentWatch = cancellation.provider_status === "awaiting_payment";
    if (cancellation.status === "refund_pending" && cancellation.payment_id) {
      try {
        Object.assign(cancellation, await processCancellationRefund(cancellation));
      } catch (refundError) {
        console.error("Customer cancellation refund pending:", refundError.message);
        return res.status(202).json({
          success: true,
          bookingStatus: "cancelled",
          cancellationStatus: cancellation.status,
          refundAmount,
          platformFeeRetained,
          refundStatus: "pending",
          message: "Booking cancelled. Your refund is pending provider confirmation; refresh this page later.",
        });
      }
    }

    return res.json({
      success: true,
      bookingStatus: "cancelled",
      cancellationStatus: cancellation.status,
      refundAmount,
      platformFeeRetained,
      refundStatus: cancellation.status === "refund_processed" ? "processed"
        : cancellation.status === "refund_failed" ? "failed"
          : cancellation.status === "refund_pending" ? "pending" : "not_applicable",
      message: cancellation.status === "refund_processed"
        ? "Booking cancelled and refund initiated. Your bank may take several business days to show the credit."
        : cancellation.status === "refund_failed"
          ? "Booking cancelled, but the refund could not be confirmed. Contact support with your booking reference."
          : cancellation.status === "refund_pending"
            ? "Booking cancelled. Your refund is pending provider confirmation."
            : latePaymentWatch
              ? "Booking cancelled. If the payment that was processing completes, it will be refunded automatically to the original payment method, excluding the platform fee."
            : "Booking cancelled. No online payment refund was due.",
    });
  } catch (error) {
    next(error);
  }
}
