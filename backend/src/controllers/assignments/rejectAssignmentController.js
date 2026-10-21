import { supabaseAdmin } from "../../config/supabase.js";
import { assignWasherToBooking, rejectAssignmentAndRetry } from "../../services/booking/bookingAssignmentService.js";
import { createWasherEarning } from "../../services/finance/earningService.js";

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

