import { supabaseAdmin as db } from "../../config/supabase.js";
import { decryptPayoutDestination } from "../../services/finance/payoutDestinationCrypto.js";
import { executeOperation, isPayoutSimulationEnabled, providerRequest, validateProviderOperation } from "../../services/finance/financeProvider.js";
import { uuid, invalid } from "./financeAccess.js";

function safeDestination(label = "") {
  if (/^UPI •••• @[A-Za-z0-9.-]{2,64}$/.test(label)) return { method: "UPI (RazorpayX)", destination: label, type: "vpa", modes: ["UPI"] };
  if (/^Bank account •••• \d{4} \([A-Z]{4}0[A-Z0-9]{6}\)$/.test(label)) return { method: "Bank transfer (RazorpayX)", destination: label, type: "bank_account", modes: ["IMPS", "NEFT", "RTGS"] };
  return null;
}

export async function listSupervisorPayouts(req, res, next) {
  try {
    const { data: earnings, error } = await db.from("supervisor_earnings")
      .select("id,supervisor_id,supervisor_amount,platform_fee_amount,gst_amount,status,created_at,payout_operation_id")
      .eq("status", "pending").is("payout_operation_id", null).order("created_at", { ascending: true }).limit(5000);
    if (error) throw error;
    const ids = [...new Set((earnings || []).map(row => row.supervisor_id))];
    const [profilesResult, accountsResult] = await Promise.all([
      ids.length ? db.from("profiles").select("id,full_name,phone,is_active").in("id", ids).eq("role", "supervisor") : Promise.resolve({ data: [], error: null }),
      ids.length ? db.from("supervisor_payout_accounts").select("supervisor_id,account_label,updated_at").in("supervisor_id", ids) : Promise.resolve({ data: [], error: null }),
    ]);
    if (profilesResult.error) throw profilesResult.error;
    if (accountsResult.error) throw accountsResult.error;
    const profiles = new Map((profilesResult.data || []).map(row => [row.id, row]));
    const accounts = new Map((accountsResult.data || []).map(row => [row.supervisor_id, row]));
    const grouped = new Map();
    for (const earning of earnings || []) {
      if (!profiles.get(earning.supervisor_id)?.is_active) continue;
      const row = grouped.get(earning.supervisor_id) || { earnings_count: 0, total: 0, platformFee: 0, gst: 0 };
      row.earnings_count += 1; row.total += Number(earning.supervisor_amount) || 0;
      row.platformFee += Number(earning.platform_fee_amount) || 0;
      row.gst += Number(earning.gst_amount) || 0;
      grouped.set(earning.supervisor_id, row);
    }
    res.json({ rows: [...grouped.entries()].map(([supervisor_id, total]) => {
      const profile = profiles.get(supervisor_id) || {};
      const payout = accounts.get(supervisor_id);
      const safe = safeDestination(payout?.account_label);
      return { supervisor_id, supervisor_name: profile.full_name || "Name not provided", supervisor_phone: profile.phone || null,
        pending_earning_count: total.earnings_count, pending_total_amount: Number(total.total.toFixed(2)),
        admin_platform_fee_amount: Number(total.platformFee.toFixed(2)), admin_gst_amount: Number(total.gst.toFixed(2)),
        payment_method: safe?.method || "Not configured", payment_destination: safe?.destination || null,
        payout_account_type: safe?.type || null, available_payment_methods: safe?.modes || [],
        payment_method_configured_at: payout?.updated_at || null };
    }), count: grouped.size });
  } catch (error) { next(error); }
}

