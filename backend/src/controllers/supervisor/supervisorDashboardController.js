import { supabaseAdmin } from "../../config/supabase.js";
import { boundQueryToSupervisorArea, isWithinSupervisorArea } from "../../services/supervisor/supervisorServiceArea.js";

export async function getSupervisorDashboard(
  req,
  res
) {
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

    let activeQuery = supabaseAdmin
      .from("bookings")
      .select("id,latitude,longitude").in("status", activeStatuses);
    if (req.profile?.role === "supervisor") activeQuery = boundQueryToSupervisorArea(activeQuery, req.supervisorArea);
    const { data: activeRows, error: activeError } = await activeQuery;

    if (activeError) {
      throw activeError;
    }

    let escalationQuery = supabaseAdmin
      .from("bookings")
      .select("id,latitude,longitude").or("requires_supervisor.eq.true,status.eq.support_escalated");
    if (req.profile?.role === "supervisor") escalationQuery = boundQueryToSupervisorArea(escalationQuery, req.supervisorArea);
    const { data: escalationRows, error: escalationError } = await escalationQuery;

    if (escalationError) {
      throw escalationError;
    }

    let extraQuery = supabaseAdmin
      .from("extra_charge_requests")
      .select("id,booking:bookings(latitude,longitude)")
      .eq("status", "pending");
    const { data: extraRows, error: extraChargeError } = await extraQuery;

    if (extraChargeError) {
      throw extraChargeError;
    }

    const dayStart = startOfTodayIso();
    const dayEnd = new Date(Date.parse(dayStart) + 86400000).toISOString();
    let completedQuery = supabaseAdmin
      .from("bookings")
      .select("id,latitude,longitude").gte("service_completed_at", dayStart).lt("service_completed_at", dayEnd);
    if (req.profile?.role === "supervisor") completedQuery = boundQueryToSupervisorArea(completedQuery, req.supervisorArea);
    const completed = await completedQuery;
    if (completed.error) throw completed.error;
    const isSupervisor = req.profile?.role === "supervisor";
    const inArea = rows => (rows || []).filter(row => isWithinSupervisorArea(row, req.supervisorArea)).length;
    const activeJobs = isSupervisor ? inArea(activeRows) : (activeRows || []).length;
    const escalations = isSupervisor ? inArea(escalationRows) : (escalationRows || []).length;
    const pendingExtraCharges = isSupervisor ? (extraRows || []).filter(row => {
      const booking = Array.isArray(row.booking) ? row.booking[0] : row.booking;
      return isWithinSupervisorArea(booking, req.supervisorArea);
    }).length : (extraRows || []).length;
    const completedToday = isSupervisor ? inArea(completed.data) : (completed.data || []).length;

    return res.json({
      success: true,
      stats: {
        activeJobs:
          activeJobs || 0,
        escalations:
          escalations || 0,
        pendingExtraCharges: pendingExtraCharges || 0,
        completedToday:
          completedToday || 0,
      },
    });
  } catch (error) {
    console.error(
      "Supervisor dashboard:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message || "Unable to load supervisor dashboard. Please try again.",
    });
  }
}

function startOfTodayIso() {
  // Service schedules use India Standard Time, regardless of server timezone.
  const local = new Date(Date.now() + 330 * 60000);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - 330 * 60000).toISOString();
}
