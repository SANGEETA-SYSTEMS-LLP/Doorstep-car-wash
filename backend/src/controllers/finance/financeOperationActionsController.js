import { supabaseAdmin as db } from "../../config/supabase.js";
import { executeOperation, providerRequest, validateProviderOperation } from "../../services/finance/financeProvider.js";
import { uuid, invalid } from "./financeAccess.js";

export async function processOperation(operation) {
  const {data: current,error: beginError}=await db.rpc("begin_finance_operation",{p_id:operation.id,p_cancel:false});
  if(beginError)throw Object.assign(new Error(beginError.message),{status:409});
  operation=current;
  const result = await executeOperation(operation);
  validateProviderOperation(operation, result);
  const { error } = await db.rpc("reconcile_finance_operation", { p_id: operation.id, p_provider_id: result.id, p_status: result.status });
  if (error) throw error;
  return { id: operation.id, providerId: result.id, status: result.status, kind: operation.kind };
}

async function preparePayoutRequest(operation, paymentMethod) {
  const method = String(paymentMethod || "").toUpperCase();
  if (!["IMPS", "NEFT", "RTGS", "UPI"].includes(method)) throw invalid("Choose a supported bank or UPI payout method.");
  const { data: payout, error } = await db.from("washer_payout_accounts").select("fund_account_id,account_label").eq("washer_id", operation.washer_id).single();
  if (error) throw error;
  if (!payout?.fund_account_id || operation.provider_request?.fund_account_id !== payout.fund_account_id) throw invalid("The saved payout account changed. Refresh the washer details before continuing.");
  const account = await providerRequest(`fund_accounts/${encodeURIComponent(payout.fund_account_id)}`, { payout: true });
  const expectedType = method === "UPI" ? "vpa" : "bank_account";
  if (account.id !== payout.fund_account_id || !account.active || account.account_type !== expectedType) throw invalid("The selected payout method does not match the washer’s active verified account.");
  const providerRequestBody = { ...operation.provider_request, mode: method };
  const { error: updateError } = await db.from("finance_operations").update({ provider_request: providerRequestBody }).eq("id", operation.id);
  if (updateError) throw updateError;
  return { ...operation, provider_request: providerRequestBody };
}

export async function createOperation(req, res, next) {
  try {
    const { id, kind, targetId, amount, reason, paymentMethod } = req.body || {};
    if (!uuid.test(id || "") || !uuid.test(targetId || "") || !["refund", "payout"].includes(kind) || typeof reason !== "string" || reason.trim().length < 3 || reason.length > 500) throw invalid("Enter a valid target ID, reason and request ID.");
    if (kind === "payout" && !["IMPS", "NEFT", "RTGS", "UPI"].includes(String(paymentMethod || "").toUpperCase())) throw invalid("Choose a supported bank or UPI payout method.");
    if (kind === "refund" && paymentMethod !== undefined) throw invalid("A payout method is only valid for washer payouts.");
    const paise = kind === "refund" ? Math.round(Number(amount) * 100) : null;
    if (kind === "refund" && (!/^\d+(\.\d{1,2})?$/.test(String(amount)) || !Number.isSafeInteger(paise) || paise < 100)) throw invalid("Refund must be at least INR 1, with at most two decimal places.");
    const operationReason = kind === "payout" ? `${reason.trim()} · ${String(paymentMethod).toUpperCase()}` : reason.trim();
    const { data: reserved, error } = await db.rpc("reserve_finance_operation", { p_id: id, p_kind: kind, p_target: targetId, p_amount: paise, p_reason: operationReason, p_actor: req.user.id, p_account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER || null });
    if (error) throw Object.assign(new Error(error.message), { status: 409 });
    let data = reserved;
    if (kind === "payout") {
      try { data = await preparePayoutRequest(reserved, paymentMethod); }
      catch (error) {
        if (reserved?.id && reserved.status === "reserved") {
          try { await db.rpc("begin_finance_operation", { p_id: reserved.id, p_cancel: true }); } catch { /* preserve the original failure for the finance user */ }
        }
        throw error;
      }
    }
    if(req.body.prepareOnly===true) return res.json({id:data.id,amountPaise:data.amount_paise,status:data.status,paymentMethod:String(paymentMethod || "").toUpperCase()});
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

