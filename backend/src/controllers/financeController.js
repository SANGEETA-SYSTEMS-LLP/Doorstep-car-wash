import { supabaseAdmin as db } from "../config/supabase.js";
import { executeOperation, providerRequest, validateProviderOperation } from "../services/financeProvider.js";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fields = "id,kind,payment_id,washer_id,amount_paise,currency,reason,status,provider_id,provider_status,created_at,updated_at";
function invalid(message) { return Object.assign(new Error(message), { status: 400 }); }
export function requireFinanceRole(req, res, next) {
  // Money movement always requires the actual finance role, including localhost.
  if (!["accountant", "sub_admin", "super_admin"].includes(req.profile?.role)) return res.status(403).json({ message: "A finance role is required." });
  next();
}
export async function listOperations(req, res, next) {
  try {
    const page = Number(req.query.page || 1);
    if (!Number.isSafeInteger(page) || page < 1 || page > 10000) throw invalid("Invalid page.");
    const { data, error, count } = await db.from("finance_operations").select(fields, { count: "exact" }).order("created_at", { ascending: false }).range((page-1)*25,page*25-1);
    if (error) throw error;
    res.json({ rows: data, count, page });
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
export async function savePayoutAccount(req, res, next) {
  try {
    const { washerId, fundAccountId, label } = req.body || {};
    if (!uuid.test(washerId || "") || !/^fa_[a-zA-Z0-9]+$/.test(fundAccountId || "") || typeof label !== "string" || label.trim().length < 3 || label.length > 100) throw invalid("Provide a washer ID, RazorpayX fund account ID and account label.");
    const account = await providerRequest("fund_accounts/" + fundAccountId, { payout: true });
    if (account.id !== fundAccountId || !account.active || account.account_type !== "bank_account") throw invalid("An active bank fund account is required for IMPS payouts.");
    const { error } = await db.from("washer_payout_accounts").upsert({ washer_id: washerId, fund_account_id: fundAccountId, account_label: label.trim(), updated_by: req.user.id, updated_at: new Date().toISOString() });
    if (error) throw error;
    res.json({ success: true });
  } catch (error) { next(error); }
}

export async function cancelDraft(req,res,next){
 try{if(!uuid.test(req.params.id))throw invalid("Invalid operation ID.");const {error}=await db.rpc("begin_finance_operation",{p_id:req.params.id,p_cancel:true});if(error)throw Object.assign(new Error(error.message),{status:409});res.json({success:true});}catch(error){next(error);}
}
