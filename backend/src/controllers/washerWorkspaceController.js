import { supabaseAdmin } from "../config/supabase.js";
import { washerWorkspace, washerBooking, washerForUser, activeJobStatuses } from "../services/washerWorkspaceService.js";
export async function getWorkspace(req, res) {
  try { return res.json({ success: true, ...await washerWorkspace(req.user.id) }); }
  catch (error) { console.error("Washer workspace:", error); return res.status(error.status || 500).json({ message: error.status ? error.message : "Unable to load washer jobs." }); }
}
export async function getJob(req, res) {
  if (!/^[a-f0-9-]{36}$/i.test(req.params.bookingId)) return res.status(400).json({ message: "Invalid booking ID." });
  try { return res.json({ success: true, booking: await washerBooking(req.user.id, req.params.bookingId) }); }
  catch (error) { console.error("Washer job:", error); return res.status(error.status || 500).json({ message: error.status ? error.message : "Unable to load job details." }); }
}
export async function setAvailability(req, res) {
  if (typeof req.body?.online !== "boolean") return res.status(400).json({ message: "Online status must be true or false." });
  try {
    const washer = await washerForUser(req.user.id);
    const { data: active, error: checkError } = await supabaseAdmin.from("bookings").select("id").eq("assigned_washer_id", washer.id).in("status", activeJobStatuses).limit(1);
    if (checkError) throw checkError;
    if (active?.length || washer.status === "busy") return res.status(409).json({ message: "Complete your active job before changing availability." });
    const { data, error } = await supabaseAdmin.from("washers").update({ status: req.body.online ? "available" : "offline", updated_at: new Date().toISOString() }).eq("id", washer.id).eq("status", washer.status).select("id, status").maybeSingle();
    if (error) throw error;
    if (!data) return res.status(409).json({ message: "Availability changed. Refresh and try again." });
    return res.json({ success: true, washer: data });
  } catch (error) { console.error("Washer availability:", error); return res.status(error.status || 500).json({ message: error.status ? error.message : "Unable to update availability." }); }
}
