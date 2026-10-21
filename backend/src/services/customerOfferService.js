export const customerOffers = [
  {
    code: "FIRSTWASH",
    title: "₹100 off your first wash",
    description: "Get ₹100 off your first doorstep car wash.",
    terms: "Minimum booking ₹399 · First booking only",
  },
  {
    code: "CLEAN20",
    title: "20% off Premium Wash",
    description: "Save 20% on Premium Wash bookings.",
    terms: "Maximum discount ₹150",
  },
  {
    code: "WEEKEND50",
    title: "₹50 off weekend washes",
    description: "Get ₹50 off when your service is scheduled for Saturday or Sunday.",
    terms: "Valid for weekend service dates",
  },
];

const rules = {
  FIRSTWASH: { minimum: 399, amount: 100, firstBookingOnly: true },
  CLEAN20: { percent: 20, maximum: 150, packageName: /premium/i },
  WEEKEND50: { amount: 50, weekendOnly: true },
};

export function calculateOfferDiscount({ code, servicePrice, packageName, scheduledDate, firstBooking }) {
  const normalizedCode = typeof code === "string" ? code.trim().toUpperCase() : "";
  const rule = rules[normalizedCode];
  if (!rule) throw Object.assign(new Error("This offer code is not valid."), { status: 400 });
  if (!Number.isFinite(servicePrice) || servicePrice <= 0) throw Object.assign(new Error("A valid package price is required to apply this offer."), { status: 400 });
  if (rule.firstBookingOnly && !firstBooking) throw Object.assign(new Error("FIRSTWASH is only available on your first booking."), { status: 400 });
  if (rule.minimum && servicePrice < rule.minimum) throw Object.assign(new Error(`This offer requires a minimum package price of ₹${rule.minimum}.`), { status: 400 });
  if (rule.packageName && !rule.packageName.test(packageName || "")) throw Object.assign(new Error("CLEAN20 is valid for Premium Wash packages only."), { status: 400 });
  if (rule.weekendOnly) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate || "")) throw Object.assign(new Error("Choose a service date before applying WEEKEND50."), { status: 400 });
    const day = new Date(`${scheduledDate}T12:00:00Z`).getUTCDay();
    if (day !== 0 && day !== 6) throw Object.assign(new Error("WEEKEND50 is valid for Saturday and Sunday bookings."), { status: 400 });
  }
  const discountAmount = rule.percent
    ? Math.min(rule.maximum, Math.round(servicePrice * rule.percent) / 100)
    : rule.amount;
  return { code: normalizedCode, discountAmount: Math.min(servicePrice, discountAmount) };
}
