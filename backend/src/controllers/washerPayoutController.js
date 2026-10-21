import { supabaseAdmin as db } from "../config/supabase.js";
import { providerRequest } from "../services/financeProvider.js";

async function ownWasher(req) {
  if (req.profile?.role !== "washer") throw Object.assign(new Error("Washer access required."), { status: 403 });
  const { data, error } = await db.from("washers").select("id,is_active").eq("user_id", req.user.id).maybeSingle();
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
    res.json({ account: data || null });
  } catch (error) { respondError(res, error); }
}
export async function saveWasherPayout(req, res) {
  try {
    const washer = await ownWasher(req);
    const { name, accountNumber, ifsc } = req.body || {};
    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100 ||
        typeof accountNumber !== "string" || !/^\d{9,18}$/.test(accountNumber) ||
        typeof ifsc !== "string" || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.trim().toUpperCase()) ||
        Object.keys(req.body).some(key => !["name", "accountNumber", "ifsc"].includes(key))) {
      return res.status(400).json({ message: "Enter the account holder name, a 9–18 digit account number and a valid IFSC." });
    }
    const contact = await providerRequest("contacts", { method: "POST", payout: true,
      body: { name: name.trim(), type: "vendor", reference_id: washer.id } });
    if (!/^cont_[a-zA-Z0-9]+$/.test(contact.id || "")) throw new Error("Invalid provider contact.");
    const account = await providerRequest("fund_accounts", { method: "POST", payout: true,
      body: { contact_id: contact.id, account_type: "bank_account", bank_account: {
        name: name.trim(), ifsc: ifsc.trim().toUpperCase(), account_number: accountNumber,
      } } });
    if (!/^fa_[a-zA-Z0-9]+$/.test(account.id || "") || !account.active || account.contact_id !== contact.id || account.account_type !== "bank_account") throw new Error("Invalid provider fund account.");
    const label = `Bank account •••• ${accountNumber.slice(-4)} (${ifsc.trim().toUpperCase()})`;
    const { error } = await db.from("washer_payout_accounts").upsert({ washer_id: washer.id,
      fund_account_id: account.id, account_label: label, updated_by: req.user.id, updated_at: new Date().toISOString() }, { onConflict: "washer_id" });
    if (error) throw error;
    res.json({ success: true, account: { account_label: label } });
  } catch (error) { respondError(res, error); }
}
