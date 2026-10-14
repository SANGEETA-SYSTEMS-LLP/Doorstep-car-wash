import {
  supabaseAdmin,
} from "../config/supabase.js";

import {
  assignWasherToBooking,
  rejectAssignmentAndRetry,
} from "../services/bookingAssignmentService.js";

import {
  createWasherEarning,
} from "../services/earningService.js";

export async function startAssignment(
  req,
  res
) {
  try {
    const {
      bookingId,
    } = req.params;

    /*
     * Verify booking belongs to
     * authenticated customer.
     */

    const {
      data: booking,
      error,
    } = await supabaseAdmin
      .from("bookings")
      .select(
        "id, customer_id, status, payment_method, total_amount"
      )
      .eq("id", bookingId)
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

    const { data: customer, error: customerError } = await supabaseAdmin
      .from("customers").select("id").eq("user_id", req.user.id).maybeSingle();
    if (customerError) throw customerError;
    if (!customer || booking.customer_id !== customer.id) {
      return res.status(403).json({
        message:
          "You cannot assign this booking.",
      });
    }

    if (booking.payment_method !== "cod") {
      const {data:paid,error:paidError}=await supabaseAdmin.from("payments").select("id,amount").eq("booking_id",booking.id).eq("status","paid").maybeSingle();
      if(paidError)throw paidError;
      if(!paid || Number(paid.amount)<Number(booking.total_amount))return res.status(409).json({message:"Complete online payment before requesting a washer."});
    }
    const result =
      await assignWasherToBooking(
        booking.id
      );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error(
      "Start assignment:",
      error
    );

    return res.status(400).json({
      success: false,

      message:
        error.message ||
        "Unable to find washer.",
    });
  }
}

export async function rejectAssignment(req, res) {
  try {
    const { assignmentId } = req.params;
    const { reason } = req.body || {};

    const result = await rejectAssignmentAndRetry({
      assignmentId,
      washerUserId: req.user.id,
      reason: reason || null,
    });

    return res.json({
      success: true,
      nextAssignment: result,
    });
  } catch (error) {
    console.error("Reject assignment:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

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
