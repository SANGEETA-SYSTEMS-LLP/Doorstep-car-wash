import { supabaseAdmin as db } from "../../config/supabase.js";
import { calculateDistanceKm } from "../../utils/distance.js";

export const SUPERVISOR_SERVICE_RADIUS_KM = 7;

export async function getSupervisorServiceArea(supervisorId) {
  const { data, error } = await db.from("supervisor_service_areas")
    .select("supervisor_id,address,latitude,longitude,updated_at")
    .eq("supervisor_id", supervisorId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export function isWithinSupervisorArea(point, area) {
  if (!area || point?.latitude == null || point?.longitude == null) return false;
  const distance = calculateDistanceKm(area.latitude, area.longitude, point.latitude, point.longitude);
  return distance != null && distance <= SUPERVISOR_SERVICE_RADIUS_KM;
}

export function boundQueryToSupervisorArea(query, area, latitudeColumn = "latitude", longitudeColumn = "longitude") {
  const lat = Number(area.latitude);
  const lon = Number(area.longitude);
  const latDelta = SUPERVISOR_SERVICE_RADIUS_KM / 110.574;
  const cosLatitude = Math.max(Math.abs(Math.cos(lat * Math.PI / 180)), 0.01);
  const lonDelta = Math.min(180, SUPERVISOR_SERVICE_RADIUS_KM / (111.32 * cosLatitude));
  return query
    .gte(latitudeColumn, Math.max(-90, lat - latDelta))
    .lte(latitudeColumn, Math.min(90, lat + latDelta))
    .gte(longitudeColumn, Math.max(-180, lon - lonDelta))
    .lte(longitudeColumn, Math.min(180, lon + lonDelta));
}

export async function getSupervisorAreaBookingIds(area) {
  const ids = [];
  const lat = Number(area.latitude);
  const lon = Number(area.longitude);
  const latDelta = SUPERVISOR_SERVICE_RADIUS_KM / 110.574;
  const cosLatitude = Math.max(Math.abs(Math.cos(lat * Math.PI / 180)), 0.01);
  const lonDelta = Math.min(180, SUPERVISOR_SERVICE_RADIUS_KM / (111.32 * cosLatitude));
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db.from("bookings").select("id,latitude,longitude")
      .gte("latitude", Math.max(-90, lat - latDelta)).lte("latitude", Math.min(90, lat + latDelta))
      .gte("longitude", Math.max(-180, lon - lonDelta)).lte("longitude", Math.min(180, lon + lonDelta))
      .range(offset, offset + 999);
    if (error) throw error;
    ids.push(...(data || []).filter(booking => isWithinSupervisorArea(booking, area)).map(booking => booking.id));
    if (!data || data.length < 1000) return ids;
  }
}

export async function requireSupervisorServiceArea(req, res, next) {
  if (req.profile?.role !== "supervisor") return next();
  try {
    const area = await getSupervisorServiceArea(req.user.id);
    if (!area) return res.status(428).json({
      code: "SUPERVISOR_AREA_REQUIRED",
      message: "Save your supervisor service address and map location before opening operations.",
    });
    req.supervisorArea = area;
    return next();
  } catch (error) {
    return next(error);
  }
}
