export function validateCapturedPayment(
  entity,
  payment,
  expectedPaymentId = entity?.id,
  razorpayOrder
) {
  const expectedAmount = Math.round(Number(payment?.amount) * 100);

  const checks = {
    entityExists: Boolean(entity),
    paymentIdMatches: entity?.id === expectedPaymentId,
    paymentIdFormat: /^pay_[A-Za-z0-9]{6,64}$/.test(entity?.id || ""),
    statusIsCaptured: entity?.status === "captured" && entity?.captured === true,
    currencyIsINR: entity?.currency === "INR",
    paymentOrderMatches: entity?.order_id === payment?.provider_order_id,
    expectedAmountIsValid:
      Number.isSafeInteger(expectedAmount) && expectedAmount > 0,
    orderExists: Boolean(razorpayOrder),
    orderIdMatches: razorpayOrder?.id === payment?.provider_order_id,
    orderCurrencyIsINR: razorpayOrder?.currency === "INR",
    orderAmountMatches: razorpayOrder?.amount === expectedAmount,
    capturedAmountIsValid:
      Number.isSafeInteger(entity?.amount) &&
      entity.amount >= expectedAmount,
    orderIsPaid:
      razorpayOrder?.status === "paid" &&
      razorpayOrder?.amount_due === 0 &&
      razorpayOrder?.amount_paid === expectedAmount,
  };

  if (Object.values(checks).some((passed) => !passed)) {
    console.error("Razorpay payment validation failed", {
      checks,
      razorpayStatus: entity?.status,
      razorpayCurrency: entity?.currency,
      capturedAmountPaise: entity?.amount,
      expectedAmountPaise: expectedAmount,
      orderAmountPaise: razorpayOrder?.amount,
      orderAmountPaidPaise: razorpayOrder?.amount_paid,
      orderAmountDuePaise: razorpayOrder?.amount_due,
    });

    throw Object.assign(
      new Error("Payment is not captured or does not match the verified order."),
      { status: 400 }
    );
  }
}
