import { validateServiceCompletion } from "../../services/operations/serviceValidationService.js";
import { isWithinSupervisorArea } from "../../services/supervisor/supervisorServiceArea.js";
import { supabaseAdmin } from "../../config/supabase.js";

export async function validateService(req, res) {
  try {
    if (req.profile?.role === "supervisor") {
      const { data: booking, error } = await supabaseAdmin.from("bookings")
        .select("id,latitude,longitude").eq("id", req.params.bookingId).maybeSingle();
      if (error) throw error;
      if (!booking || !isWithinSupervisorArea(booking, req.supervisorArea)) {
        return res.status(404).json({ success: false, message: "Booking not found in your service area." });
      }
    }
    const validatedBooking = await validateServiceCompletion({
      bookingId: req.params.bookingId,
      userId: req.user.id,
      role: req.profile.role,
    });

    return res.json({ success: true, booking: validatedBooking });
  } catch (error) {
    console.error("Validate service completion:", error);
    return res.status(error.status || 400).json({
      success: false,
      message: error.message || "Unable to validate service completion.",
    });
  }
}
