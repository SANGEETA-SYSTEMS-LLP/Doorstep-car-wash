import { supabaseAdmin as db } from "../../config/supabase.js";
import { uuid, fields, invalid } from "./financeAccess.js";

async function loadPendingEarnings(washerIds) {
  const rows = [];
  for (let start = 0; start < 1000000; start += 1000) {
    const { data, error } = await db.from("washer_earnings").select("id,booking_id,washer_id,washer_amount")
      .eq("status", "pending").in("washer_id", washerIds).order("created_at", { ascending: true }).range(start, start + 999);
    if (error) throw error;
    rows.push(...(data || []));
    if ((data || []).length < 1000) return rows;
  }
  throw new Error("Too many pending washer earnings to safely calculate this payout. Contact support.");
}

async function loadEligiblePayoutTotals(washerIds) {
  const earnings = await loadPendingEarnings(washerIds);
  const bookingIds = [...new Set(earnings.map(earning => earning.booking_id).filter(Boolean))];
  const bookings = [];
  const payments = [];
  for (let start = 0; start < bookingIds.length; start += 500) {
    const batch = bookingIds.slice(start, start + 500);
    const [bookingResult, paymentResult] = await Promise.all([
      db.from("bookings").select("id,payment_method").in("id", batch),
      db.from("payments").select("booking_id,status,payment_method,created_at").in("booking_id", batch).order("created_at", { ascending: false }),
    ]);
    if (bookingResult.error) throw bookingResult.error;
    if (paymentResult.error) throw paymentResult.error;
    bookings.push(...(bookingResult.data || []));
    payments.push(...(paymentResult.data || []));
  }
  const bookingById = new Map(bookings.map(booking => [booking.id, booking]));
  const paymentByBooking = new Map();
  for (const payment of payments) {
    const previous = paymentByBooking.get(payment.booking_id);
    if (!previous || (payment.status === "paid" && previous.status !== "paid")) paymentByBooking.set(payment.booking_id, payment);
  }
  const totals = new Map();
  for (const earning of earnings) {
    const booking = bookingById.get(earning.booking_id);
    const payment = paymentByBooking.get(earning.booking_id);
    const method = String(payment?.payment_method || booking?.payment_method || "").toLowerCase();
    if (payment?.status !== "paid" || ["cod", "cash"].includes(method)) continue;
    const current = totals.get(earning.washer_id) || { amount: 0, count: 0 };
    current.amount += Number(earning.washer_amount) || 0;
    current.count += 1;
    totals.set(earning.washer_id, current);
  }
  return totals;
}

