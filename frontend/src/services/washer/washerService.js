import { apiRequest } from "../core/api";

// Customer location access is authorized against a booking on the API. The
// browser must not query washer_locations directly by washer ID.
export async function getWasherLocation(bookingId) {
  if (!bookingId) return null;
  const result = await apiRequest(`/customer/bookings/${encodeURIComponent(bookingId)}/washer-location`);
  return result.location;
}
