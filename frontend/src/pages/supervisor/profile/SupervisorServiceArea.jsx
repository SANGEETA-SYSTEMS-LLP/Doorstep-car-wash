import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import useApi from "../../../hooks/useApi";
import { apiRequest } from "../../../api/apiClient";
import AddressSearch from "../../../components/map/AddressSearch";
import ServiceMap from "../../../components/map/ServiceMap";
import { currentPosition } from "../../../services/locations/maps";

export default function SupervisorServiceArea() {
  const routeLocation = useLocation();
  const { data, error: loadError, loading, refresh } = useApi("/supervisor/service-area");
  const [location, setLocation] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data?.area) setLocation({
      address: data.area.address,
      latitude: Number(data.area.latitude),
      longitude: Number(data.area.longitude),
    });
  }, [data]);

  const selectAddress = (point, result) => {
    setLocation(current => ({
      ...current,
      address: result.address || result.name || current.address || "",
      latitude: Number(point.lat),
      longitude: Number(point.lng),
    }));
    setSaved(false);
  };

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      await apiRequest("/supervisor/service-area", {
        method: "PUT",
        body: JSON.stringify({
          address: location.address,
          latitude: Number(location.latitude),
          longitude: Number(location.longitude),
        }),
      });
      setSaved(true);
      refresh();
    } catch (saveError) {
      setError(saveError.message || "Unable to save your service area.");
    } finally {
      setBusy(false);
    }
  }

  async function useCurrentLocation() {
    setBusy(true);
    setError("");
    try {
      const point = await currentPosition();
      setLocation(current => ({ ...current, latitude: point.lat, longitude: point.lng }));
      setSaved(false);
    } catch (locationError) {
      setError(locationError.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <section className="rounded-2xl border bg-white p-6">Loading supervisor service area…</section>;

  return <section className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
    <div className="mb-5">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Required for operations</p>
      <h2 className="mt-2 text-xl font-bold text-slate-950">Your service area</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Save your work address and map pin. You will receive booking and washer verification details within 7 km of this location.</p>
    </div>
    {routeLocation.state?.areaSetupRequired && <p role="status" className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Save your service address and map pin to unlock the supervisor workspace.</p>}
    {loadError && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{loadError} Apply <code>backend/database/add_supervisor_service_areas.sql</code> in Supabase if the location service is not configured.</p>}
    <form onSubmit={save} className="space-y-4">
      <fieldset disabled={busy} className="space-y-4">
        <AddressSearch disabled={busy} onSelect={(point, result) => selectAddress(point, result)} onError={message => setError(message)} />
        <button type="button" onClick={useCurrentLocation} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-blue-800">Use my current location</button>
        <ServiceMap location={location.latitude != null && location.longitude != null ? { lat: Number(location.latitude), lng: Number(location.longitude) } : null} onSelect={point => {
          setLocation(current => ({ ...current, latitude: point.lat, longitude: point.lng }));
          setSaved(false);
        }} className="h-72 rounded-xl" />
        {location.latitude != null && location.longitude != null && <p className="text-xs text-slate-500">Map pin: {Number(location.latitude).toFixed(5)}, {Number(location.longitude).toFixed(5)}</p>}
        <label className="block text-sm font-semibold text-slate-800">Complete supervisor address
          <textarea required minLength={10} maxLength={500} rows={3} value={location.address || ""} onChange={event => {
            setLocation(current => ({ ...current, address: event.target.value }));
            setSaved(false);
          }} className="mt-2 w-full rounded-xl border border-slate-300 p-3" />
        </label>
      </fieldset>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {saved && <p role="status" className="text-sm text-emerald-700">Service area saved. Booking and verification access is enabled for this area.</p>}
      <button disabled={busy || location.latitude == null || location.longitude == null} className="rounded-xl bg-blue-800 px-5 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Save service area"}</button>
    </form>
  </section>;
}
