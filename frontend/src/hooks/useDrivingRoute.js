import { useEffect, useMemo, useRef, useState } from "react";
import { coordinates, loadGoogleMaps } from "../services/maps";

export default function useDrivingRoute(origin, destination) {
  const [route, setRoute] = useState(null);
  const [error, setError] = useState("");
  const latest = useRef(null);
  const start = useMemo(() => coordinates(origin), [origin]);
  const end = useMemo(() => coordinates(destination), [destination]);
  useEffect(() => { latest.current = { start, end }; }, [start, end]);
  const enabled = Boolean(start && end);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let pending = false;
    async function refresh() {
      if (pending) return;
      pending = true;
      try {
        const maps = await loadGoogleMaps();
        const { Route } = await maps.importLibrary("routes");
        const points = latest.current;
        if (!points?.start || !points?.end || !active) return;
        const { routes } = await Route.computeRoutes({
          origin: points.start, destination: points.end, travelMode: "DRIVING",
          fields: ["path", "distanceMeters", "durationMillis"],
        });
        if (!routes.length) throw new Error("No driving route is available.");
        if (active) { setRoute(routes[0]); setError(""); }
      } catch (err) {
        if (active) { setRoute(null); setError(err.message || "Route unavailable."); }
      } finally { pending = false; }
    }
    refresh();
    const timer = setInterval(refresh, 30000);
    return () => { active = false; clearInterval(timer); };
  }, [enabled, end?.lat, end?.lng]);
  return {
    path: enabled ? route?.path : undefined,
    distance: enabled && route?.distanceMeters != null ? (route.distanceMeters / 1000).toFixed(1) : "—",
    eta: enabled && route?.durationMillis != null ? Math.ceil(route.durationMillis / 60000) : "—",
    error,
  };
}
