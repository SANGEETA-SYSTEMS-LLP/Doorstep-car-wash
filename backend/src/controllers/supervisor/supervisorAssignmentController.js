import { supabaseAdmin } from "../../config/supabase.js";
import { isWithinSupervisorArea } from "../../services/supervisor/supervisorServiceArea.js";

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

    if (req.profile?.role === "supervisor") {
      const [{ data: booking, error: bookingError }, { data: washer, error: washerError }] = await Promise.all([
        supabaseAdmin.from("bookings").select("id,latitude,longitude").eq("id", bookingId).maybeSingle(),
        supabaseAdmin.from("washers").select("id,supervisor_id").eq("id", washerId).maybeSingle(),
      ]);
      if (bookingError) throw bookingError;
      if (washerError) throw washerError;
      if (!booking || !isWithinSupervisorArea(booking, req.supervisorArea)) {
        return res.status(404).json({ success: false, message: "Booking not found in your service area." });
      }
      if (!washer || washer.supervisor_id !== req.user.id) {
        return res.status(403).json({ success: false, message: "Choose a washer linked to your supervisor account." });
      }
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

