import { supabaseAdmin as db } from "../../config/supabase.js";
import { calculateDistanceKm } from "../../utils/distance.js";
export function validWasherLocation(value) {
  return value && typeof value.address === "string" && value.address.trim().length >= 10 && value.address.trim().length <= 500 &&
    typeof value.latitude === "number" && typeof value.longitude === "number" && calculateDistanceKm(value.latitude, value.longitude, value.latitude, value.longitude) !== null;
}
export async function saveSignupWasherLocation(user) {
  const location = user.user_metadata?.washer_signup_location;
  if (!validWasherLocation(location)) return;
  const streetAddress = location.address.trim();
  const completeAddress = [location.flatNumber, streetAddress, location.landmark, location.city, location.state, location.postalCode]
    .map(part => typeof part === "string" ? part.trim() : "")
    .filter(Boolean)
    .join(", ");
  const { data: washer, error } = await db.from("washers").select("id,current_address").eq("user_id", user.id).maybeSingle();
  if (error) throw error;
  if (!washer) return;
  // Never replace a washer-edited address. Upgrade the old signup-only value
  // once so older pending applications also show every supplied address field.
  if (washer.current_address && ![streetAddress, completeAddress].includes(washer.current_address.trim())) return;
  const saved = await db.from("washer_locations").upsert({ washer_id: washer.id, latitude: location.latitude, longitude: location.longitude, updated_at: new Date().toISOString() }, { onConflict: "washer_id", ignoreDuplicates: true });
  if (saved.error) throw saved.error;
  const servicePin = await db.from("washer_locations").update({ service_latitude: location.latitude, service_longitude: location.longitude })
    .eq("washer_id", washer.id).is("service_latitude", null);
  if (servicePin.error) throw servicePin.error;
  let update = db.from("washers").update({ current_address: completeAddress }).eq("id", washer.id);
  update = washer.current_address ? update.eq("current_address", washer.current_address) : update.is("current_address", null);
  const address = await update;
  if (address.error) throw address.error;
}
export function nearbyWasherCards(washers, latitude, longitude) {
  return washers.flatMap(washer => {
    if (!washer.is_active || !washer.is_verified) return [];
    const location = Array.isArray(washer.location) ? washer.location[0] : washer.location;
    const distance = calculateDistanceKm(latitude, longitude, location?.latitude, location?.longitude);
    if (distance === null || !Number.isFinite(Number(washer.service_radius_km)) || distance > Number(washer.service_radius_km)) return [];
    return [{ id: washer.id, userId: washer.user_id, rating: washer.rating, jobsCompleted: washer.jobs_completed,
      status: washer.status, distanceKm: Math.round(distance * 10) / 10, locationUpdatedAt: location.updated_at }];
  }).sort((a,b) => a.distanceKm - b.distanceKm).slice(0, 12);
}
