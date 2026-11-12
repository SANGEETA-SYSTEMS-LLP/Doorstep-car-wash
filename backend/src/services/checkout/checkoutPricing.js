// Temporarily disabled; new customer bookings do not include a platform fee.
export const PLATFORM_FEE_INR = 0;
// Temporarily disabled; new bookings receive no automatic discount.
export const AUTOMATIC_DISCOUNT_PERCENT = 0;

const configuredTaxRate = Number(process.env.GST_RATE_PERCENT ?? 18);
if (!Number.isFinite(configuredTaxRate) || configuredTaxRate < 0 || configuredTaxRate > 100) {
  throw new Error("GST_RATE_PERCENT must be a number from 0 to 100.");
}

export const GST_RATE_PERCENT = configuredTaxRate;

export function calculateCheckoutAmounts(serviceAmount, requestedDiscount = 0, taxInclusive = false) {
  const service = Math.max(0, Number(serviceAmount) || 0);
  const automaticDiscountAmount = Math.min(service, Math.round(service * AUTOMATIC_DISCOUNT_PERCENT) / 100);
  const offerDiscountAmount = Math.min(
    Math.max(0, service - automaticDiscountAmount),
    Math.max(0, Number(requestedDiscount) || 0),
  );
  const discountAmount = automaticDiscountAmount + offerDiscountAmount;
  const quotedAmount = Math.max(0, service - discountAmount + PLATFORM_FEE_INR);
  const taxableAmount = taxInclusive ? quotedAmount * 100 / (100 + GST_RATE_PERCENT) : quotedAmount;
  const taxAmount = Math.round((taxInclusive ? quotedAmount - taxableAmount : taxableAmount * GST_RATE_PERCENT / 100) * 100) / 100;
  const totalAmount = Math.round((taxInclusive ? quotedAmount : taxableAmount + taxAmount) * 100) / 100;

  return {
    platformFee: PLATFORM_FEE_INR,
    discountAmount,
    automaticDiscountAmount,
    offerDiscountAmount,
    taxAmount,
    totalAmount,
  };
}
