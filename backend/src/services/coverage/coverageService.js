import { supabaseAdmin } from "../../config/supabase.js";
import { calculateDistanceKm } from "../../utils/distance.js";

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
  return findCoverage(latitude, longitude, societies, zones);
}
