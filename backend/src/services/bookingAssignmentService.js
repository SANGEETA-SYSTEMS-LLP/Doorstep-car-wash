import {
  supabaseAdmin,
} from "../config/supabase.js";

export async function assignWasherToBooking(
  bookingId
) {
  // Selection is always performed by the supervisor after reviewing the booking.
  const { error } = await supabaseAdmin.from("bookings")
    .update({ requires_supervisor: true, updated_at: new Date().toISOString() })
    .eq("id", bookingId).is("assigned_washer_id", null)
    .in("status", ["pending", "confirmed", "finding_washer", "support_escalated"]);
  if (error) throw error;
  return { assigned: false, supervisorFallback: true, reason: "Waiting for supervisor to review and assign a nearby washer." };
}

export async function washerHasScheduleConflict(washerId, booking, bookingPackage) {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("id, scheduled_date, scheduled_start_time, status")
    .eq("assigned_washer_id", washerId)
    .eq("scheduled_date", booking.scheduled_date)
    .in("status", [
      "washer_assigned",
      "washer_on_the_way",
      "washer_arrived",
      "otp_verified",
      "service_started",
      "service_completed",
    ]);

  if (error) throw error;
  if (!data || data.length === 0) return false;

  const requestedMinutes = timeToMinutes(booking.scheduled_start_time);
  const requestedDuration = Number(bookingPackage?.duration_minutes || 60);
  const TRAVEL_BUFFER = 30;
  const conflictWindow = requestedDuration + TRAVEL_BUFFER;

  return data.some((existingBooking) => {
    const existingMinutes = timeToMinutes(existingBooking.scheduled_start_time);
    return Math.abs(requestedMinutes - existingMinutes) < conflictWindow;
  });
}

function timeToMinutes(time) {
  if (!time) return 0;
  const [hours, minutes] = String(time).split(":").map(Number);
  return hours * 60 + minutes;
}

export async function rejectAssignmentAndRetry({
  assignmentId,
  washerUserId,
  reason = null,
}) {
  const { data: assignment, error } = await supabaseAdmin
    .from("booking_assignments")
    .select(`
      id,
      booking_id,
      washer_id,
      status,
      washer:washers (
        id,
        user_id
      )
    `)
    .eq("id", assignmentId)
    .maybeSingle();

  if (error || !assignment) {
    throw new Error("Assignment not found.");
  }

  const assignmentWasher = Array.isArray(assignment.washer)
    ? assignment.washer[0]
    : assignment.washer;

  if (assignmentWasher?.user_id !== washerUserId) {
    throw new Error("You cannot reject this assignment.");
  }

  if (assignment.status !== "pending") {
    throw new Error("Assignment is no longer pending.");
  }

  const { data: rejected, error: updateError } = await supabaseAdmin
    .from("booking_assignments")
    .update({
      status: "rejected",
      responded_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq("id", assignment.id)
    .eq("status", "pending")
    .select("id").maybeSingle();

  if (updateError) {
    throw updateError;
  }

  if (!rejected) throw new Error("Assignment changed before rejection. Refresh and try again.");
  return assignWasherToBooking(assignment.booking_id);
}
