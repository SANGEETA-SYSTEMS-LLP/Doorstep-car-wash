// Temporarily disabled. Keep the shared field at zero so the browser quote
// matches the amount persisted by the backend for every new booking.
export const PLATFORM_FEE_INR = 0;
// Temporarily disabled; customer totals no longer include an automatic discount.
export const AUTOMATIC_DISCOUNT_PERCENT = 0;

const configuredGstRate = Number(import.meta.env.VITE_GST_RATE_PERCENT ?? 18);
export const GST_RATE_PERCENT = Number.isFinite(configuredGstRate)
  && configuredGstRate >= 0
  && configuredGstRate <= 100
  ? configuredGstRate
  : 18;

export function getCheckoutPriceBreakdown(serviceAmount, requestedDiscount = 0, taxInclusive = false) {
  const service = Math.max(0, Number(serviceAmount) || 0);
  if (service === 0) {
    return { serviceAmount: 0, platformFee: 0, discountAmount: 0, automaticDiscountAmount: 0, offerDiscountAmount: 0, taxAmount: 0, totalAmount: 0 };
  }
  const automaticDiscountAmount = Math.min(service, Math.round(service * AUTOMATIC_DISCOUNT_PERCENT) / 100);
  const offerDiscountAmount = Math.min(
    Math.max(0, service - automaticDiscountAmount),
    Math.max(0, Number(requestedDiscount) || 0),
  );
  const discountAmount = automaticDiscountAmount + offerDiscountAmount;
  const quotedAmount = Math.max(0, service - discountAmount + PLATFORM_FEE_INR);
  const taxableAmount = taxInclusive ? quotedAmount * 100 / (100 + GST_RATE_PERCENT) : quotedAmount;
  const taxAmount = Math.round((taxInclusive ? quotedAmount - taxableAmount : taxableAmount * GST_RATE_PERCENT / 100) * 100) / 100;

  return {
    serviceAmount: service,
    platformFee: PLATFORM_FEE_INR,
    discountAmount,
    automaticDiscountAmount,
    offerDiscountAmount,
    taxAmount,
    totalAmount: Math.round((taxInclusive ? quotedAmount : taxableAmount + taxAmount) * 100) / 100,
  };
}

export function isGstInclusivePackage(pkg) {
  return ["Essential Exterior Wash", "Plus Exterior Wash", "Premium Exterior Wash"].includes(pkg?.name);
}

export function formatRupees(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}
