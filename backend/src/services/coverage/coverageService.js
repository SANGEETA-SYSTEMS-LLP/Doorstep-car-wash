import { supabaseAdmin } from "../../config/supabase.js";
import { calculateDistanceKm } from "../../utils/distance.js";
import { SUPERVISOR_SERVICE_RADIUS_KM } from "../supervisor/supervisorServiceArea.js";

export function findCoverage(latitude, longitude, societies, zones) {
  const validLocation = calculateDistanceKm(latitude, longitude, latitude, longitude) !== null;
  const containing = (items, radiusKey) => items
    .filter(item => item.is_active)
    .map(item => ({ ...item, distanceKm: calculateDistanceKm(latitude, longitude, item.latitude, item.longitude) }))
    .filter(item => item.distanceKm !== null && Number(item[radiusKey]) > 0 && item.distanceKm <= Number(item[radiusKey]))
    .sort((a, b) => a.distanceKm - b.distanceKm);
  const nearbySocieties = containing(societies, "service_radius_km");
  const activeSocieties = new Map(societies.filter(s => s.is_active).map(s => [s.id, s]));
  const matchingZones = containing(zones, "radius_km").filter(zone => !zone.society_id || activeSocieties.has(zone.society_id));
  const zone = matchingZones[0] || null;
  const society = zone?.society_id ? activeSocieties.get(zone.society_id) : nearbySocieties[0] || null;
  return { available: validLocation, mode: "all_locations", society, zone };
}

export async function getCoverage(latitude, longitude) {
  async function load(table) {
    const rows = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabaseAdmin.from(table).select("*").eq("is_active", true).order("id").range(offset, offset + 999);
      if (error) throw error;
      rows.push(...(data || []));
      if (!data || data.length < 1000) return rows;
    }
  }
  const [societies, zones] = await Promise.all([load("societies"), load("service_zones")]);
  const coverage = findCoverage(latitude, longitude, societies, zones);
  if (!coverage.available) return { ...coverage, available: false, hasSupervisor: false, hasWasher: false };

  // A location is serviceable when an active supervisor covers the customer
  // pin and at least one active, verified washer's service radius covers it.
  const { data: supervisors, error: supervisorError } = await supabaseAdmin
    .from("profiles").select("id").eq("role", "supervisor").eq("is_active", true);
  if (supervisorError) throw supervisorError;
  const supervisorIds = (supervisors || []).map(row => row.id);
  if (!supervisorIds.length) return { ...coverage, available: false, hasSupervisor: false, hasWasher: false };

  const { data: areas, error: areaError } = await supabaseAdmin
    .from("supervisor_service_areas").select("supervisor_id,latitude,longitude")
    .in("supervisor_id", supervisorIds);
  if (areaError) throw areaError;
  const coveringAreas = (areas || []).filter(area => {
    const distance = calculateDistanceKm(latitude, longitude, area.latitude, area.longitude);
    return distance !== null && distance <= SUPERVISOR_SERVICE_RADIUS_KM;
  });
  if (!coveringAreas.length) return { ...coverage, available: false, hasSupervisor: false, hasWasher: false };

  const { data: washers, error: washerError } = await supabaseAdmin
    .from("washers")
    .select("id,supervisor_id,service_radius_km,location:washer_locations(latitude,longitude,service_latitude,service_longitude,updated_at)")
    .eq("is_active", true).eq("is_verified", true);
  if (washerError) throw washerError;
  const now = Date.now();
  const hasWasher = (washers || []).some(washer => {
    const location = Array.isArray(washer.location) ? washer.location[0] : washer.location;
    if (!location) return false;
    const hasSavedServicePin = location.service_latitude != null && location.service_longitude != null;
    // A manually saved service pin is stable until edited, so its record age
    // must not make a covered location appear unavailable. Only live GPS
    // coordinates need a freshness check.
    if (!hasSavedServicePin && (!location.updated_at || now - Date.parse(location.updated_at) > 15 * 60 * 1000)) return false;
    const lat = hasSavedServicePin ? location.service_latitude : location.latitude;
    const lon = hasSavedServicePin ? location.service_longitude : location.longitude;
    const distance = calculateDistanceKm(latitude, longitude, lat, lon);
    const radius = Number(washer.service_radius_km);
    return distance !== null && Number.isFinite(radius) && radius > 0 && distance <= radius;
  });

  return { ...coverage, available: hasWasher, hasSupervisor: true, hasWasher };
}
