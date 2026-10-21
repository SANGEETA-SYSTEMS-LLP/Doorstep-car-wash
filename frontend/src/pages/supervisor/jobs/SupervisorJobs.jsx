import { useEffect, useState } from "react";
import { supabase } from "../../../services/auth/supabase";
import { getSupervisorJobs } from "../../../services/supervisor/supervisorService";
import SupervisorJobCard from "./SupervisorJobCard";
import { RefreshCw } from "lucide-react";

export default function SupervisorJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const [filter, setFilter] = useState("requests");
  const isRequest = job => job.status === "pending" && !job.assigned_washer_id;
  useEffect(() => {
    let active = true, pending = false;
    const load = async () => {
      if (pending) return;
      pending = true;
      try { const data = await getSupervisorJobs(); if (active) { setJobs(data.jobs || []); setError(""); } }
      catch (err) { if (active) setError(err.message || "Unable to load bookings."); }
      finally { pending = false; if (active) setLoading(false); }
    };
    const channel = supabase.channel("supervisor-active-bookings").on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, load).subscribe();
    load();
    const timer = setInterval(load, 15000);
    return () => { active = false; clearInterval(timer); supabase.removeChannel(channel); };
  }, [version]);
  const visible = jobs.filter(job => filter === "all" || (filter === "requests" ? isRequest(job) : !job.assigned_washer_id && !isRequest(job))).sort((a,b) => Date.parse(b.created_at || 0) - Date.parse(a.created_at || 0));
  return <section className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Booking inbox</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Active jobs</h1><p className="mt-3 leading-7 text-slate-600">New booking requests appear here automatically. Review each booking and location, then offer it to a nearby washer.</p></div><button type="button" onClick={() => setVersion(v => v + 1)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800"><RefreshCw size={16} />Refresh</button></div>
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-950"><span className="h-2 w-2 rounded-full bg-emerald-500" />Updates every 15 seconds <span className="hidden text-blue-300 sm:inline">·</span><span className="text-blue-800/80">The washer accepts the offer before their details appear to the customer.</span></div>
    <div className="flex flex-wrap gap-2">{[["requests", "New requests", jobs.filter(isRequest).length], ["unassigned", "Awaiting washer", jobs.filter(j => !j.assigned_washer_id && !isRequest(j)).length], ["all", "All active", jobs.length]].map(([value,label,count]) => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)} className={"inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition " + (filter === value ? "border-blue-900 bg-blue-900 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50")}>{label}<span className={"rounded-md px-1.5 py-0.5 text-xs " + (filter === value ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500")}>{count}</span></button>)}</div>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
    {loading ? <div role="status" className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white" />)}<span className="sr-only">Loading booking requests…</span></div> : <div className="space-y-4">{visible.map(job => <SupervisorJobCard key={job.id} job={job} />)}{!error && !visible.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">{filter === "requests" ? "No new requests. Incoming bookings will appear here." : "No bookings in this view."}</div>}</div>}
  </section>;
}
