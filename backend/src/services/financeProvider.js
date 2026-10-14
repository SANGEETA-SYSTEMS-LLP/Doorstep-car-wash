export async function providerRequest(path, { method = "GET", body, idempotencyKey, payout = false } = {}) {
  const key = process.env[payout ? "RAZORPAYX_KEY_ID" : "RAZORPAY_KEY_ID"];
  const secret = process.env[payout ? "RAZORPAYX_KEY_SECRET" : "RAZORPAY_KEY_SECRET"];
  if (!key || !secret) throw Object.assign(new Error("Payment provider credentials are not configured."), { status: 503 });
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
  if (operation.provider_id) return providerRequest((payout ? "payouts/" : "refunds/") + encodeURIComponent(operation.provider_id), { payout });
  const { payment_id, ...body } = operation.provider_request;
  return providerRequest(payout ? "payouts" : "payments/" + encodeURIComponent(payment_id) + "/refund", { method: "POST", payout, body, idempotencyKey: operation.id });
}
export function validateProviderOperation(operation, result) {
  if (!result?.id || result.amount !== Number(operation.amount_paise) || result.currency !== "INR" || (operation.kind === "refund" ? result.payment_id !== operation.provider_request.payment_id : result.fund_account_id !== operation.provider_request.fund_account_id)) throw new Error("Provider operation does not match the reserved transaction.");
}
