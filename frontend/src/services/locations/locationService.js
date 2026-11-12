import { validPostalAddress, validServiceAddress } from "./locationSelection";
import { apiRequest } from "../core/api";
import { coordinates } from "./maps";

export function checkCoverage(location) {
  return apiRequest("/locations/coverage?" + new URLSearchParams({ latitude: location.latitude, longitude: location.longitude }));
}
function requireUser(userId) {
  if (!userId) throw new Error("Please sign in to manage addresses.");
}
export async function saveServiceAddress(userId, location, address = {}, societyId) {
  requireUser(userId);
  const point = coordinates(location);
  const hasCoordinates = location.latitude != null || location.longitude != null;
  if ((hasCoordinates ? !point || !validServiceAddress(location) : !validPostalAddress(location))) {
    throw new Error("Enter a complete postal address. Map coordinates are optional.");
  }
  const result = await apiRequest("/account/addresses", { method: "POST", body: JSON.stringify({
    address_id: location.addressId || null,
    label: location.name?.trim() || "Service location", address_line: location.address.trim(),
    society_id: societyId || null, tower: address.tower || null, flat_number: address.flatNumber || null,
    landmark: address.landmark || null, city: location.city || null, state: location.state || null,
    postal_code: location.postalCode || null, latitude: point?.lat ?? null, longitude: point?.lng ?? null,
  }) });
  // The endpoint may return either the address row or a small { id } result.
  // Normalize here so the checkout always receives the saved address ID.
  const addressId = result?.id || result?.address?.id || result?.row?.id;
  if (!addressId) throw new Error("Your address was saved without an ID. Please try selecting it again.");
  return { ...result, id: addressId };
}
export async function getSavedAddresses(userId) {
  if (!userId) return [];
  const result = await apiRequest("/account/customer/addresses");
  return result.rows || [];
}
export async function updateSavedAddress(userId, addressId, location) {
  requireUser(userId);
  const point = coordinates(location);
  const hasCoordinates = location.latitude != null || location.longitude != null;
  if ((hasCoordinates ? !point || !validServiceAddress(location) : !validPostalAddress(location))) {
    throw new Error("Enter a complete postal address. Map coordinates are optional.");
  }
  return apiRequest(`/account/addresses/${encodeURIComponent(addressId)}`, { method: "PATCH", body: JSON.stringify({
    label: location.label?.trim() || "Home", address_line: location.address.trim(),
    latitude: point?.lat ?? null, longitude: point?.lng ?? null,
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
