import { supabaseAdmin as db } from "../../config/supabase.js";
import { uuid, invalid } from "./financeAccess.js";

export async function listServiceFailureReports(req, res, next) {
  try {
    const { data: reports, error } = await db.from("service_failure_reports")
      .select("id,booking_id,payment_id,washer_id,reason,status,finance_operation_id,created_at,updated_at")
      .in("status", ["pending_review", "refund_pending", "refund_failed"])
      .order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    const rows = reports || [];
    const bookingIds = [...new Set(rows.map(row => row.booking_id))];
    const paymentIds = [...new Set(rows.map(row => row.payment_id))];
    const washerIds = [...new Set(rows.map(row => row.washer_id))];
    const [bookingsResult, paymentsResult, washersResult] = await Promise.all([
      bookingIds.length ? db.from("bookings").select("id,booking_number,status,total_amount").in("id", bookingIds) : { data: [], error: null },
      paymentIds.length ? db.from("payments").select("id,amount,status,provider_payment_id,customer_id").in("id", paymentIds) : { data: [], error: null },
      washerIds.length ? db.from("washers").select("id,user_id").in("id", washerIds) : { data: [], error: null },
    ]);
    if (bookingsResult.error) throw bookingsResult.error;
    if (paymentsResult.error) throw paymentsResult.error;
    if (washersResult.error) throw washersResult.error;
    const customerIds = [...new Set((paymentsResult.data || []).map(row => row.customer_id).filter(Boolean))];
    const userIds = [...new Set([...(washersResult.data || []).map(row => row.user_id), ...customerIds])];
    const [customersResult, profilesResult] = await Promise.all([
      customerIds.length ? db.from("customers").select("id,user_id").in("id", customerIds) : { data: [], error: null },
      userIds.length ? db.from("profiles").select("id,full_name,phone").in("id", userIds) : { data: [], error: null },
    ]);
    if (customersResult.error) throw customersResult.error;
    if (profilesResult.error) throw profilesResult.error;
    const { data: refundAccounts, error: refundAccountError } = customerIds.length
      ? await db.from("customer_refund_accounts").select("customer_id,account_label").in("customer_id", customerIds)
      : { data: [], error: null };
    if (refundAccountError) throw refundAccountError;
    const byBooking = new Map((bookingsResult.data || []).map(row => [row.id, row]));
    const byPayment = new Map((paymentsResult.data || []).map(row => [row.id, row]));
    const byWasher = new Map((washersResult.data || []).map(row => [row.id, row]));
    const customerUser = new Map((customersResult.data || []).map(row => [row.id, row.user_id]));
    const byProfile = new Map((profilesResult.data || []).map(row => [row.id, row]));
    const refundAccountByCustomer = new Map((refundAccounts || []).map(row => [row.customer_id, row.account_label]));
    res.json({ reports: rows.map(row => {
      const payment = byPayment.get(row.payment_id);
      const customerProfile = byProfile.get(customerUser.get(payment?.customer_id)) || {};
      const washerProfile = byProfile.get(byWasher.get(row.washer_id)?.user_id) || {};
      return { ...row, booking: byBooking.get(row.booking_id) || null, payment: payment ? { id: payment.id, amount: payment.amount, status: payment.status } : null,
        customer_name: customerProfile.full_name || "Name not provided", customer_phone: customerProfile.phone || null,
        refund_account_label: refundAccountByCustomer.get(payment?.customer_id) || null,
        washer_name: washerProfile.full_name || "Washer partner" };
    }) });
  } catch (error) { next(error); }
}
