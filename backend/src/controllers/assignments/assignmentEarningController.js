import { supabaseAdmin } from "../../config/supabase.js";
import { assignWasherToBooking, rejectAssignmentAndRetry } from "../../services/booking/bookingAssignmentService.js";
import { createWasherEarning } from "../../services/finance/earningService.js";

export async function calculateAcceptedAssignmentEarning(
  req,
  res
) {
  try {
    const { assignmentId } =
      req.params;

    const {
      data: assignment,
      error: assignmentError,
    } = await supabaseAdmin
      .from("booking_assignments")
      .select("id, booking_id, washer_id")
      .eq("id", assignmentId)
      .maybeSingle();

    if (assignmentError) {
      throw assignmentError;
    }

    if (!assignment) {
      return res.status(404).json({
        message: "Assignment not found.",
      });
    }

    const {
      data: washer,
      error: washerError,
    } = await supabaseAdmin
      .from("washers")
      .select("id, user_id")
      .eq("id", assignment.washer_id)
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (washerError) {
      throw washerError;
    }

    if (!washer) {
      return res.status(403).json({
        message: "Not authorized for this assignment.",
      });
    }

    const {
      data: booking,
      error: bookingError,
    } = await supabaseAdmin
      .from("bookings")
      .select("id, assigned_washer_id")
      .eq("id", assignment.booking_id)
      .maybeSingle();

    if (bookingError) {
      throw bookingError;
    }

    if (
      !booking ||
      booking.assigned_washer_id !== washer.id
    ) {
      return res.status(409).json({
        message: "Assignment has not been accepted yet.",
      });
    }

    const earning =
      await createWasherEarning(
        booking.id
      );

    return res.json({
      success: true,
      earning,
    });
  } catch (error) {
    console.error(
      "Calculate accepted assignment earning:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Unable to calculate washer earning.",
    });
  }
}
