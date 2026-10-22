import { supabaseAdmin } from "../../config/supabase.js";
import { provisionPendingWasher } from "../../services/washer/washerSignupService.js";
import { validWasherLocation } from "../../services/washer/washerLocationService.js";
import { referenceId } from "../../../../shared/referenceId.mjs";

export async function addSupervisorWasher(req, res) {
  if (!["supervisor", "sub_admin", "super_admin"].includes(req.profile?.role)) return res.status(403).json({ message: "Sign in with a supervisor or administrator account to add washers." });
  const { name, email, phone, password, location, serviceRadiusKm = 5 } = req.body || {};
  const radius = Number(serviceRadiusKm);
  const fullName = typeof name === "string" ? name.trim() : "";
  const mail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const mobile = typeof phone === "string" ? phone.replace(/[\s()-]/g, "") : "";
  if (fullName.length < 2 || fullName.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail) || mail.length > 254 || !/^\+?[0-9]{10,15}$/.test(mobile)) return res.status(400).json({ message: "Enter a valid washer name, email and phone number." });
  if (!validWasherLocation(location) || !Number.isFinite(radius) || radius <= 0 || radius > 100) return res.status(400).json({ message: "Select a map location, enter a complete address and a service radius up to 100 km." });
  if (typeof password !== "string" || password.length < 8 || password.length > 128) return res.status(400).json({ message: "Enter a password between 8 and 128 characters." });
  let createdUser;
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: mail, password, email_confirm: true,
      user_metadata: { full_name: fullName, phone: mobile, requested_role: "washer", washer_signup_location: location },
    });
    if (error) return res.status(400).json({ message: error.message });
    createdUser = data.user;
    await provisionPendingWasher(createdUser);
    const profile = await supabaseAdmin.from("profiles").update({ full_name: fullName, phone: mobile }).eq("id", createdUser.id);
    if (profile.error) throw profile.error;
    const result = await supabaseAdmin.from("washers").update({ supervisor_id: req.user.id, service_radius_km: radius })
      .eq("user_id", createdUser.id).select("id,user_id,status,is_verified,current_address").single();
    if (result.error) throw result.error;
    return res.status(201).json({ success: true, washer: { ...result.data, referenceId: referenceId("WSH", createdUser.id), name: fullName, email: mail, phone: mobile } });
  } catch (error) {
    // Only roll back the new account owned by this request, never an existing user.
    if (createdUser) {
      const rollback = await supabaseAdmin.auth.admin.deleteUser(createdUser.id);
      if (rollback.error) {
        console.error("Washer account cleanup failed:", createdUser.id, rollback.error.message);
        return res.status(500).json({ message: "Account was created but setup is incomplete. Contact support before retrying.", accountId: createdUser.id });
      }
    }
    console.error("Create supervisor washer:", error.message);
    return res.status(500).json({ message: "Unable to complete washer account setup. Please try again." });
  }
}

export async function linkSupervisorWasher(req, res) {
  if (!["supervisor", "sub_admin", "super_admin"].includes(req.profile?.role) || !req.user?.id) return res.status(403).json({ message: "Supervisor access required." });
  const supplied = typeof req.body?.washerId === "string" ? req.body.washerId.trim() : "";
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  let lookup = supplied;
  let column = "id";
  if (/^WSH-[0-9A-Z]{25}$/i.test(supplied)) {
    let value = 0n;
    for (const digit of supplied.slice(4).toUpperCase()) value = value * 36n + BigInt(parseInt(digit, 36));
    const hex = value.toString(16).padStart(32, "0");
    if (hex.length !== 32) return res.status(400).json({ message: "Invalid washer ID." });
    lookup = `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
    column = "user_id";
  }
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(lookup) || name.length < 2 || name.length > 100) return res.status(400).json({ message: "Enter a valid washer ID and full name." });
  try {
    const { data: washer, error } = await supabaseAdmin.from("washers")
      .select("id,user_id,supervisor_id,status,is_active,is_verified,current_address,service_radius_km,rating,jobs_completed")
      .eq(column, lookup).maybeSingle();
    if (error) throw error;
    if (!washer || !washer.is_active) return res.status(404).json({ message: "Active washer not found." });
    const profileResult = await supabaseAdmin.from("profiles").select("full_name,phone,role,is_active").eq("id", washer.user_id).maybeSingle();
    if (profileResult.error) throw profileResult.error;
    const profile = profileResult.data;
    const normalize = value => value?.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
    if (!profile?.is_active || profile.role !== "washer" || normalize(profile.full_name) !== normalize(name)) return res.status(400).json({ message: "Washer ID and name do not match an active washer account." });
    if (washer.supervisor_id && washer.supervisor_id !== req.user.id) return res.status(409).json({ message: "This washer is already linked to another supervisor." });
    const [authResult, locationResult] = await Promise.all([
      supabaseAdmin.auth.admin.getUserById(washer.user_id),
      supabaseAdmin.from("washer_locations").select("latitude,longitude,updated_at").eq("washer_id", washer.id).maybeSingle(),
    ]);
    if (authResult.error) throw authResult.error;
    if (locationResult.error) throw locationResult.error;
    let update = supabaseAdmin.from("washers").update({ supervisor_id: req.user.id }).eq("id", washer.id).eq("is_active", true);
    update = washer.supervisor_id ? update.eq("supervisor_id", req.user.id) : update.is("supervisor_id", null);
    const linked = await update.select("id").maybeSingle();
    if (linked.error) throw linked.error;
    if (!linked.data) return res.status(409).json({ message: "Washer details changed. Refresh and try again." });
    return res.json({ success: true, washer: { ...washer, supervisor_id: req.user.id, referenceId: referenceId("WSH", washer.user_id), name: profile.full_name, phone: profile.phone, email: authResult.data?.user?.email || null, location: locationResult.data } });
  } catch (error) {
    console.error("Link supervisor washer:", error.message);
    return res.status(500).json({ message: "Unable to link washer. Please try again." });
  }
}
