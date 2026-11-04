import Razorpay from "razorpay";

let client;

// Payment credentials are only needed by payment actions. Do not let missing
// Razorpay configuration prevent unrelated API routes (profile, telemetry,
// bookings, etc.) from starting in a deployment.
export function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw Object.assign(new Error("Online payments are not configured. Please contact support."), { status: 503 });
  }

  // Razorpay test keys are valid credentials, but they cannot collect live
  // payments. Check the key ID's documented mode prefix instead of scanning
  // the secret, which may coincidentally contain words like "test".
  if (process.env.NODE_ENV === "production" && !keyId.startsWith("rzp_live_")) {
    throw Object.assign(new Error("Online payments need live Razorpay credentials. Configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the production environment."), { status: 503 });
  }

  client ??= new Razorpay({ key_id: keyId, key_secret: keySecret });
  return client;
}
