export const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const fields = "id,kind,payment_id,washer_id,amount_paise,currency,reason,status,provider_id,provider_status,created_at,updated_at,processed_at";

export function invalid(message) {
  return Object.assign(new Error(message), { status: 400 });
}

export function requireFinanceRole(req, res, next) {
  // Refunds, washer payouts, beneficiary links and reconciliation are limited
  // to the platform administrator and the assigned accountant.
  if (!["accountant", "super_admin"].includes(req.profile?.role)) {
    return res.status(403).json({ message: "Only the Admin or Accountant can manage refunds and washer payouts." });
  }
  next();
}
