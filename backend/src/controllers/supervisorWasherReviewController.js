import { supabaseAdmin as db } from "../config/supabase.js";

const validUuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

export async function listWasherReviews(req, res, next) {
  try {
    const { data: washers, error } = await db.from("washers")
      .select("id,user_id,status,is_active,is_verified,service_radius_km,current_address,location:washer_locations(latitude,longitude,updated_at)")
      .eq("is_active", true)
      .eq("is_verified", false)
      .order("user_id");
    if (error) throw error;
    const userIds = [...new Set((washers || []).map(washer => washer.user_id).filter(Boolean))];
    const [profilesResult, authUsers] = await Promise.all([
      userIds.length
        ? db.from("profiles").select("id,full_name,phone,role,is_active").in("id", userIds)
        : Promise.resolve({ data: [], error: null }),
      Promise.all(userIds.map(async userId => {
        const { data, error: authError } = await db.auth.admin.getUserById(userId);
        if (authError) throw authError;
        return data?.user ? [userId, data.user.email || null] : [userId, null];
      })),
    ]);
    if (profilesResult.error) throw profilesResult.error;
    const profiles = new Map((profilesResult.data || []).map(profile => [profile.id, profile]));
    const emails = new Map(authUsers);
    return res.json({ washers: (washers || []).map(washer => ({
      ...washer,
      profile: profiles.get(washer.user_id) || null,
      email: emails.get(washer.user_id) || null,
    })) });
  } catch (error) {
    next(error);
  }
}

export async function verifyWasher(req, res, next) {
  try {
    if (!validUuid.test(req.params.washerId || "")) return res.status(400).json({ message: "Invalid washer ID." });
    const { data: washer, error } = await db.from("washers")
      .select("id,user_id,is_active,is_verified,current_address,location:washer_locations(latitude,longitude)")
      .eq("id", req.params.washerId)
      .maybeSingle();
    if (error) throw error;
    if (!washer || !washer.is_active) return res.status(404).json({ message: "Active washer account not found." });
    if (washer.is_verified) return res.json({ success: true, washer: { id: washer.id, is_verified: true } });

    const [profileResult, locationResult] = await Promise.all([
      db.from("profiles").select("full_name,phone,is_active,role").eq("id", washer.user_id).maybeSingle(),
      db.from("washer_locations").select("latitude,longitude").eq("washer_id", washer.id).maybeSingle(),
    ]);
    if (profileResult.error) throw profileResult.error;
    if (locationResult.error) throw locationResult.error;
    const profile = profileResult.data;
    const location = locationResult.data;
    const phone = typeof profile?.phone === "string" ? profile.phone.trim() : "";
    const address = typeof washer.current_address === "string" ? washer.current_address.trim() : "";
    const complete = profile?.is_active && profile.role === "washer" && profile.full_name?.trim()
      && /^[+()0-9 -]{7,25}$/.test(phone) && (phone.match(/\d/g) || []).length >= 7
      && address.length >= 10 && address.length <= 500 && location?.latitude != null && location?.longitude != null
      && Number.isFinite(Number(location.latitude)) && Number.isFinite(Number(location.longitude))
      && Math.abs(Number(location.latitude)) <= 90 && Math.abs(Number(location.longitude)) <= 180;
    if (!complete) return res.status(409).json({ message: "The washer must complete their name, phone, full service address, and map location before verification." });

    const { data, error: updateError } = await db.from("washers")
      .update({ is_verified: true, status: "offline", updated_at: new Date().toISOString() })
      .eq("id", washer.id).eq("is_active", true).eq("is_verified", false)
      .select("id,is_verified,status").maybeSingle();
    if (updateError) throw updateError;
    if (!data) return res.status(409).json({ message: "Washer status changed during review. Refresh and try again." });
    return res.json({ success: true, washer: data });
  } catch (error) {
    next(error);
  }
}
