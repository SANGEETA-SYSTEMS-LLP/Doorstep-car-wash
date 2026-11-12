import crypto from "node:crypto";
import { reconcilePaymentCompletedBookings } from "../../services/payments/paymentCompletionReconciliationService.js";

export async function reconcilePaymentCompletions(req, res) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return res.status(503).json({ success: false, message: "Payment reconciliation is not configured." });

  const authorization = req.get?.("authorization") || req.headers?.authorization || "";
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  if (!match) return res.status(401).json({ success: false, message: "Unauthorized." });
  const supplied = Buffer.from(match[1]);
  const expected = Buffer.from(secret);
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }

  try {
    const reconciled = await reconcilePaymentCompletedBookings();
    return res.json({ success: true, reconciled });
  } catch (error) {
    console.error("Payment completion cron failed:", {
      name: typeof error.name === "string" ? error.name : "Error",
      code: typeof error.code === "string" ? error.code : undefined,
    });
    return res.status(500).json({ success: false, message: "Payment reconciliation failed." });
  }
}
