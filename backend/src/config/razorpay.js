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

  if (process.env.NODE_ENV === "production" && /test|example|placeholder|change[-_]?me/i.test(`${keyId} ${keySecret}`)) {
    throw Object.assign(new Error("Online payments are not available right now."), { status: 503 });
  }

  client ??= new Razorpay({ key_id: keyId, key_secret: keySecret });
  return client;
}
