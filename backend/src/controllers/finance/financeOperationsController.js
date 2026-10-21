import { supabaseAdmin as db } from "../../config/supabase.js";
import { executeOperation, providerRequest, validateProviderOperation } from "../../services/financeProvider.js";
import { uuid, fields, invalid } from "./financeAccess.js";

export async function listOperations(req, res, next) {
  try {
    const page = Number(req.query.page || 1);
    if (!Number.isSafeInteger(page) || page < 1 || page > 10000) throw invalid("Invalid page.");
    const kind = req.query.kind;
    if (kind && !["refund", "payout"].includes(kind)) throw invalid("Invalid finance operation type.");
    let query = db.from("finance_operations").select(fields, { count: "exact" }).order("created_at", { ascending: false }).range((page-1)*25,page*25-1);
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
      const profile = profileById.get(washerById.get(row.washer_id)?.user_id) || {};
      const customerProfile = profileById.get(customerByPaymentId.get(row.payment_id)?.user_id) || {};
      return { ...row, washer_name: row.kind === "payout" ? profile.full_name || "Name not provided" : null,
        washer_phone: row.kind === "payout" ? profile.phone || null : null,
        customer_name: row.kind === "refund" ? customerProfile.full_name || "Name not provided" : null,
        customer_phone: row.kind === "refund" ? customerProfile.phone || null : null,
        payment_method: row.kind === "payout" ? "Bank transfer (RazorpayX)" : null,
        payment_status: row.kind === "payout" ? row.status === "processed" ? "Paid" : "Pending" : row.status,
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
    const [washersResult, bookingsResult, payoutResult, paymentsResult] = await Promise.all([
      washerIds.length ? db.from("washers").select("id,user_id").in("id", washerIds) : Promise.resolve({ data: [], error: null }),
      bookingIds.length ? db.from("bookings").select("id,payment_method").in("id", bookingIds) : Promise.resolve({ data: [], error: null }),
      washerIds.length ? db.from("washer_payout_accounts").select("washer_id,account_label,updated_at").in("washer_id", washerIds) : Promise.resolve({ data: [], error: null }),
      bookingIds.length ? db.from("payments").select("booking_id,status,payment_method").in("booking_id", bookingIds).order("created_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
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
      const safeDestination = payout && /^Bank account •••• \d{4} \([A-Z]{4}0[A-Z0-9]{6}\)$/.test(payout.account_label || "") ? payout.account_label : payout ? "Bank account (linked)" : null;
      return { ...row, washer_name: profile.full_name || "Name not provided", washer_phone: profile.phone || null,
        payment_method: "Bank transfer (RazorpayX)", payment_destination: safeDestination,
        payment_method_configured_at: payout?.updated_at || null,
        customer_payment_method: byBooking.get(row.booking_id)?.payment_method || "Not recorded",
        customer_payment_status: customerPayment?.status || "Not recorded",
        payout_eligible: Boolean(safeDestination && customerPayment?.status === "paid" && !["cod", "cash"].includes(String(customerPayment.payment_method || "").toLowerCase())),
        payment_status: row.status === "settled" ? "Paid" : "Pending",
        payment_date: row.settled_at || null };
    }), count: count || 0, page, pageSize: 25 });
  } catch (error) { next(error); }
}
export async function processOperation(operation) {
  const {data: current,error: beginError}=await db.rpc("begin_finance_operation",{p_id:operation.id,p_cancel:false});
  if(beginError)throw Object.assign(new Error(beginError.message),{status:409});
  operation=current;
  const result = await executeOperation(operation);
  validateProviderOperation(operation, result);
  const { error } = await db.rpc("reconcile_finance_operation", { p_id: operation.id, p_provider_id: result.id, p_status: result.status });
  if (error) throw error;
  return { id: operation.id, providerId: result.id, status: result.status };
}
export async function createOperation(req, res, next) {
  try {
    const { id, kind, targetId, amount, reason } = req.body || {};
    if (!uuid.test(id || "") || !uuid.test(targetId || "") || !["refund", "payout"].includes(kind) || typeof reason !== "string" || reason.trim().length < 3 || reason.length > 500) throw invalid("Enter a valid target ID, reason and request ID.");
    const paise = kind === "refund" ? Math.round(Number(amount) * 100) : null;
    if (kind === "refund" && (!/^\d+(\.\d{1,2})?$/.test(String(amount)) || !Number.isSafeInteger(paise) || paise < 100)) throw invalid("Refund must be at least INR 1, with at most two decimal places.");
    const { data, error } = await db.rpc("reserve_finance_operation", { p_id: id, p_kind: kind, p_target: targetId, p_amount: paise, p_reason: reason.trim(), p_actor: req.user.id, p_account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER || null });
    if (error) throw Object.assign(new Error(error.message), { status: 409 });
    if(req.body.prepareOnly===true) return res.json({id:data.id,amountPaise:data.amount_paise,status:data.status});
    res.json(await processOperation(data));
  } catch (error) { next(error); }
}
export async function reconcileOperation(req, res, next) {
  try {
    if (!uuid.test(req.params.id)) throw invalid("Invalid operation ID.");
    const { data, error } = await db.from("finance_operations").select("*").eq("id", req.params.id).single();
    if (error) throw error;
    res.json(await processOperation(data));
  } catch (error) { next(error); }
}
