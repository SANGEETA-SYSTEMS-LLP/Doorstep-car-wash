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
      const { data: booking, error: bookingError } = await supabaseAdmin.from("bookings")
        .select("id,latitude,longitude").eq("id", bookingId).maybeSingle();
      if (bookingError) throw bookingError;
      if (!booking || !isWithinSupervisorArea(booking, req.supervisorArea)) {
        return res.status(404).json({ success: false, message: "Booking not found in your service area." });
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
      const errorMessage = error.message || "";
      if (/record\s+"?w"?\s+has no field\s+"?service_radius_km"?/i.test(errorMessage)) {
        return res.status(503).json({
          success: false,
          message: "The Supabase assignment function is outdated. Apply migration 20261112140000_fix_supervisor_assignment_eligibility.sql to the database used by the backend, then retry.",
        });
      }
      const timedOut = [502, 503, 504].includes(error.status)
        || /upstream request timeout|statement timeout|timed? out/i.test(errorMessage);
      const offerAlreadyPending = /offer is already waiting/i.test(errorMessage);
      if (timedOut || offerAlreadyPending) {
        // PostgREST can time out after the database committed the offer but
        // before its response reached the API. Resolve that ambiguous result
        // from the assignment row so the UI does not report a false failure.
        const { data: pendingOffer, error: lookupError } = await supabaseAdmin
          .from("booking_assignments")
          .select("id,booking_id,washer_id,status,offered_at,expires_at,attempt_number")
          .eq("booking_id", bookingId)
          .eq("washer_id", washerId)
          .eq("status", "pending")
          .gt("expires_at", new Date().toISOString())
          .maybeSingle();
        if (lookupError) throw lookupError;
        if (pendingOffer) {
          return res.status(200).json({
            success: true,
            message: "Offer sent. Waiting for washer acceptance.",
            assignment: pendingOffer,
          });
        }
        return res.status(timedOut ? 503 : 409).json({
          success: false,
          message: timedOut
            ? "The assignment service took too long to respond. Refresh the job and check for an active offer before retrying."
            : errorMessage,
        });
      }
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

