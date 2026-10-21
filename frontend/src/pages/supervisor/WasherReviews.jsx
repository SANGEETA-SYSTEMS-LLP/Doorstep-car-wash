import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, MapPin, Phone, RefreshCw } from "lucide-react";
import { apiRequest } from "../../services/api";

function locationOf(washer) {
  return Array.isArray(washer.location) ? washer.location[0] : washer.location;
}

function isComplete(washer) {
  const point = locationOf(washer);
  const phone = typeof washer.profile?.phone === "string" ? washer.profile.phone.trim() : "";
  const address = typeof washer.current_address === "string" ? washer.current_address.trim() : "";
  return Boolean(washer.profile?.full_name?.trim()
    && /^[+()0-9 -]{7,25}$/.test(phone) && (phone.match(/\d/g) || []).length >= 7
    && address.length >= 10 && address.length <= 500 && point?.latitude != null && point?.longitude != null
    && Number.isFinite(Number(point.latitude)) && Number.isFinite(Number(point.longitude))
    && Math.abs(Number(point.latitude)) <= 90 && Math.abs(Number(point.longitude)) <= 180);
}

export default function WasherReviews() {
  const [washers, setWashers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshCount, setRefreshCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/supervisor/washers/review");
      setWashers(data.washers || []);
    } catch (err) {
      setError(err.message || "Unable to load washer applications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshCount]);

  async function verify(washer) {
    if (busyId) return;
    setBusyId(washer.id);
    setError("");
    setNotice("");
    try {
      await apiRequest(`/supervisor/washers/${encodeURIComponent(washer.id)}/verify`, { method: "PATCH" });
      setWashers(rows => rows.filter(row => row.id !== washer.id));
      setNotice(`${washer.profile?.full_name || "Washer"} verified. They can now choose to go online; job offers also require service eligibility.`);
    } catch (err) {
      setError(err.message || "Unable to verify this washer.");
    } finally {
      setBusyId("");
    }
  }

  return <section className="mx-auto max-w-5xl">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-semibold text-blue-700">Washer onboarding</p><h1 className="mt-1 text-3xl font-black text-slate-900">Washer verification</h1><p className="mt-2 text-slate-600">Review each washer’s account and service location. Verified washers remain offline until they choose to go online.</p></div>
      <button type="button" onClick={() => setRefreshCount(value => value + 1)} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 font-semibold text-slate-700 disabled:opacity-50"><RefreshCw size={16} className={loading ? "animate-spin" : ""} />Refresh</button>
    </div>
    {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</p>}
    {notice && <p role="status" className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">{notice}</p>}
    {loading && <p role="status" className="mt-8 text-slate-500">Loading washer applications…</p>}
    {!loading && !washers.length && <div className="mt-8 rounded-2xl border border-dashed bg-white p-10 text-center"><CheckCircle2 className="mx-auto text-green-600" size={30} /><h2 className="mt-3 text-lg font-bold">No pending washer applications</h2><p className="mt-1 text-sm text-slate-500">New washer accounts appear here after signup details are submitted.</p></div>}
    <div className="mt-6 space-y-4">{washers.map(washer => {
      const complete = isComplete(washer);
      const point = locationOf(washer);
      return <article key={washer.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><h2 className="text-xl font-bold text-slate-900">{washer.profile?.full_name || "Name missing"}</h2><p className="mt-1 text-sm text-slate-500">{washer.email || "Email unavailable"} · Account {washer.user_id}</p></div>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800">Pending verification</span>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Contact</p><p className="mt-2 flex items-center gap-2 text-sm"><Phone size={15} />{washer.profile?.phone || "Phone missing"}</p><p className="mt-2 text-sm">Status: {washer.status || "offline"}</p></div>
          <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Service location</p><p className="mt-2 flex items-start gap-2 text-sm"><MapPin className="mt-0.5 shrink-0" size={15} /><span>{washer.current_address || "Address missing"}</span></p><p className="mt-2 text-xs text-slate-500">{point?.latitude != null && point?.longitude != null ? `Map pin: ${Number(point.latitude).toFixed(5)}, ${Number(point.longitude).toFixed(5)}` : "Map location missing"}</p></div>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4"><p className="text-sm text-slate-600">{complete ? "Required account and location details are complete." : "Washer must complete their name, phone, full service address, and map location before approval."}</p><button type="button" disabled={!complete || Boolean(busyId)} onClick={() => verify(washer)} className="rounded-xl bg-blue-700 px-5 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40">{busyId === washer.id ? "Verifying…" : "Verify washer"}</button></div>
      </article>;
    })}</div>
  </section>;
}
