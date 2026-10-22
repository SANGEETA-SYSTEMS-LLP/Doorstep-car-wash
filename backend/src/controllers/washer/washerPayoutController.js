import { supabaseAdmin as db } from "../../config/supabase.js";
import { isProviderConfigured } from "../../services/finance/financeProvider.js";
import { encryptPayoutDestination } from "../../services/finance/payoutDestinationCrypto.js";

async function ownWasher(req) {
  if (req.profile?.role !== "washer") throw Object.assign(new Error("Washer access required."), { status: 403 });
  const { data, error } = await db.from("washers").select("id,user_id,is_active").eq("user_id", req.user.id).maybeSingle();
  if (error) throw error;
  if (!data?.is_active) throw Object.assign(new Error("Active washer account required."), { status: 403 });
  return data;
}
function respondError(res, error) {
  // Never log request bodies, bank details or provider response objects.
  return res.status(error.status || 503).json({ message: error.status ? error.message : "Payout settings are unavailable. Please contact support." });
}
export async function getWasherPayout(req, res) {
  try {
    const washer = await ownWasher(req);
    const { data, error } = await db.from("washer_payout_accounts").select("account_label,updated_at").eq("washer_id", washer.id).maybeSingle();
    if (error) throw error;
    res.json({ account: data || null, providerConfigured: isProviderConfigured(true) });
  } catch (error) { respondError(res, error); }
}
export async function saveWasherPayout(req, res) {
  try {
    const washer = await ownWasher(req);
    const body = req.body || {};
    const { method = "bank", name } = body;
    if (method === "upi") {
      const { vpa } = body;
      if (Object.keys(body).some(key => !["method", "vpa"].includes(key)) || typeof vpa !== "string" || !/^[a-zA-Z0-9._-]{2,256}@[a-zA-Z0-9.-]{2,64}$/.test(vpa.trim())) {
        return res.status(400).json({ message: "Enter a valid UPI ID, such as name@bank." });
      }
      const domain = vpa.trim().split("@")[1];
      const label = `UPI •••• @${domain}`;
      const { error } = await db.from("washer_payout_accounts").upsert({ washer_id: washer.id,
        fund_account_id: null, destination_encrypted: encryptPayoutDestination({ method: "upi", vpa: vpa.trim() }), account_label: label, updated_by: req.user.id, updated_at: new Date().toISOString() }, { onConflict: "washer_id" });
      if (error) throw error;
      return res.json({ success: true, providerConfigured: isProviderConfigured(true), account: { account_label: label } });
    }
    const { accountNumber, ifsc } = body;
    if (method !== "bank" || Object.keys(body).some(key => !["method", "name", "accountNumber", "ifsc"].includes(key)) || typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100 ||
        // Bank account lengths vary between banks; let RazorpayX validate the
        // beneficiary instead of imposing one bank's account-number length.
        typeof accountNumber !== "string" || !/^\d{1,34}$/.test(accountNumber) ||
        typeof ifsc !== "string" || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.trim().toUpperCase())) {
      return res.status(400).json({ message: "Enter the account holder name, a numeric account number (up to 34 digits) and a valid IFSC." });
    }
    const label = `Bank account •••• ${accountNumber.slice(-4)} (${ifsc.trim().toUpperCase()})`;
    const { error } = await db.from("washer_payout_accounts").upsert({ washer_id: washer.id,
      fund_account_id: null, destination_encrypted: encryptPayoutDestination({ method: "bank", name: name.trim(), accountNumber, ifsc: ifsc.trim().toUpperCase() }), account_label: label, updated_by: req.user.id, updated_at: new Date().toISOString() }, { onConflict: "washer_id" });
    if (error) throw error;
    res.json({ success: true, providerConfigured: isProviderConfigured(true), account: { account_label: label } });
  } catch (error) { respondError(res, error); }
}
