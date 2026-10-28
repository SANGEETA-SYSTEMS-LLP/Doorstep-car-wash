import { supabaseAdmin } from "../../config/supabase.js";
import { getRazorpay } from "../../config/razorpay.js";
import { createWasherEarning } from "../../services/finance/earningService.js";
export { supabaseAdmin, getRazorpay, createWasherEarning };
export async function customerIdForUser(userId) {
  const { data, error } = await supabaseAdmin.from("customers").select("id").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Customer profile not found.");
  return data.id;
}
