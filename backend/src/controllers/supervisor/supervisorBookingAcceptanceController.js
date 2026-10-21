import { supabaseAdmin } from "../../config/supabase.js";

export async function acceptSupervisorBooking(req, res) {
  if (!req.user?.id) return res.status(401).json({ message: "Authentication required." });
  const { bookingId } = req.params;
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(bookingId)) return res.status(400).json({ message: "Invalid booking ID." });
  try {
    const { data, error } = await supabaseAdmin.from("bookings")
      .update({ status: "confirmed", updated_at: new Date().toISOString() })
      .eq("id", bookingId).eq("status", "pending").is("assigned_washer_id", null)
      .select("id, status").maybeSingle();
    if (error) throw error;
    if (!data) return res.status(409).json({ message: "This request has already changed. Refresh to see its current status." });
    return res.json({ success: true, booking: data });
  } catch (error) {
    console.error("Accept supervisor booking:", error);
    return res.status(500).json({ message: "Unable to accept booking. Please try again." });
  }
}
