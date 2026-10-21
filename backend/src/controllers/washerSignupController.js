import { supabaseAdmin as db } from "../config/supabase.js";
import { provisionPendingWasher } from "../services/washerSignupService.js";

const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

export async function syncWasherSignup(req, res, next) {
  try {
    const userId = req.body?.userId;
    if (!uuid.test(userId || "")) return res.status(400).json({ message: "Invalid account ID." });

    // Never trust signup details sent in this request. Read the account's
    // server-stored metadata, created by Supabase Auth, then provision pending.
    const { data, error } = await db.auth.admin.getUserById(userId);
    if (error) throw error;
    if (!data?.user) return res.status(404).json({ message: "Washer account not found." });
    const createdAt = Date.parse(data.user.created_at || "");
    if (!Number.isFinite(createdAt) || Date.now() - createdAt > 30 * 60 * 1000 || createdAt > Date.now() + 60_000) {
      return res.status(403).json({ message: "Washer signup submission has expired. Sign in to continue onboarding." });
    }
    await provisionPendingWasher(data.user);
    return res.status(201).json({ success: true, submitted: true });
  } catch (error) {
    next(error);
  }
}
