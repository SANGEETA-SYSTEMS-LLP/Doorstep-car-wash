import { supabaseAdmin as db } from "../../config/supabase.js";

export async function getWasherForUser(userId) {
  const { data, error } = await db.from("washers").select("id").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (!data) throw Object.assign(new Error("Washer account not found."), { status: 404 });
  return data;
}

