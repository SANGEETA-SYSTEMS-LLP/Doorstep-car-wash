import { createPaymentOrder, verifyOnlinePayment } from "../../../services/payments/paymentService";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function openRazorpayPayment(savedBooking, completeBooking, onError, onDone) {
  const scriptLoaded = await loadRazorpayScript();
  if (!scriptLoaded) {
    throw new Error("Unable to load Razorpay checkout. Check your connection and try again.");
  }
  const order = await createPaymentOrder(savedBooking.id);
  if (!order.keyId) throw new Error("Razorpay did not return a checkout key.");
  if (import.meta.env.DEV && !order.keyId.startsWith("rzp_test_")) {
    throw new Error("Razorpay test mode is required during development. Configure a test key in the backend environment.");
  }

  const checkout = new window.Razorpay({
    key: order.keyId,
    amount: order.amount,
    currency: order.currency,
    name: "Doorstep Car Wash",
    description: `Booking ${order.bookingNumber}`,
    order_id: order.orderId,
    handler: async (response) => {
      try {
        await verifyOnlinePayment({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });
        await completeBooking(savedBooking);
      } catch (error) {
        onError(error.message || "Unable to verify payment. Please contact support before retrying.");
      } finally {
        onDone();
      }
    },
    modal: { ondismiss: onDone },
    theme: { color: "#2563eb" },
  });
  checkout.on("payment.failed", (response) => {
    onError(response.error?.description || "Payment failed. Please try again.");
    onDone();
  });
  checkout.open();
}