export async function listOperations(req, res, next) {
  try {
    const page = Number(req.query.page || 1);
    if (!Number.isSafeInteger(page) || page < 1 || page > 10000) throw invalid("Invalid page.");
    const kind = req.query.kind;
    if (kind && !["refund", "payout"].includes(kind)) throw invalid("Invalid finance operation type.");
    let query = db.from("finance_operations").select(`${fields},provider_request`, { count: "exact" }).order("created_at", { ascending: false }).range((page-1)*25,page*25-1);
    if (kind) query = query.eq("kind", kind);
    const { data, error, count } = await query;
    if (error) throw error;
    const washers = [...new Set((data || []).filter(row => row.kind === "payout").map(row => row.washer_id).filter(Boolean))];
    const paymentIds = [...new Set((data || []).filter(row => row.kind === "refund").map(row => row.payment_id).filter(Boolean))];
    const washerResult = washers.length ? await db.from("washers").select("id,user_id").in("id", washers) : { data: [], error: null };
    if (washerResult.error) throw washerResult.error;
    const paymentsResult = paymentIds.length ? await db.from("payments").select("id,customer_id").in("id", paymentIds) : { data: [], error: null };
    if (paymentsResult.error) throw paymentsResult.error;
    const customerIds = [...new Set((paymentsResult.data || []).map(row => row.customer_id).filter(Boolean))];
    const customersResult = customerIds.length ? await db.from("customers").select("id,user_id").in("id", customerIds) : { data: [], error: null };
    if (customersResult.error) throw customersResult.error;
    const users = [...new Set([...(washerResult.data || []).map(row => row.user_id), ...(customersResult.data || []).map(row => row.user_id)].filter(Boolean))];
    const profileResult = users.length ? await db.from("profiles").select("id,full_name,phone").in("id", users) : { data: [], error: null };
    if (profileResult.error) throw profileResult.error;
    const washerById = new Map((washerResult.data || []).map(row => [row.id, row]));
    const customerByPaymentId = new Map((paymentsResult.data || []).map(payment => [payment.id, (customersResult.data || []).find(customer => customer.id === payment.customer_id)]));
    const profileById = new Map((profileResult.data || []).map(row => [row.id, row]));
    res.json({ rows: (data || []).map(row => {
      const { provider_request: providerRequestDetails, ...safeRow } = row;
      const profile = profileById.get(washerById.get(row.washer_id)?.user_id) || {};
      const customerProfile = profileById.get(customerByPaymentId.get(row.payment_id)?.user_id) || {};
      const mode = String(providerRequestDetails?.mode || "IMPS").toUpperCase();
      return { ...safeRow, washer_name: row.kind === "payout" ? profile.full_name || "Name not provided" : null,
        washer_phone: row.kind === "payout" ? profile.phone || null : null,
        customer_name: row.kind === "refund" ? customerProfile.full_name || "Name not provided" : null,
        customer_phone: row.kind === "refund" ? customerProfile.phone || null : null,
        payment_method: row.kind === "payout" ? mode === "UPI" ? "UPI (RazorpayX)" : `Bank transfer · ${mode} (RazorpayX)` : null,
        payment_status: row.kind === "payout" ? row.status === "processed" ? "Payment Completed" : "Pending" : row.status,
        payment_date: row.processed_at || null };
    }), count, page });
  } catch (error) { next(error); }
}
export async function listWasherPayouts(req, res, next) {
  try {
    const status = req.query.status === "paid" ? "settled" : "pending";
    const page = Number(req.query.page || 1);
    if (!Number.isSafeInteger(page) || page < 1 || page > 10000) throw invalid("Invalid page.");
    const { data: earnings, count, error } = await db.from("washer_earnings")
      .select("id,booking_id,washer_id,washer_amount,status,settled_at,created_at", { count: "exact" })
      .eq("status", status).order("created_at", { ascending: false }).range((page - 1) * 25, page * 25 - 1);
    if (error) throw error;
    const rows = earnings || [];
    const washerIds = [...new Set(rows.map(row => row.washer_id).filter(Boolean))];
    const bookingIds = [...new Set(rows.map(row => row.booking_id).filter(Boolean))];
    const [washersResult, bookingsResult, payoutResult, paymentsResult, pendingTotals] = await Promise.all([
      washerIds.length ? db.from("washers").select("id,user_id").in("id", washerIds) : Promise.resolve({ data: [], error: null }),
      bookingIds.length ? db.from("bookings").select("id,payment_method").in("id", bookingIds) : Promise.resolve({ data: [], error: null }),
      washerIds.length ? db.from("washer_payout_accounts").select("washer_id,account_label,updated_at").in("washer_id", washerIds) : Promise.resolve({ data: [], error: null }),
      bookingIds.length ? db.from("payments").select("booking_id,status,payment_method").in("booking_id", bookingIds).order("created_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
      status === "pending" && washerIds.length ? loadEligiblePayoutTotals(washerIds) : Promise.resolve(new Map()),
    ]);
    if (washersResult.error) throw washersResult.error;
    if (bookingsResult.error) throw bookingsResult.error;
    if (payoutResult.error) throw payoutResult.error;
    if (paymentsResult.error) throw paymentsResult.error;
    const userIds = [...new Set((washersResult.data || []).map(row => row.user_id).filter(Boolean))];
    const profilesResult = userIds.length ? await db.from("profiles").select("id,full_name,phone").in("id", userIds) : { data: [], error: null };
    if (profilesResult.error) throw profilesResult.error;
    const byWasher = new Map((washersResult.data || []).map(row => [row.id, row]));
    const byProfile = new Map((profilesResult.data || []).map(row => [row.id, row]));
    const byBooking = new Map((bookingsResult.data || []).map(row => [row.id, row]));
    const byPayout = new Map((payoutResult.data || []).map(row => [row.washer_id, row]));
    const paymentByBooking = new Map();
    for (const payment of paymentsResult.data || []) {
      const prior = paymentByBooking.get(payment.booking_id);
      if (!prior || (payment.status === "paid" && prior.status !== "paid")) paymentByBooking.set(payment.booking_id, payment);
    }
    res.json({ rows: rows.map(row => {
      const profile = byProfile.get(byWasher.get(row.washer_id)?.user_id) || {};
      const payout = byPayout.get(row.washer_id);
      const customerPayment = paymentByBooking.get(row.booking_id);
      const isUpi = /^UPI •••• @[A-Za-z0-9.-]{2,64}$/.test(payout?.account_label || "");
      const isBank = Boolean(payout && !isUpi);
      const safeDestination = isUpi ? payout.account_label : /^Bank account •••• \d{4} \([A-Z]{4}0[A-Z0-9]{6}\)$/.test(payout?.account_label || "") ? payout.account_label : payout ? "Bank account (linked)" : null;
      const pendingTotal = pendingTotals.get(row.washer_id) || { amount: 0, count: 0 };
      return { ...row, washer_name: profile.full_name || "Name not provided", washer_phone: profile.phone || null,
        payment_method: isUpi ? "UPI (RazorpayX)" : "Bank transfer (RazorpayX)", payment_destination: safeDestination,
        payout_account_type: isUpi ? "vpa" : isBank ? "bank_account" : null,
        available_payment_methods: isUpi ? ["UPI"] : isBank ? ["IMPS", "NEFT", "RTGS"] : [],
        pending_total_amount: Number(pendingTotal.amount.toFixed(2)), pending_earning_count: pendingTotal.count,
        payment_method_configured_at: payout?.updated_at || null,
        customer_payment_method: byBooking.get(row.booking_id)?.payment_method || "Not recorded",
        customer_payment_status: customerPayment?.status || "Not recorded",
        payout_eligible: Boolean(safeDestination && customerPayment?.status === "paid" && !["cod", "cash"].includes(String(customerPayment.payment_method || "").toLowerCase())),
        payment_status: row.status === "settled" ? "Payment Completed" : "Pending",
        payment_date: row.settled_at || null };
    }), count: count || 0, page, pageSize: 25 });
  } catch (error) { next(error); }
}

