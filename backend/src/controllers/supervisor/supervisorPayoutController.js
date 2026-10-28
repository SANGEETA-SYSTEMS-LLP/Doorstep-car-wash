import { supabaseAdmin as db } from "../../config/supabase.js";
import { isProviderConfigured } from "../../services/finance/financeProvider.js";
import { encryptPayoutDestination } from "../../services/finance/payoutDestinationCrypto.js";

function requireSupervisor(req) {
  if (req.profile?.role !== "supervisor" || req.profile?.is_active === false) {
    throw Object.assign(new Error("Active supervisor account required."), { status: 403 });
  }
}

export async function getSupervisorPayout(req, res, next) {
  try {
    requireSupervisor(req);
    const { data, error } = await db.from("supervisor_payout_accounts")
      .select("account_label,updated_at").eq("supervisor_id", req.user.id).maybeSingle();
    if (error) throw error;
    res.json({ account: data || null, providerConfigured: isProviderConfigured(true) });
  } catch (error) { next(error); }
}

export async function saveSupervisorPayout(req, res, next) {
  try {
    requireSupervisor(req);
    const body = req.body || {};
    const { method = "bank", name } = body;
    let destination;
    let label;
    if (method === "upi") {
      const { vpa } = body;
      if (Object.keys(body).some(key => !["method", "vpa"].includes(key)) || typeof vpa !== "string" || !/^[a-zA-Z0-9._-]{2,256}@[a-zA-Z0-9.-]{2,64}$/.test(vpa.trim())) {
        return res.status(400).json({ message: "Enter a valid UPI ID, such as name@bank." });
      }
      destination = { method: "upi", vpa: vpa.trim() };
      label = `UPI •••• @${vpa.trim().split("@")[1]}`;
    } else {
      const { accountNumber, ifsc } = body;
      if (method !== "bank" || Object.keys(body).some(key => !["method", "name", "accountNumber", "ifsc"].includes(key)) ||
          typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100 ||
          typeof accountNumber !== "string" || !/^\d{1,34}$/.test(accountNumber) ||
          typeof ifsc !== "string" || !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(ifsc.trim())) {
        return res.status(400).json({ message: "Enter the account holder name, account number and valid IFSC." });
      }
      const normalizedIfsc = ifsc.trim().toUpperCase();
      destination = { method: "bank", name: name.trim(), accountNumber, ifsc: normalizedIfsc };
      label = `Bank account •••• ${accountNumber.slice(-4)} (${normalizedIfsc})`;
    }
    const { error } = await db.from("supervisor_payout_accounts").upsert({
      supervisor_id: req.user.id,
      fund_account_id: null,
      destination_encrypted: encryptPayoutDestination(destination),
      account_label: label,
      updated_by: req.user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: "supervisor_id" });
    if (error) throw error;
    res.json({ success: true, providerConfigured: isProviderConfigured(true), account: { account_label: label } });
  } catch (error) {
    res.status(error.status || 503).json({ message: error.status ? error.message : "Payout settings are unavailable. Please contact support." });
  }
}
