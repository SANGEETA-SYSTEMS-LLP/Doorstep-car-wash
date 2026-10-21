import { supabaseAdmin as db } from "../../config/supabase.js";

import { getWasherForUser } from "./accountAccess.js";

export async function myEarnings(req, res, next) {
  try {
    const washer = await getWasherForUser(req.user.id);
    const page = Number(req.query.page || 1);
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000) throw Object.assign(new Error("Invalid page."), { status: 400 });
    const { data, count, error } = await db.from("washer_earnings").select("id, booking_id, gross_amount, platform_commission, washer_amount, status, settled_at, created_at", { count: "exact" }).eq("washer_id", washer.id).order("created_at", { ascending: false }).range((page - 1) * 25, page * 25 - 1);
    if (error) throw error;
    const bookingIds = [...new Set((data || []).map(row => row.booking_id).filter(Boolean))];
    let payments = [];
    if (bookingIds.length) {
      const result = await db.from("payments").select("booking_id,payment_method,status,paid_at,created_at")
        .in("booking_id", bookingIds).order("created_at", { ascending: false });
      if (result.error) throw result.error;
      payments = result.data || [];
    }
    const earningIds = (data || []).filter(row => row.status === "settled").map(row => row.id);
    let payoutOperations = [];
    if (earningIds.length) {
      const result = await db.from("finance_payout_items").select("earning_id,operation_id").in("earning_id", earningIds);
      if (result.error) throw result.error;
      const operationIds = [...new Set((result.data || []).map(row => row.operation_id).filter(Boolean))];
      if (operationIds.length) {
        const operationsResult = await db.from("finance_operations").select("id,provider_id,provider_status,processed_at,status,provider_request").in("id", operationIds);
        if (operationsResult.error) throw operationsResult.error;
        payoutOperations = (result.data || []).map(item => {
          const operation = (operationsResult.data || []).find(row => row.id === item.operation_id);
          return { ...item, operation: operation ? {
            id: operation.id, provider_id: operation.provider_id, provider_status: operation.provider_status,
            processed_at: operation.processed_at, status: operation.status,
            payment_method: String(operation.provider_request?.mode || "IMPS").toUpperCase() === "UPI"
              ? "UPI (RazorpayX)"
              : `Bank transfer · ${String(operation.provider_request?.mode || "IMPS").toUpperCase()} (RazorpayX)`,
          } : null };
        });
      }
    }
    const paymentByBooking = new Map();
    for (const payment of payments) {
      const previous = paymentByBooking.get(payment.booking_id);
      if (!previous || (payment.status === "paid" && previous.status !== "paid")) paymentByBooking.set(payment.booking_id, payment);
    }
    const operationByEarning = new Map(payoutOperations.map(item => [item.earning_id, item.operation]));
    const rows = (data || []).map(row => ({ ...row, payment: paymentByBooking.get(row.booking_id) || null, payout: operationByEarning.get(row.id) || null, payout_method: operationByEarning.get(row.id)?.payment_method || (row.status === "settled" ? "RazorpayX payout" : "Pending payout") }));
    res.json({ success: true, rows, count: count || 0, page, pageSize: 25 });
  } catch (err) { next(err); }
}

export async function myEarningsLifetimeSummary(req, res, next) {
  try {
    const washer = await getWasherForUser(req.user.id);
    const earnings = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await db.from("washer_earnings").select("booking_id,washer_amount,status,settled_at")
        .eq("washer_id", washer.id).order("created_at", { ascending: true }).range(offset, offset + 999);
      if (error) throw error;
      earnings.push(...(data || []));
      if (!data || data.length < 1000) break;
    }

    const bookingIds = [...new Set(earnings.map(row => row.booking_id).filter(Boolean))];
    const paymentByBooking = new Map();
    for (let offset = 0; offset < bookingIds.length; offset += 500) {
      const { data, error } = await db.from("payments").select("booking_id,payment_method,status")
        .in("booking_id", bookingIds.slice(offset, offset + 500)).order("created_at", { ascending: false });
      if (error) throw error;
      for (const payment of data || []) {
        const previous = paymentByBooking.get(payment.booking_id);
        if (!previous || (payment.status === "paid" && previous.status !== "paid")) paymentByBooking.set(payment.booking_id, payment);
      }
    }

    const totals = earnings.reduce((summary, row) => {
      const amount = Number(row.washer_amount);
      if (!Number.isFinite(amount) || amount < 0) throw new Error("Invalid washer earning amount in database.");
      summary.earned += amount;
      const payment = paymentByBooking.get(row.booking_id);
      if (payment?.status === "paid" && ["cod", "cash"].includes(String(payment.payment_method || "").toLowerCase())) summary.cashReceived += amount;
      else if (row.status === "settled") summary.bankReceived += amount;
      else if (row.status === "pending") summary.awaitingPayout += amount;
      return summary;
    }, { earned: 0, bankReceived: 0, cashReceived: 0, awaitingPayout: 0 });

    for (const key of Object.keys(totals)) totals[key] = Number(totals[key].toFixed(2));
    return res.json({ success: true, ...totals, received: Number((totals.bankReceived + totals.cashReceived).toFixed(2)) });
  } catch (err) { next(err); }
}

export async function myEarningsSummary(req, res, next) {
  try {
    if (typeof req.query.from !== "string" || typeof req.query.to !== "string") {
      throw Object.assign(new Error("A valid single-day earnings range is required."), { status: 400 });
    }
    const from = Date.parse(req.query.from);
    const to = Date.parse(req.query.to);
    if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from || to - from > 25 * 60 * 60 * 1000) {
      throw Object.assign(new Error("A valid single-day earnings range is required."), { status: 400 });
    }

    const washer = await getWasherForUser(req.user.id);
    let earned = 0;
    let pending = 0;
    let settled = 0;
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await db.from("washer_earnings")
        .select("washer_amount,status")
        .eq("washer_id", washer.id)
        .gte("created_at", new Date(from).toISOString())
        .lt("created_at", new Date(to).toISOString())
        .order("created_at", { ascending: true })
        .range(offset, offset + 999);
      if (error) throw error;
      for (const row of data || []) {
        const amount = Number(row.washer_amount);
        if (!Number.isFinite(amount)) throw new Error("Invalid washer earning amount in database.");
        earned += amount;
        if (row.status === "pending") pending += amount;
        if (row.status === "settled") settled += amount;
      }
      if (!data || data.length < 1000) break;
    }

    res.json({
      success: true,
      earned: Number(earned.toFixed(2)),
      pending: Number(pending.toFixed(2)),
      settled: Number(settled.toFixed(2)),
    });
  } catch (err) { next(err); }
}

