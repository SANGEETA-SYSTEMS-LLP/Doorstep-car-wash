import { supabaseAdmin as db } from "../../config/supabase.js";
import { encryptPayoutDestination } from "../../services/finance/payoutDestinationCrypto.js";

async function customerForUser(userId) {
  if (userId == null) throw Object.assign(new Error("Customer access required."), { status: 403 });
  const { data, error } = await db.from("customers").select("id").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (!data) throw Object.assign(new Error("Customer account not found."), { status: 404 });
  return data;
}

function reportError(res, error) {
  if (["42P01", "PGRST205"].includes(error?.code)) return res.status(503).json({ message: "Refund account settings need a database update. Apply migration 20261112230000_customer_refund_accounts.sql." });
  return res.status(error.status || 503).json({ message: error.status ? error.message : "Refund account settings are unavailable." });
}

export async function getCustomerRefundAccount(req, res) {
  try {
    const customer = await customerForUser(req.user.id);
    const { data, error } = await db.from("customer_refund_accounts").select("account_label,updated_at").eq("customer_id", customer.id).maybeSingle();
    if (error) throw error;
    res.json({ account: data || null });
  } catch (error) { reportError(res, error); }
}

export async function saveCustomerRefundAccount(req, res) {
  try {
    const customer = await customerForUser(req.user.id);
    const body = req.body || {};
    let destination;
    let label;
    if (body.method === "upi") {
      if (Object.keys(body).some(key => !["method", "vpa"].includes(key)) || typeof body.vpa !== "string" || !/^[a-zA-Z0-9._-]{2,256}@[a-zA-Z0-9.-]{2,64}$/.test(body.vpa.trim())) return res.status(400).json({ message: "Enter a valid UPI ID, such as name@bank." });
      const vpa = body.vpa.trim();
      destination = { method: "upi", vpa };
      label = `UPI •••• @${vpa.split("@")[1]}`;
    } else {
      const { name, accountNumber, ifsc } = body;
      if (body.method !== "bank" || Object.keys(body).some(key => !["method", "name", "accountNumber", "ifsc"].includes(key)) || typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100 || typeof accountNumber !== "string" || !/^\d{1,34}$/.test(accountNumber) || typeof ifsc !== "string" || !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(ifsc.trim())) return res.status(400).json({ message: "Enter account holder name, a numeric account number, and a valid IFSC." });
      const normalizedIfsc = ifsc.trim().toUpperCase();
      destination = { method: "bank", name: name.trim(), accountNumber, ifsc: normalizedIfsc };
      label = `Bank account •••• ${accountNumber.slice(-4)} (${normalizedIfsc})`;
    }
    const { error } = await db.from("customer_refund_accounts").upsert({ customer_id: customer.id, destination_encrypted: encryptPayoutDestination(destination), account_label: label, updated_at: new Date().toISOString() }, { onConflict: "customer_id" });
    if (error) throw error;
    res.json({ success: true, account: { account_label: label } });
  } catch (error) { reportError(res, error); }
}
