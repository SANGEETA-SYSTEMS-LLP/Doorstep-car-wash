import { apiRequest } from "../api/apiClient";
import { useEffect, useMemo, useRef, useState } from "react";
import { coordinates } from "../services/locations/maps";

export default function useDrivingRoute(origin, destination) {
  const [route, setRoute] = useState(null);
  const [error, setError] = useState("");
  const latest = useRef(null);
  const refreshRoute = useRef(null);
  const lastRequestAt = useRef(0);
  const start = useMemo(() => coordinates(origin), [origin]);
  const end = useMemo(() => coordinates(destination), [destination]);
  const accuracy = Number(origin?.accuracy);
  useEffect(() => { latest.current = { start, end, accuracy }; }, [start, end, accuracy]);
  const enabled = Boolean(start && end);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let pending = false;
    async function refresh() {
      if (pending) return;
      pending = true;
      try {
        const points = latest.current;
        if (!points?.start || !points?.end || !active) return;
        if (Number.isFinite(points.accuracy) && points.accuracy > 2000) {
          if (active) {
            setRoute(null);
            setError("GPS accuracy is too low to calculate a reliable route. Enable precise location and try again.");
          }
          return;
        }
        if (Date.now() - lastRequestAt.current < 10000) return;
        lastRequestAt.current = Date.now();
        const route = await apiRequest("/locations/route?" + new URLSearchParams({fromLat:points.start.lat,fromLon:points.start.lng,toLat:points.end.lat,toLon:points.end.lng}));
        const routes = [route];
        if (!routes.length) throw new Error("No driving route is available.");
        if (active) { setRoute(routes[0]); setError(""); }
      } catch (err) {
        if (active) { setRoute(null); setError(err.message || "Route unavailable."); }
      } finally { pending = false; }
    }
    refreshRoute.current = refresh;
    const delay = lastRequestAt.current
      ? Math.max(1200, 10000 - (Date.now() - lastRequestAt.current))
      : 0;
    const initialRefresh = setTimeout(refresh, delay);
    return () => { active = false; clearTimeout(initialRefresh); };
  }, [enabled, start?.lat, start?.lng, accuracy, end?.lat, end?.lng]);
  useEffect(() => {
    if (!enabled) return;
    const timer = setInterval(() => refreshRoute.current?.(), 30000);
    return () => clearInterval(timer);
  }, [enabled]);
  return {
    path: enabled ? route?.path : undefined,
    distance: enabled && route?.distanceMeters != null ? (route.distanceMeters / 1000).toFixed(1) : "-",
    eta: enabled && route?.durationMillis != null ? Math.ceil(route.durationMillis / 60000) : "-",
    error,
  };
}