async function ensureSupervisorFundAccount(supervisorId, mode) {
  const { data: payout, error } = await db.from("supervisor_payout_accounts")
    .select("fund_account_id,destination_encrypted,account_label").eq("supervisor_id", supervisorId).single();
  if (error) throw error;
  if (!payout?.destination_encrypted && !payout?.fund_account_id) throw invalid("The supervisor has not saved payout details yet.");
  const expectedType = mode === "UPI" ? "vpa" : "bank_account";
  if (payout.fund_account_id) {
    const account = await providerRequest(`fund_accounts/${encodeURIComponent(payout.fund_account_id)}`, { payout: true });
    if (account.id !== payout.fund_account_id || !account.active || account.account_type !== expectedType) throw invalid("The saved supervisor payout details do not match the selected transfer method.");
    return payout.fund_account_id;
  }
  const destination = decryptPayoutDestination(payout.destination_encrypted);
  if ((destination.method === "upi") !== (expectedType === "vpa")) throw invalid("The selected transfer method does not match the supervisor’s saved payout details.");
  const { data: profile, error: profileError } = await db.from("profiles").select("full_name").eq("id", supervisorId).single();
  if (profileError) throw profileError;
  const contact = await providerRequest("contacts", { method: "POST", payout: true, body: {
    name: destination.method === "bank" ? destination.name : (profile.full_name || "Supervisor").trim().slice(0, 100),
    type: "vendor", reference_id: supervisorId,
  } });
  if (!/^cont_[a-zA-Z0-9]+$/.test(contact.id || "")) throw new Error("Invalid provider contact.");
  const accountBody = destination.method === "upi"
    ? { contact_id: contact.id, account_type: "vpa", vpa: { address: destination.vpa } }
    : { contact_id: contact.id, account_type: "bank_account", bank_account: { name: destination.name, ifsc: destination.ifsc, account_number: destination.accountNumber } };
  const account = await providerRequest("fund_accounts", { method: "POST", payout: true, body: accountBody });
  if (!/^fa_[a-zA-Z0-9]+$/.test(account.id || "") || !account.active || account.contact_id !== contact.id || account.account_type !== expectedType) throw new Error("Invalid provider payout account.");
  if (!isPayoutSimulationEnabled()) {
    const { error: updateError } = await db.from("supervisor_payout_accounts").update({ fund_account_id: account.id, updated_at: new Date().toISOString() }).eq("supervisor_id", supervisorId);
    if (updateError) throw updateError;
  }
  return account.id;
}

export async function paySupervisor(req, res, next) {
  try {
    const { id, supervisorId, paymentMethod } = req.body || {};
    const mode = String(paymentMethod || "").toUpperCase();
    if (!uuid.test(id || "") || !uuid.test(supervisorId || "") || !["IMPS", "NEFT", "RTGS", "UPI"].includes(mode)) throw invalid("Provide a valid supervisor, request ID, and transfer method.");
    // The finance role is checked by the route. Recheck the actor against the
    // live profile here before making any external provider calls.
    const { data: actor, error: actorError } = await db.from("profiles")
      .select("id,role,is_active").eq("id", req.user.id).maybeSingle();
    if (actorError) throw actorError;
    if (!actor?.is_active || !["accountant", "super_admin"].includes(actor.role)) throw Object.assign(new Error("Finance role required."), { status: 403 });
    const fundAccountId = await ensureSupervisorFundAccount(supervisorId, mode);
    const { data: operation, error: reserveError } = await db.rpc("reserve_supervisor_payout", {
      p_id: id, p_supervisor_id: supervisorId, p_actor: req.user.id,
      p_reason: `Supervisor commission for ${supervisorId} · ${mode}`,
      p_account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER || null,
    });
    if (reserveError) throw Object.assign(new Error(reserveError.message), { status: 409 });
    if (!operation || operation.created_by !== req.user.id || operation.supervisor_id !== supervisorId) {
      throw Object.assign(new Error("The payout reservation does not match this request."), { status: 409 });
    }
    const request = { ...operation.provider_request, fund_account_id: fundAccountId, mode,
      amount: Number(operation.amount_paise), currency: "INR", purpose: "payout", reference_id: operation.id };
    const { error: updateError } = await db.from("supervisor_payout_operations").update({ provider_request: request, updated_at: new Date().toISOString() }).eq("id", operation.id);
    if (updateError) throw updateError;
    const payoutOperation = { ...operation, kind: "payout", provider_request: request };
    const providerResult = await executeOperation(payoutOperation);
    validateProviderOperation(payoutOperation, providerResult);
    const { data: reconciled, error: reconcileError } = await db.rpc("reconcile_supervisor_payout", {
      p_id: operation.id, p_provider_id: providerResult.id, p_status: providerResult.status,
    });
    if (reconcileError) throw reconcileError;
    res.json({ id: operation.id, providerId: providerResult.id, status: reconciled.status, kind: "payout", simulated: isPayoutSimulationEnabled() });
  } catch (error) { next(error); }
}
