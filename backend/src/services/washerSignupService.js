import { supabaseAdmin as db } from "../config/supabase.js";
import { saveSignupWasherLocation } from "./washerLocationService.js";

export async function provisionPendingWasher(user) {
  if (user.user_metadata?.requested_role !== "washer") {
    throw Object.assign(new Error("This account did not request washer registration."), { status: 403 });
  }
  const { data: profile, error: profileError } = await db.from("profiles")
    .select("id,full_name,phone,role,is_active")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile || profile.is_active === false || !["customer", "washer"].includes(profile.role)) {
    throw Object.assign(new Error("Washer account profile is unavailable for registration."), { status: 409 });
  }

  // Idempotent: repeat signup sync and login must never reset verification or status.
  const { error } = await db.from("washers").upsert({
    user_id: user.id, status: "offline", is_active: true, is_verified: false,
  }, { onConflict: "user_id", ignoreDuplicates: true });
  if (error) throw error;
  await saveSignupWasherLocation(user);
  if (profile.role === "washer") return profile;
  const result = await db.from("profiles").update({ role: "washer" })
    .eq("id", user.id).eq("role", "customer").eq("is_active", true)
    .select("id,full_name,phone,role,is_active").maybeSingle();
  if (result.error) throw result.error;
  if (!result.data) {
    // Signup sync and the first authenticated request can race; accept the
    // already-completed role transition, but never overwrite another role.
    const { data: current, error: currentError } = await db.from("profiles")
      .select("id,full_name,phone,role,is_active").eq("id", user.id).maybeSingle();
    if (currentError) throw currentError;
    if (current?.role === "washer" && current.is_active !== false) return current;
    throw new Error("Account changed during washer setup. Please retry.");
  }
  return result.data;
}

// Public washer signup grants a workspace, never verification or staff access.
export async function reconcileWasherSignup(user, profile) {
  if (user.user_metadata?.requested_role !== "washer" ||
      !["customer", "washer"].includes(profile.role) || profile.is_active === false) return profile;
  return provisionPendingWasher(user);
}
