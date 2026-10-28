import { supabaseAdmin as db } from "../../config/supabase.js";
import { SUPERVISOR_SERVICE_RADIUS_KM } from "../../services/supervisor/supervisorServiceArea.js";

const validPoint = (latitude, longitude) => typeof latitude === "number" && Number.isFinite(latitude)
  && latitude >= -90 && latitude <= 90
  && typeof longitude === "number" && Number.isFinite(longitude)
  && longitude >= -180 && longitude <= 180;

export async function getSupervisorServiceArea(req, res, next) {
  try {
    if (req.profile?.role !== "supervisor") {
      return res.json({ area: null, required: false, radiusKm: SUPERVISOR_SERVICE_RADIUS_KM });
    }
    const { data, error } = await db.from("supervisor_service_areas")
      .select("supervisor_id,address,latitude,longitude,updated_at")
      .eq("supervisor_id", req.user.id)
      .maybeSingle();
    if (error) throw error;
    return res.json({ area: data || null, required: true, radiusKm: SUPERVISOR_SERVICE_RADIUS_KM });
  } catch (error) {
    return next(error);
  }
}

export async function saveSupervisorServiceArea(req, res, next) {
  try {
    if (req.profile?.role !== "supervisor") {
      return res.status(403).json({ message: "Only a supervisor can save a supervisor service area." });
    }
    const { address, latitude, longitude } = req.body || {};
    if (typeof address !== "string" || address.trim().length < 10 || address.trim().length > 500
      || !validPoint(latitude, longitude)) {
      return res.status(400).json({ message: "Choose a map location and enter a complete address (10–500 characters)." });
    }
    const { data, error } = await db.from("supervisor_service_areas").upsert({
      supervisor_id: req.user.id,
      address: address.trim(),
      latitude,
      longitude,
      updated_at: new Date().toISOString(),
    }, { onConflict: "supervisor_id" })
      .select("supervisor_id,address,latitude,longitude,updated_at")
      .single();
    if (error) throw error;
    req.supervisorArea = data;
    return res.json({ success: true, area: data, radiusKm: SUPERVISOR_SERVICE_RADIUS_KM });
  } catch (error) {
    return next(error);
  }
}
