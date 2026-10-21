import { validServiceAddress } from "./locationSelection";
import { apiRequest } from "./api";

export function checkCoverage(location) {
  return apiRequest("/locations/coverage?" + new URLSearchParams({ latitude: location.latitude, longitude: location.longitude }));
}
function requireUser(userId) {
  if (!userId) throw new Error("Please sign in to manage addresses.");
}
export async function saveServiceAddress(userId, location, address = {}, societyId) {
  requireUser(userId);
  if (!validServiceAddress(location)) throw new Error("Select a map pin and enter a complete street address.");
  return apiRequest("/account/addresses", { method: "POST", body: JSON.stringify({
    address_id: location.addressId || null,
    label: location.name?.trim() || "Service location", address_line: location.address.trim(),
    society_id: societyId || null, tower: address.tower || null, flat_number: address.flatNumber || null,
    landmark: address.landmark || null, city: location.city || null, state: location.state || null,
    postal_code: location.postalCode || null, latitude: Number(location.latitude), longitude: Number(location.longitude),
  }) });
}
export async function getSavedAddresses(userId) {
  if (!userId) return [];
  const result = await apiRequest("/account/customer/addresses");
  return result.rows || [];
}
export async function updateSavedAddress(userId, addressId, location) {
  requireUser(userId);
  if (!validServiceAddress(location)) throw new Error("Select a location and enter a complete address (10–500 characters).");
  return apiRequest(`/account/addresses/${encodeURIComponent(addressId)}`, { method: "PATCH", body: JSON.stringify({
    label: location.label?.trim() || "Home", address_line: location.address.trim(),
    latitude: Number(location.latitude), longitude: Number(location.longitude),
    city: location.city?.trim() || null, state: location.state?.trim() || null,
    postal_code: location.postalCode?.trim() || null, tower: location.tower?.trim() || null,
    flat_number: location.flatNumber?.trim() || null, landmark: location.landmark?.trim() || null,
    society_id: null,
  }) });
}
export async function deleteSavedAddress(userId, addressId) {
  requireUser(userId);
  return apiRequest(`/account/addresses/${encodeURIComponent(addressId)}`, { method: "DELETE" });
}
