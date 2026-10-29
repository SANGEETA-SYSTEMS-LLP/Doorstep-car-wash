import { supabaseAdmin as db } from "../../config/supabase.js";

const PAYMENT_WINDOW_MS = 30 * 60 * 1000;
const HISTORY_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const PAGE_SIZE = 200;
const missingHiddenColumn = error => error?.code === "42703" || error?.code === "PGRST204"
  || /customer_hidden_at.*(does not exist|schema cache|column)/i.test(error?.message || "");
const missingExpiredStatus = error => error?.code === "22P02"
  && /booking_status.*expired|expired.*booking_status/i.test(error?.message || "");

export async function processUnpaidBookingExpiry(now = new Date(), customerId = null) {
  const expiredIds = new Set();
  const paymentCutoff = new Date(now.getTime() - PAYMENT_WINDOW_MS).toISOString();
  let candidateQuery = db.from("bookings")
    .select("id,created_at,payment_method")
    .eq("status", "pending")
    .lt("created_at", paymentCutoff)
    .limit(PAGE_SIZE);
  if (customerId) candidateQuery = candidateQuery.eq("customer_id", customerId);
  const { data: candidates, error: bookingError } = await candidateQuery;
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
      if (error && !missingExpiredStatus(error)) throw error;
      if (missingExpiredStatus(error)) {
        // Keep production history working before the enum migration has been
        // applied. Hide the stale row from the customer and still enforce the
        // expiry in the history/payment controllers.
        const { error: hideError } = await db.from("bookings")
          .update({ customer_hidden_at: now.toISOString() })
          .eq("id", booking.id).eq("status", "pending");
        if (hideError && !missingHiddenColumn(hideError)) throw hideError;
      }
      expiredIds.add(booking.id);
    }
  }

  const historyCutoff = new Date(now.getTime() - HISTORY_RETENTION_MS).toISOString();
  let expiredQuery = db.from("bookings")
    .select("id")
    .eq("status", "expired")
    .is("customer_hidden_at", null)
    .lt("updated_at", historyCutoff)
    .limit(PAGE_SIZE);
  if (customerId) expiredQuery = expiredQuery.eq("customer_id", customerId);
  const { data: expiredBookings, error: expiredError } = await expiredQuery;
  if (missingHiddenColumn(expiredError)) return [...expiredIds];
  if (expiredError) throw expiredError;
  const expiredHistoryIds = (expiredBookings || []).map(booking => booking.id);
  if (!expiredHistoryIds.length) return [...expiredIds];
  const { error: hideError } = await db.from("bookings").update({ customer_hidden_at: now.toISOString() })
    .in("id", expiredHistoryIds).eq("status", "expired");
  if (hideError) throw hideError;
  return [...expiredIds];
}
