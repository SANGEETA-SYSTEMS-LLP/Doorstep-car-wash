import { useEffect, useMemo, useRef, useState } from "react";
import { loadGoogleMaps, coordinates } from "../../services/maps";

export default function ServiceMap({ location, washerLocation, onSelect, path, points, className = "h-96" }) {
  const container = useRef(null);
  const callback = useRef(onSelect);
  const [instance, setInstance] = useState(null);
  const [error, setError] = useState("");
  const latitude = location?.latitude;
  const longitude = location?.longitude;
  const customer = useMemo(() => coordinates({ latitude, longitude }), [latitude, longitude]);
  const washer = useMemo(() => coordinates(washerLocation), [washerLocation]);
  useEffect(() => { callback.current = onSelect; }, [onSelect]);
  useEffect(() => {
    let active = true;
    let click;
    loadGoogleMaps().then(async maps => {
      const { Map } = await maps.importLibrary("maps");
      await maps.importLibrary("marker");
      if (!active) return;
      const map = new Map(container.current, {
        center: { lat: 20.5937, lng: 78.9629 }, zoom: 5,
        mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID",
        streetViewControl: false, mapTypeControl: false,
      });
      click = map.addListener("click", event => {
        if (event.latLng) callback.current?.(event.latLng.toJSON());
      });
      setInstance(map);
    }).catch(err => { if (active) setError(err.message); });
    return () => { active = false; click?.remove(); };
  }, []);

  useEffect(() => {
    if (!instance) return;
    const maps = window.google.maps;
    const markers = [];
    const bounds = new maps.LatLngBounds();
    for (const [position, title] of [[customer, "Service location"], [washer, "Washer location"], ...(points || []).map(point => [coordinates(point), point.title])]) {
      if (!position) continue;
      markers.push(new maps.marker.AdvancedMarkerElement({ map: instance, position, title }));
      bounds.extend(position);
    }
    if (markers.length > 1) instance.fitBounds(bounds, 70);
    else if (markers.length) { instance.panTo(markers[0].position); instance.setZoom(16); }
    const line = path?.length ? new maps.Polyline({ map: instance, path, strokeColor: "#2563eb", strokeWeight: 5 }) : null;
    return () => { markers.forEach(marker => { marker.map = null; }); line?.setMap(null); };
  }, [instance, customer, washer, path, points]);

  return <div className={"relative overflow-hidden bg-slate-100 " + className}>
    <div ref={container} className="h-full w-full" aria-label="Service location map" />
    {!instance && <div role={error ? "alert" : "status"} className="absolute inset-0 flex items-center justify-center p-8 text-center text-slate-600">{error || "Loading map..."}</div>}
  </div>;
}
