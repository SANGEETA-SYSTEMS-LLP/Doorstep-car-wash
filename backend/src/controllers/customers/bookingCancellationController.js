import { supabaseAdmin as db } from "../../config/supabase.js";
import { processCancellationRefund } from "../../services/booking/cancellationRefundService.js";

export async function cancelCustomerBooking(req, res, next) {
  try {
    const { data: cancellation, error } = await db.rpc("cancel_customer_booking", {
      p_booking_id: req.params.bookingId,
      p_customer_user_id: req.user.id,
    });
    if (error) {
      if (["42883", "42P01", "PGRST202"].includes(error.code)) {
        return res.status(503).json({ message: "Booking cancellation needs a database update. Apply backend/database/add_customer_booking_cancellation_refunds.sql, then retry." });
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
