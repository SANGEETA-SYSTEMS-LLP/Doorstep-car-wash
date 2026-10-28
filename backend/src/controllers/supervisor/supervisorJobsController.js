import { supabaseAdmin } from "../../config/supabase.js";
import { enrichSupervisorBookings } from "./supervisorBookingEnrichment.js";
import { boundQueryToSupervisorArea, isWithinSupervisorArea } from "../../services/supervisor/supervisorServiceArea.js";

export async function getActiveJobs(req, res) {
  try {
    const activeStatuses = [
      "pending",
      "confirmed",
      "finding_washer",
      "washer_assigned",
      "washer_on_the_way",
      "washer_arrived",
      "otp_verified",
      "service_started",
      "service_completed",
    ];
    let query = supabaseAdmin.from("bookings").select("*").in("status", activeStatuses);
    if (req.profile?.role === "supervisor") query = boundQueryToSupervisorArea(query, req.supervisorArea);
    const { data, error } = await query.order("scheduled_date", { ascending: true });

    if (error) throw error;

    return res.json({
      success: true,
      jobs: await enrichSupervisorBookings(req.profile?.role === "supervisor" ? (data || []).filter(job => isWithinSupervisorArea(job, req.supervisorArea)) : (data || [])),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getEscalations(req, res) {
  try {
    let query = supabaseAdmin.from("bookings").select("*").or("requires_supervisor.eq.true,status.eq.support_escalated");
    if (req.profile?.role === "supervisor") query = boundQueryToSupervisorArea(query, req.supervisorArea);
    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      escalations: await enrichSupervisorBookings(req.profile?.role === "supervisor" ? (data || []).filter(job => isWithinSupervisorArea(job, req.supervisorArea)) : (data || [])),
    });
  } catch (error) {
    console.error("Get supervisor escalations error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to load supervisor escalations",
    });
  }
}

