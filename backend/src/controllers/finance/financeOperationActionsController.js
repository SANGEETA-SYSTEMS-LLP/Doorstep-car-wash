import { supabaseAdmin as db } from "../../config/supabase.js";
import { executeOperation, isPayoutSimulationEnabled, providerRequest, validateProviderOperation } from "../../services/finance/financeProvider.js";
import { decryptPayoutDestination } from "../../services/finance/payoutDestinationCrypto.js";
import { uuid, invalid } from "./financeAccess.js";

export async function processOperation(operation) {
  const payout = operation.kind === "payout";
  const {data: current,error: beginError}=await db.rpc("begin_finance_operation",{p_id:operation.id,p_cancel:false});
  if(beginError)throw Object.assign(new Error(beginError.message),{status:409});
  operation=current;
  const result = await executeOperation(operation);
  validateProviderOperation(operation, result);
  const { error } = await db.rpc("reconcile_finance_operation", { p_id: operation.id, p_provider_id: result.id, p_status: result.status });
  if (error) throw error;
  return { id: operation.id, providerId: result.id, status: result.status, kind: operation.kind, ...(payout && isPayoutSimulationEnabled() ? { simulated: true } : {}) };
}

async function ensureProviderPayoutAccount(washerId, paymentMethod) {
  const method = String(paymentMethod || "").toUpperCase();
  const { data: payout, error } = await db.from("washer_payout_accounts").select("fund_account_id,destination_encrypted").eq("washer_id", washerId).single();
  if (error) throw error;
  if (!payout) throw invalid("The washer has not saved payout details yet.");
  if (payout.fund_account_id) return payout.fund_account_id;
  if (!payout.destination_encrypted) throw invalid("The saved payout account needs to be updated before a transfer can be made.");
  const destination = decryptPayoutDestination(payout.destination_encrypted);
  const expectedType = method === "UPI" ? "vpa" : "bank_account";
  if ((destination.method === "upi") !== (expectedType === "vpa")) throw invalid("The selected transfer method does not match the washer’s saved payout details.");
  const { data: washer, error: washerError } = await db.from("washers").select("user_id").eq("id", washerId).single();
  if (washerError) throw washerError;
  const { data: profile, error: profileError } = await db.from("profiles").select("full_name").eq("id", washer.user_id).maybeSingle();
  if (profileError) throw profileError;
  const beneficiaryName = destination.method === "bank" ? destination.name : (profile?.full_name || "Washer").trim().slice(0, 100);
  const contact = await providerRequest("contacts", { method: "POST", payout: true,
    body: { name: beneficiaryName, type: "vendor", reference_id: washerId } });
  if (!/^cont_[a-zA-Z0-9]+$/.test(contact.id || "")) throw new Error("Invalid provider contact.");
  const accountBody = destination.method === "upi"
    ? { contact_id: contact.id, account_type: "vpa", vpa: { address: destination.vpa } }
    : { contact_id: contact.id, account_type: "bank_account", bank_account: { name: destination.name, ifsc: destination.ifsc, account_number: destination.accountNumber } };
  const created = await providerRequest("fund_accounts", { method: "POST", payout: true, body: accountBody });
  if (!/^fa_[a-zA-Z0-9]+$/.test(created.id || "") || !created.active || created.contact_id !== contact.id || created.account_type !== expectedType) throw new Error("Invalid provider payout account.");
  if (!isPayoutSimulationEnabled()) {
    const { error: updateError } = await db.from("washer_payout_accounts").update({ fund_account_id: created.id, updated_at: new Date().toISOString() }).eq("washer_id", washerId);
    if (updateError) throw updateError;
  }
  return created.id;
}

async function preparePayoutRequest(operation, paymentMethod) {
  const method = String(paymentMethod || "").toUpperCase();
  if (!["IMPS", "NEFT", "RTGS", "UPI"].includes(method)) throw invalid("Choose a supported bank or UPI payout method.");
  const fundAccountId = await ensureProviderPayoutAccount(operation.washer_id, method);
  const { data: payout, error } = await db.from("washer_payout_accounts").select("fund_account_id,account_label").eq("washer_id", operation.washer_id).single();
  if (error) throw error;
  if (!payout) throw invalid("The washer has not saved payout details yet.");
  if (operation.provider_request?.fund_account_id && operation.provider_request.fund_account_id !== fundAccountId) throw invalid("The saved payout account changed. Refresh the washer details before continuing.");
  const account = await providerRequest(`fund_accounts/${encodeURIComponent(fundAccountId)}`, { payout: true });
  const expectedType = method === "UPI" ? "vpa" : "bank_account";
  if (account.id !== fundAccountId || !account.active || account.account_type !== expectedType) throw invalid("The selected payout method does not match the washer’s active verified account.");
  const providerRequestBody = { ...operation.provider_request, fund_account_id: fundAccountId, mode: method };
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
    if (kind === "payout") await ensureProviderPayoutAccount(targetId, paymentMethod);
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

