import { supabaseAdmin } from "../../config/supabase.js";
import { getCustomerBooking, getBookingWasher, closeBookingAndReleaseWasher } from "./reviewAccess.js";

export async function skipReview(
  req,
  res
) {
  try {
    const booking =
      await getCustomerBooking(
        req.params.bookingId,
        req.user.id
      );

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found.",
      });
    }

    if (
      !["customer_confirmed", "payment_completed", "closed"].includes(booking.status)
    ) {
      return res.status(400).json({
        message:
          "Confirm the completed service before closing this booking.",
      });
    }

    const washer =
      await getBookingWasher(booking);

    await closeBookingAndReleaseWasher(
      booking,
      washer
    );

    return res.json({
      success: true,
      status: "closed",
    });
  } catch (error) {
    console.error(
      "Skip review and close booking:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Unable to close booking.",
    });
  }
}