import { supabaseAdmin } from "../../../config/supabase.js";
import { getAssignedBooking } from "./washerJobAccess.js";

export async function startService(req, res) {
  try {
    const { bookingId } = req.params;
    const booking = await getAssignedBooking(bookingId, req.user.id);

    if (!["washer_arrived", "otp_verified"].includes(booking.status)) {
      return res.status(400).json({
        message: "Mark the washer as arrived before starting service.",
      });
    }

    const { data: packageData, error: packageError } = await supabaseAdmin
      .from("service_packages")
      .select("service_id")
      .eq("id", booking.package_id)
      .single();

    if (packageError) throw packageError;

    const { data: checklistItems, error: checklistError } = await supabaseAdmin
      .from("service_checklist_items")
      .select("id")
      .eq("service_id", packageData.service_id)
      .eq("active", true);

    if (checklistError) throw checklistError;

    if (!checklistItems?.length) {
      return res.status(409).json({ message: "No active service checklist is configured for this package." });
    }

    const rows = checklistItems.map((item) => ({
      booking_id: bookingId,
      checklist_item_id: item.id,
      completed: false,
    }));

    const { error: insertError } = await supabaseAdmin
      .from("booking_service_checklist")
      .upsert(rows, { onConflict: "booking_id,checklist_item_id" });

    if (insertError) throw insertError;

    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update({
        status: "service_started",
        service_started_at: now,
        updated_at: now,
      })
      .eq("id", bookingId)
      .eq("assigned_washer_id", booking.assigned_washer_id)
      .in("status", ["washer_arrived", "otp_verified"])
      .select("*")
      .single();

    if (error) throw error;

    return res.json({ success: true, booking: data });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

