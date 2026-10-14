let loading;

export function loadGoogleMaps() {
  if (window.google?.maps?.importLibrary) return Promise.resolve(window.google.maps);
  if (loading) return loading;
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) return Promise.reject(new Error("Maps are not configured yet. Please contact support."));
  loading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const timer = setTimeout(() => fail(), 20000);
    function fail() {
      clearTimeout(timer);
      script.remove();
      delete window.carWashMapsReady;
      loading = undefined;
      reject(new Error("Unable to load Google Maps. Check your connection and map configuration."));
    }
    window.carWashMapsReady = () => {
      clearTimeout(timer);
      delete window.carWashMapsReady;
      resolve(window.google.maps);
    };
    script.src = "https://maps.googleapis.com/maps/api/js?" + new URLSearchParams({
      key, v: "weekly", loading: "async", callback: "carWashMapsReady",
    });
    script.async = true;
    script.onerror = fail;
    document.head.appendChild(script);
  });
  return loading;
}

export function coordinates(value) {
  if (value?.latitude == null || value?.longitude == null || String(value.latitude).trim() === "" || String(value.longitude).trim() === "") return null;
  const lat = Number(value.latitude);
  const lng = Number(value.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
}

export async function reverseGeocode(position) {
  const maps = await loadGoogleMaps();
  const { Geocoder } = await maps.importLibrary("geocoding");
  let results;
  try { ({ results } = await new Geocoder().geocode({ location: position })); }
  catch (error) {
    if (String(error?.code || error?.message || error).includes("REQUEST_DENIED")) {
      throw new Error("Address lookup is unavailable for this map location. Please choose an address from the search suggestions instead.");
    }
    throw error;
  }
  if (!results.length) throw new Error("No address found here. Please select a nearby address.");
  const result = results[0];
  const part = type => result.address_components.find(c => c.types.includes(type))?.long_name || "";
  return {
    name: result.formatted_address, address: result.formatted_address,
    latitude: position.lat, longitude: position.lng, placeId: result.place_id,
    city: part("locality"), state: part("administrative_area_level_1"), postalCode: part("postal_code"),
  };
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

export function locationFromPlace(place) {
  const position = place.location?.toJSON();
  if (!position || !coordinates({ latitude: position.lat, longitude: position.lng }) || !place.formattedAddress) throw new Error("Select a search result with a complete address and map location.");
  const part = type => place.addressComponents?.find(component => component.types.includes(type))?.longText || "";
  return { name: place.displayName || place.formattedAddress, address: place.formattedAddress, latitude: position.lat, longitude: position.lng, placeId: place.id, city: part("locality"), state: part("administrative_area_level_1"), postalCode: part("postal_code") };
}
