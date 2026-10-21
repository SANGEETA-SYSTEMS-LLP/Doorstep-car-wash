import { supabaseAdmin as db } from "../../config/supabase.js";
import { executeOperation, providerRequest, validateProviderOperation } from "../../services/financeProvider.js";
import { uuid, fields, invalid } from "./financeAccess.js";

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

export async function getWasherPayoutMethod(req, res, next) {
  try {
    if (!uuid.test(req.params.washerId || "")) throw invalid("Enter a valid washer ID.");
    const { data, error } = await db.from("washer_payout_accounts")
      .select("account_label,updated_at")
      .eq("washer_id", req.params.washerId)
      .maybeSingle();
    if (error) throw error;
    const safeLabel = data && /^Bank account •••• \d{4} \([A-Z]{4}0[A-Z0-9]{6}\)$/.test(data.account_label || "")
      ? data.account_label
      : data ? "Bank account (linked)" : null;
    res.json({ payout: data ? { method: "Bank transfer (RazorpayX)", destination: safeLabel, updatedAt: data.updated_at } : null });
  } catch (error) { next(error); }
}

export async function cancelDraft(req,res,next){
 try{if(!uuid.test(req.params.id))throw invalid("Invalid operation ID.");const {error}=await db.rpc("begin_finance_operation",{p_id:req.params.id,p_cancel:true});if(error)throw Object.assign(new Error(error.message),{status:409});res.json({success:true});}catch(error){next(error);}
}
