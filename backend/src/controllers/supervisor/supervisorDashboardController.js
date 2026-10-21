import { supabaseAdmin } from "../../config/supabase.js";

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

    const {
      count: activeJobs,
      error: activeError,
    } = await supabaseAdmin
      .from("bookings")
      .select(
        "id",
        {
          count: "exact",
        }
      )
      .limit(0)
      .in(
        "status",
        activeStatuses
      );

    if (activeError) {
      throw activeError;
    }

    const {
      count: escalations,
      error: escalationError,
    } = await supabaseAdmin
      .from("bookings")
      .select(
        "id",
        {
          count: "exact",
        }
      )
      .limit(0)
      .or("requires_supervisor.eq.true,status.eq.support_escalated");

    if (escalationError) {
      throw escalationError;
    }

    const { count: pendingExtraCharges, error: extraChargeError } = await supabaseAdmin
      .from("extra_charge_requests")
      .select("id", { count: "exact" }).limit(0)
      .eq("status", "pending");

    if (extraChargeError) {
      throw extraChargeError;
    }

    const dayStart = startOfTodayIso();
    const dayEnd = new Date(Date.parse(dayStart) + 86400000).toISOString();
    const completed = await supabaseAdmin
      .from("bookings")
      .select("id", { count: "exact" }).limit(0)
      .gte("service_completed_at", dayStart).lt("service_completed_at", dayEnd);
    if (completed.error) throw completed.error;
    const completedToday = completed.count;

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
