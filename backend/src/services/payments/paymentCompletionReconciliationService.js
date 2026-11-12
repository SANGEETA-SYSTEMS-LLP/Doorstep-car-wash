import { supabaseAdmin } from "../../config/supabase.js";
import { createWasherEarning } from "../finance/earningService.js";

export async function reconcilePaymentCompletedBookings() {
  const { data: bookings, error } = await supabaseAdmin.from("bookings")
    .select("id")
    .eq("status", "payment_completed")
    .is("assigned_washer_id", null)
    .or("requires_supervisor.is.null,requires_supervisor.eq.false")
    .limit(500);
  if (error) throw error;

  let reconciled = 0;
  const pendingSupervisorIds = (bookings || []).map(booking => booking.id);
  if (pendingSupervisorIds.length) {
    const { data: marked, error: markError } = await supabaseAdmin.from("bookings")
      .update({ requires_supervisor: true, updated_at: new Date().toISOString() })
      .in("id", pendingSupervisorIds)
      .eq("status", "payment_completed")
      .is("assigned_washer_id", null)
      .select("id");
    if (markError) throw markError;
    reconciled += marked?.length || 0;
  }

  // Recent assignment changes are the likely source of an earning that failed
  // after a successful payment. The earning service verifies both conditions
  // and is idempotent, so retrying these recent assigned bookings is safe.
  const { data: assignedBookings, error: assignedError } = await supabaseAdmin.from("bookings")
    .select("id")
    .in("status", [
      "payment_completed", "customer_confirmed", "closed",
      "washer_assigned", "washer_on_the_way", "washer_arrived",
      "otp_verified", "service_started", "service_completed",
    ])
    .not("assigned_washer_id", "is", null)
    .order("updated_at", { ascending: false })
    .limit(25);
  if (assignedError) throw assignedError;
  const assignedIds = (assignedBookings || []).map(booking => booking.id);
  for (const id of assignedIds) {
    try {
      // Existing washer earnings still pass through createWasherEarning's
      // idempotent supervisor-earning repair path.
      await createWasherEarning(id);
      reconciled++;
    } catch (reconcileError) {
      console.error("Washer earning reconciliation failed:", {
        bookingId: id,
        name: typeof reconcileError.name === "string" ? reconcileError.name : "Error",
        code: typeof reconcileError.code === "string" ? reconcileError.code : undefined,
      });
    }
  }
  return reconciled;
}
