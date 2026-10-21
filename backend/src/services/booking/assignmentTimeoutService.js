import { supabaseAdmin } from "../../config/supabase.js";
import { assignWasherToBooking } from "./bookingAssignmentService.js";

export async function processExpiredAssignments() {
  const now = new Date().toISOString();

  const { data: assignments, error } = await supabaseAdmin
    .from("booking_assignments")
    .select("id, booking_id")
    .eq("status", "pending")
    .lt("expires_at", now);

  if (error) {
    console.error("Expired assignment query:", error);
    return;
  }

  for (const assignment of assignments || []) {
    const { data: expiredAssignment, error: updateError } = await supabaseAdmin
      .from("booking_assignments")
      .update({
        status: "expired",
        responded_at: new Date().toISOString(),
      })
      .eq("id", assignment.id)
      .eq("status", "pending")
      .lt("expires_at", now)
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error(updateError);
      continue;
    }

    // Another request may have accepted, rejected, or renewed this assignment.
    if (!expiredAssignment) continue;

    try {
      await assignWasherToBooking(assignment.booking_id);
    } catch (error) {
      console.error("Retry assignment:", error);
    }
  }
}
