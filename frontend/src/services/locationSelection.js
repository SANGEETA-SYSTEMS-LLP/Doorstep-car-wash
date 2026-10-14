import { coordinates } from "./maps.js";
export function pinLocation(position) {
  const location = { latitude: position?.lat, longitude: position?.lng, address: "", name: "", city: "", state: "", postalCode: "" };
  if (!coordinates(location)) throw new Error("Choose a valid point on the map.");
  return location;
}
export async function resolveLocationSelection(position, resolvedAddress, { lookup, coverage }) {
  const pin = pinLocation(position);
  const [addressResult, coverageResult] = await Promise.allSettled([
    resolvedAddress ? Promise.resolve({ ...resolvedAddress, latitude: pin.latitude, longitude: pin.longitude }) : lookup(position),
    coverage(pin),
  ]);
  return {
    location: addressResult.status === "fulfilled" ? addressResult.value : pin,
    notice: addressResult.status === "rejected" ? "Your pin is selected. Automatic address lookup is unavailable; enter the complete service address below." : "",
    coverage: coverageResult.status === "fulfilled" ? coverageResult.value : null,
    error: coverageResult.status === "rejected" ? coverageResult.reason?.message || "Unable to check service availability. Please retry." : "",
  };
}
export function validServiceAddress(location) {
  return Boolean(coordinates(location) && typeof location.address === "string" && location.address.trim().length >= 10 && location.address.trim().length <= 500);
}
