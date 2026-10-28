import { useEffect } from "react";
import { CheckCircle2, RefreshCw } from "lucide-react";
import useApi from "../../hooks/useApi";

export default function ServiceCompletionFeed() {
  const { data, error, loading, refresh } = useApi("/finance/service-completions");
  useEffect(() => {
    const timer = setInterval(refresh, 30_000);
    return () => clearInterval(timer);
  }, [refresh]);

  const jobs = data?.jobs || [];
  return <section aria-labelledby="service-completions-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-emerald-700"><CheckCircle2 size={15}/> Washer updates</p>
        <h2 id="service-completions-title" className="mt-1 text-xl font-bold text-slate-950">Washer completed jobs</h2>
        <p className="mt-1 text-sm text-slate-500">Latest services submitted by washers, including supervisor review status.</p>
      </div>
      <button type="button" onClick={refresh} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={15} className={loading ? "animate-spin" : ""}/>Refresh</button>
    </div>
    {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">Unable to load completed jobs: {error}</p>}
    {loading && !data ? <p role="status" className="mt-5 text-sm text-slate-500">Loading completed jobs…</p> : jobs.length ? <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-[650px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-3">Booking</th><th className="px-3 py-3">Washer</th><th className="px-3 py-3">Completed at</th><th className="px-3 py-3">Review</th></tr></thead>
        <tbody className="divide-y divide-slate-100">{jobs.map(job => <tr key={job.id}>
          <td className="px-3 py-3"><strong className="font-mono text-slate-800">{job.booking_number || job.id}</strong><p className="mt-1 max-w-xs truncate text-xs text-slate-500">{job.service_address || "Address unavailable"}</p></td>
          <td className="px-3 py-3"><span className="font-medium text-slate-800">{job.washer?.name || "Washer not assigned"}</span>{job.washer?.phone && <p className="mt-1 text-xs text-slate-500">{job.washer.phone}</p>}</td>
          <td className="px-3 py-3 text-slate-600">{formatDateTime(job.service_completed_at)}</td>
          <td className="px-3 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${job.status === "service_completed" && !job.service_validated_at ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}>{job.status === "service_completed" && !job.service_validated_at ? "Needs supervisor review" : "Reviewed · " + job.status.replaceAll("_", " ")}</span></td>
        </tr>)}</tbody>
      </table>
    </div> : !error && <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No washer-completed jobs yet.</p>}
  </section>;
}

function formatDateTime(value) {
  if (!value) return "Time unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Time unavailable" : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
