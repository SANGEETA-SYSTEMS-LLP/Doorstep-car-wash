import { apiRequest } from "./api";
export function coordinates(value) {
  if (value?.latitude == null || value?.longitude == null || String(value.latitude).trim() === "" || String(value.longitude).trim() === "") return null;
  const lat = Number(value.latitude);
  const lng = Number(value.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
}

export function currentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Your browser does not support location services."));
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
      () => reject(new Error("Unable to get your location. Allow location access or search for your address.")),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  });
}


export function reverseGeocode(position) { return apiRequest("/locations/reverse?"+new URLSearchParams({lat:position.lat,lon:position.lng})); }
export function searchAddresses(query) { return apiRequest("/locations/search?"+new URLSearchParams({q:query})); }
