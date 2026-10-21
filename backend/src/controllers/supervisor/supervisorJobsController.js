import { supabaseAdmin } from "../../config/supabase.js";
import { enrichSupervisorBookings } from "./supervisorBookingEnrichment.js";

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
    const { data: bookings, error } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .in("status", activeStatuses)
      .order("scheduled_date", { ascending: true });

    if (error) throw error;

    return res.json({
      success: true,
      jobs: await enrichSupervisorBookings(bookings || []),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getEscalations(req, res) {
  try {
    const { data: bookings, error } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .or("requires_supervisor.eq.true,status.eq.support_escalated")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      escalations: await enrichSupervisorBookings(bookings || []),
    });
  } catch (error) {
    console.error("Get supervisor escalations error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to load supervisor escalations",
    });
  }
}

