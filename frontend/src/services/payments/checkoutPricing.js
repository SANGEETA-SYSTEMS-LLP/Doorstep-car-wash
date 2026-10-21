export const PLATFORM_FEE_INR = 20;
export const AUTOMATIC_DISCOUNT_PERCENT = 10;

const configuredGstRate = Number(import.meta.env.VITE_GST_RATE_PERCENT ?? 18);
export const GST_RATE_PERCENT = Number.isFinite(configuredGstRate)
  && configuredGstRate >= 0
  && configuredGstRate <= 100
  ? configuredGstRate
  : 18;

export function getCheckoutPriceBreakdown(serviceAmount, requestedDiscount = 0) {
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
  const taxableAmount = Math.max(0, service - discountAmount + PLATFORM_FEE_INR);
  const taxAmount = Math.round(taxableAmount * GST_RATE_PERCENT) / 100;

  return {
    serviceAmount: service,
    platformFee: PLATFORM_FEE_INR,
    discountAmount,
    automaticDiscountAmount,
    offerDiscountAmount,
    taxAmount,
    totalAmount: Math.round((taxableAmount + taxAmount) * 100) / 100,
  };
}

export function formatRupees(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}
