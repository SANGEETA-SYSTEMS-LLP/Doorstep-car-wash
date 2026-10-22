import crypto from "node:crypto";

export function isPayoutSimulationEnabled() {
  return process.env.NODE_ENV === "development" && process.env.RAZORPAYX_MOCK_ENABLED === "true";
}

export function isProviderConfigured(payout = false) {
  if (payout && isPayoutSimulationEnabled()) return true;
  const credentialsPresent = process.env[payout ? "RAZORPAYX_KEY_ID" : "RAZORPAY_KEY_ID"] && process.env[payout ? "RAZORPAYX_KEY_SECRET" : "RAZORPAY_KEY_SECRET"];
  return Boolean(credentialsPresent && (!payout || process.env.RAZORPAYX_ACCOUNT_NUMBER));
}

function simulatePayoutRequest(path, { method, body }) {
  if (path === "contacts" && method === "POST") return { id: `cont_mock${crypto.randomUUID().replaceAll("-", "")}` };
  if (path === "fund_accounts" && method === "POST") {
    const accountType = body?.account_type;
    if (!body?.contact_id || !["bank_account", "vpa"].includes(accountType)) throw Object.assign(new Error("Invalid simulated payout account."), { status: 400 });
    const prefix = accountType === "vpa" ? "fa_mockvpa" : "fa_mockbank";
    return { id: `${prefix}${crypto.randomUUID().replaceAll("-", "")}`, active: true, contact_id: body.contact_id, account_type: accountType };
  }
  const accountId = path.match(/^fund_accounts\/(fa_[a-zA-Z0-9]+)$/)?.[1];
  if (accountId && method === "GET") return { id: accountId, active: true, account_type: accountId.startsWith("fa_mockvpa") ? "vpa" : "bank_account" };
  throw Object.assign(new Error("Unsupported simulated RazorpayX request."), { status: 400 });
}

export async function providerRequest(path, { method = "GET", body, idempotencyKey, payout = false } = {}) {
  if (payout && isPayoutSimulationEnabled()) return simulatePayoutRequest(path, { method, body });
  const key = process.env[payout ? "RAZORPAYX_KEY_ID" : "RAZORPAY_KEY_ID"];
  const secret = process.env[payout ? "RAZORPAYX_KEY_SECRET" : "RAZORPAY_KEY_SECRET"];
  if (!isProviderConfigured(payout)) throw Object.assign(new Error("Payment provider credentials are not configured."), { status: 503 });
  const response = await fetch("https://api.razorpay.com/v1/" + path, {
    method, signal: AbortSignal.timeout(20000),
    headers: { Authorization: "Basic " + Buffer.from(key + ":" + secret).toString("base64"), "Content-Type": "application/json", ...(idempotencyKey ? { [payout ? "X-Payout-Idempotency" : "X-Refund-Idempotency"]: idempotencyKey } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response.json();
  if (!response.ok) throw Object.assign(new Error("Provider request was not confirmed. Reconcile or retry this same operation; do not create another transfer."), { status: 502 });
  return result;
}
export async function executeOperation(operation) {
  const payout = operation.kind === "payout";
  if (payout && isPayoutSimulationEnabled()) {
    return { id: `pout_mock${operation.id.replaceAll("-", "")}`, amount: Number(operation.amount_paise), currency: operation.currency || "INR", fund_account_id: operation.provider_request?.fund_account_id, status: "pending" };
  }
  if (operation.provider_id) return providerRequest((payout ? "payouts/" : "refunds/") + encodeURIComponent(operation.provider_id), { payout });
  const { payment_id, ...body } = operation.provider_request;
  return providerRequest(payout ? "payouts" : "payments/" + encodeURIComponent(payment_id) + "/refund", { method: "POST", payout, body, idempotencyKey: operation.id });
}
export function validateProviderOperation(operation, result) {
  if (!result?.id || result.amount !== Number(operation.amount_paise) || result.currency !== "INR" || (operation.kind === "refund" ? result.payment_id !== operation.provider_request.payment_id : result.fund_account_id !== operation.provider_request.fund_account_id)) throw new Error("Provider operation does not match the reserved transaction.");
}
