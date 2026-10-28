import { supabaseAdmin as db } from "../../config/supabase.js";

const PAYMENT_WINDOW_MS = 30 * 60 * 1000;
const HISTORY_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const PAGE_SIZE = 200;

export async function processUnpaidBookingExpiry(now = new Date()) {
  const paymentCutoff = new Date(now.getTime() - PAYMENT_WINDOW_MS).toISOString();
  const { data: candidates, error: bookingError } = await db.from("bookings")
    .select("id,created_at,payment_method")
    .eq("status", "pending")
    .lt("created_at", paymentCutoff)
    .limit(PAGE_SIZE);
  if (bookingError) throw bookingError;

  const onlineCandidates = (candidates || []).filter(booking => !["cod", "cash"].includes(String(booking.payment_method || "").toLowerCase()));
  const bookingIds = onlineCandidates.map(booking => booking.id);
  if (bookingIds.length) {
    const { data: payments, error: paymentError } = await db.from("payments")
      .select("booking_id,status")
      .in("booking_id", bookingIds);
    if (paymentError) throw paymentError;
    const paidIds = new Set((payments || []).filter(payment => payment.status === "paid").map(payment => payment.booking_id));
    for (const booking of onlineCandidates) {
      if (paidIds.has(booking.id)) continue;
      const { error } = await db.from("bookings").update({ status: "expired", updated_at: now.toISOString() })
        .eq("id", booking.id).eq("status", "pending");
      if (error) throw error;
    }
  }

  const historyCutoff = new Date(now.getTime() - HISTORY_RETENTION_MS).toISOString();
  const { data: expiredBookings, error: expiredError } = await db.from("bookings")
    .select("id")
    .eq("status", "expired")
    .is("customer_hidden_at", null)
    .lt("updated_at", historyCutoff)
    .limit(PAGE_SIZE);
  if (expiredError?.code === "42703" || expiredError?.code === "PGRST204") return;
  if (expiredError) throw expiredError;
  const expiredIds = (expiredBookings || []).map(booking => booking.id);
  if (!expiredIds.length) return;
  const { error: hideError } = await db.from("bookings").update({ customer_hidden_at: now.toISOString() })
    .in("id", expiredIds).eq("status", "expired");
  if (hideError) throw hideError;
}
