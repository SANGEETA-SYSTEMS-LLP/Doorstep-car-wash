import { supabaseAdmin } from "../../../config/supabase.js";
import { getAssignedBooking } from "./washerJobAccess.js";

export async function completeService(req, res) {
  try {
    const { bookingId } = req.params;
    const booking = await getAssignedBooking(bookingId, req.user.id);

    if (booking.status !== "service_started") {
      return res.status(400).json({
        message: "Service is not currently in progress.",
      });
    }

    const { data: checklist, error: checklistError } = await supabaseAdmin
      .from("booking_service_checklist")
      .select("id, completed")
      .eq("booking_id", bookingId);

    if (checklistError) throw checklistError;
    if (!checklist?.length) {
      return res.status(400).json({
        message: "Service checklist has not been initialized.",
      });
    }
    if (checklist.some((item) => !item.completed)) {
      return res.status(400).json({
        message: "Complete all checklist items first.",
      });
    }

    const { data: photos, error: photoError } = await supabaseAdmin
      .from("booking_service_photos")
      .select("id, photo_type")
      .eq("booking_id", bookingId);

    if (photoError) throw photoError;
    const hasBefore = photos?.some((photo) => photo.photo_type === "before");
    const hasAfter = photos?.some((photo) => photo.photo_type === "after");
    if (!hasBefore || !hasAfter) {
      return res.status(400).json({
        message: "Before and after photos are required.",
      });
    }

    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update({
        status: "service_completed",
        service_completed_at: now,
        updated_at: now,
      })
      .eq("id", bookingId)
      .eq("assigned_washer_id", booking.assigned_washer_id)
      .eq("status", "service_started")
      .select("*")
      .single();

    if (error) throw error;
    return res.json({ success: true, booking: data });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}
