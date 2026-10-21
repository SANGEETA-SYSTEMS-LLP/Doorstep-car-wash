import { supabaseAdmin as db } from "../../config/supabase.js";
import { executeOperation, providerRequest, validateProviderOperation } from "../../services/finance/financeProvider.js";
import { uuid, fields, invalid } from "./financeAccess.js";

export async function savePayoutAccount(req, res, next) {
  try {
    const { washerId, fundAccountId } = req.body || {};
    if (!uuid.test(washerId || "") || !/^fa_[a-zA-Z0-9]+$/.test(fundAccountId || "")) throw invalid("Provide a washer ID and RazorpayX fund account ID.");
    const account = await providerRequest("fund_accounts/" + fundAccountId, { payout: true });
    if (account.id !== fundAccountId || !account.active || !["bank_account", "vpa"].includes(account.account_type)) throw invalid("An active bank or UPI fund account is required.");
    const contact = await providerRequest("contacts/" + encodeURIComponent(account.contact_id || ""), { payout: true });
    if (contact.id !== account.contact_id || contact.reference_id !== washerId) throw invalid("The payout account must belong to the selected washer.");
    const label = account.account_type === "bank_account"
      ? `Bank account •••• ${String(account.bank_account?.account_number || "").slice(-4)} (${String(account.bank_account?.ifsc || "").toUpperCase()})`
      : `UPI •••• @${String(account.vpa?.address || "").split("@").pop()}`;
    if (account.account_type === "bank_account" && !/^Bank account •••• \d{4} \([A-Z]{4}0[A-Z0-9]{6}\)$/.test(label)) throw invalid("The provider bank account is missing valid destination details.");
    if (account.account_type === "vpa" && !/^UPI •••• @[A-Za-z0-9.-]{2,64}$/.test(label)) throw invalid("The provider UPI account is missing valid destination details.");
    const { error } = await db.from("washer_payout_accounts").upsert({ washer_id: washerId, fund_account_id: fundAccountId, account_label: label, updated_by: req.user.id, updated_at: new Date().toISOString() });
    if (error) throw error;
    res.json({ success: true });
  } catch (error) { next(error); }
}

export async function getWasherPayoutMethod(req, res, next) {
  try {
    if (!uuid.test(req.params.washerId || "")) throw invalid("Enter a valid washer ID.");
    const { data, error } = await db.from("washer_payout_accounts")
      .select("fund_account_id,account_label,updated_at")
      .eq("washer_id", req.params.washerId)
      .maybeSingle();
    if (error) throw error;
    const isUpi = /^UPI •••• @[A-Za-z0-9.-]{2,64}$/.test(data?.account_label || "");
    const safeLabel = isUpi ? data.account_label : /^Bank account •••• \d{4} \([A-Z]{4}0[A-Z0-9]{6}\)$/.test(data?.account_label || "") ? data.account_label : data ? "Bank account (linked)" : null;
    res.json({ payout: data ? { method: isUpi ? "UPI (RazorpayX)" : "Bank transfer (RazorpayX)", destination: safeLabel, accountType: isUpi ? "vpa" : "bank_account", updatedAt: data.updated_at } : null });
  } catch (error) { next(error); }
}

export async function cancelDraft(req,res,next){
 try{if(!uuid.test(req.params.id))throw invalid("Invalid operation ID.");const {error}=await db.rpc("begin_finance_operation",{p_id:req.params.id,p_cancel:true});if(error)throw Object.assign(new Error(error.message),{status:409});res.json({success:true});}catch(error){next(error);}
}
