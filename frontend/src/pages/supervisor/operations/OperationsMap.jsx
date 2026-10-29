import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, RefreshCw, MapPin } from "lucide-react";
import ServiceMap from "../../../components/map/ServiceMap";
import useApi from "../../../hooks/useApi";
export default function OperationsMap() {
  const { data, error, refresh } = useApi("/supervisor/operations");
  const [filter, setFilter] = useState("all");
  useEffect(() => { const timer = setInterval(refresh, 15000); return () => clearInterval(timer); }, [refresh]);
  const jobs = useMemo(() => (data?.jobs || []).filter(j => filter === "all" || (filter === "unassigned" ? !j.assigned_washer_id : j.delayed)), [data, filter]);
  const points = useMemo(() => [
    ...(data?.washers || []).filter(w => !w.stale).map(w => ({ ...w.location, title: "Washer " + w.id + " · " + w.status })),
    ...jobs.map(j => ({ ...j, title: "Booking " + j.booking_number + " · " + j.status })),
  ], [data, jobs]);
  return <section className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700">Operations overview</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Live operations</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">Monitor active washer locations and bookings across service areas.</p></div><button type="button" onClick={refresh} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"><RefreshCw size={16} />Refresh now</button></header>
    <p className="flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50/70 p-4 text-sm leading-6 text-green-950"><MapPin size={18} className="mt-0.5 shrink-0 text-green-700" /><span><strong>Service coverage:</strong> all cities and areas. Bookings are accepted at any valid address; washer assignment depends on availability.</span></p>
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[0.02]"><p className="max-w-3xl text-sm leading-6 text-slate-500"><Activity size={16} className="mr-2 inline text-green-700" />Refreshes every 15 seconds. Washer locations older than five minutes are excluded. Delays mean an unstarted booking is over 15 minutes past its scheduled time (India time).</p><label className="flex items-center gap-3 text-sm font-semibold text-slate-700">Bookings <select value={filter} onChange={e => setFilter(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="all">All active</option><option value="unassigned">Unassigned</option><option value="delayed">Delayed</option></select></label></div>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-sm"><ServiceMap points={points} className="h-[500px] rounded-xl" /></div>
    {data && <div className="grid gap-3 sm:grid-cols-3"><Summary label="Active washer accounts" value={data.washers.length} /><Summary label="Missing or stale locations" value={data.washers.filter(w => w.stale).length || 0} /><Summary label="Bookings in view" value={jobs.length} /></div>}
    <div className="grid gap-3 md:grid-cols-2">{jobs.map(j => <Link key={j.id} to={"/supervisor/jobs/" + j.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors duration-150 hover:border-green-200"><div className="flex items-start justify-between gap-3"><strong className="text-slate-950">{j.booking_number}</strong><span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold capitalize text-green-800">{j.status.replaceAll("_", " ")}</span></div><p className="mt-3 text-sm text-slate-600">{j.service_address || "Address unavailable"}</p><p className="mt-1 text-xs text-slate-500">{j.delayed ? "Delayed · " : ""}{!j.assigned_washer_id ? "Unassigned" : "Washer assigned"}</p><span className="mt-4 inline-block text-sm font-semibold text-green-800">View and assign washer <span aria-hidden="true">→</span></span></Link>)}</div>
    {data && !jobs.length && <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No matching active bookings.</p>}
  </section>;
}

function Summary({ label, value }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold tabular-nums text-slate-950">{value}</p></div>;
}
