import { supabaseAdmin as db } from "../../config/supabase.js";

// Cancels paid washes after their scheduled slot plus the package duration and
// the existing 30-minute scheduling buffer. Refunds use the normal provider
// refund reconciler via booking_cancellations.
export async function cancelOverduePaidServiceBookings() {
  const { data, error } = await db.rpc("cancel_overdue_paid_service_bookings");
  if (error) {
    if (["42883", "PGRST202"].includes(error.code)) {
      console.error("Automatic service cancellation requires migration 20261112220000_auto_cancel_overdue_paid_bookings.sql.");
      return 0;
    }
    throw error;
  }
  return Number(data) || 0;
}
