import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ServiceMap from "../../components/map/ServiceMap";
import useApi from "../../hooks/useApi";
export default function OperationsMap() {
  const { data, error, refresh } = useApi("/supervisor/operations");
  const [filter, setFilter] = useState("all");
  useEffect(() => { const timer = setInterval(refresh, 15000); return () => clearInterval(timer); }, [refresh]);
  const jobs = useMemo(() => (data?.jobs || []).filter(j => filter === "all" || (filter === "unassigned" ? !j.assigned_washer_id : j.delayed)), [data, filter]);
  const points = useMemo(() => [
    ...(data?.washers || []).filter(w => !w.stale).map(w => ({ ...w.location, title: "Washer " + w.id + " · " + w.status })),
    ...jobs.map(j => ({ ...j, title: "Booking " + j.booking_number + " · " + j.status })),
  ], [data, jobs]);
  return <section className="space-y-5">
    <h1 className="text-2xl font-bold">Live operations</h1>
    <p>Refreshes every 15 seconds. Washer locations older than five minutes are excluded from the map. Delays mean an unstarted booking is over 15 minutes past its scheduled time (India time).</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <div className="flex flex-wrap gap-4"><button onClick={refresh} className="text-blue-700 underline">Refresh now</button><label>Bookings <select value={filter} onChange={e => setFilter(e.target.value)} className="rounded border p-2"><option value="all">All active</option><option value="unassigned">Unassigned</option><option value="delayed">Delayed</option></select></label></div>
    <ServiceMap points={points} className="h-[500px] rounded-2xl" />
    <p>{data?.washers.length || 0} active washer accounts · {data?.washers.filter(w => w.stale).length || 0} missing/stale locations · {jobs.length} bookings</p>
    <div className="grid gap-3 md:grid-cols-2">{jobs.map(j => <Link key={j.id} to={"/supervisor/jobs/" + j.id} className="rounded-xl border bg-white p-4"><strong>{j.booking_number}</strong><p>{j.service_address || "Address unavailable"}</p><p>{j.status} {j.delayed ? "· Delayed" : ""} {!j.assigned_washer_id ? "· Unassigned" : ""}</p><span className="text-blue-700">View and assign washer →</span></Link>)}</div>
    {data && !jobs.length && <p>No matching active bookings.</p>}
  </section>;
}
