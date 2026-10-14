export function validateCapturedPayment(entity, payment) {
  const expectedAmount = Math.round(Number(payment.amount) * 100);
  if (!entity || entity.status !== "captured" || entity.currency !== "INR" || entity.order_id !== payment.provider_order_id || !Number.isSafeInteger(expectedAmount) || expectedAmount <= 0 || entity.amount !== expectedAmount || !/^pay_[a-zA-Z0-9]+$/.test(entity.id || "")) {
    throw Object.assign(new Error("Payment is not captured or does not match this order and amount."), { status: 400 });
  }
}
