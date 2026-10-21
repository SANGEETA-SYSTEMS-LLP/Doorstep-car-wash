import { supabaseAdmin } from "../../config/supabase.js";

export async function assignSupervisorWasher(req, res) {
  try {
    const { bookingId } = req.params;
    const { washerId } = req.body || {};

    if (!washerId) {
      return res.status(400).json({
        success: false,
        message: "Washer ID is required.",
      });
    }

    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const { data, error } = await supabaseAdmin.rpc(
      "supervisor_assign_washer",
      {
        p_booking_id: bookingId,
        p_washer_id: washerId,
        p_supervisor_id: req.user.id,
      }
    );

    if (error) {
      console.error("Supervisor washer assignment:", error);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Offer sent. Waiting for washer acceptance.",
      assignment: data,
    });
  } catch (error) {
    console.error("Assign supervisor washer:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to assign washer.",
    });
  }
}

