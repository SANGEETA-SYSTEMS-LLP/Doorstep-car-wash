import { useState } from "react";
import { BriefcaseBusiness, CheckCircle2, Clock3, RefreshCw } from "lucide-react";
import useWasherWorkspace from "../../../hooks/useWasherWorkspace";
import WasherBookingCard from "../../../components/washer/WasherBookingCard";
import { ACTIVE_STATUSES } from "../../../services/washer/washerWorkspaceService";

const completedStatuses = ["completed", "customer_confirmed", "payment_completed", "closed"];
const filters = [
  { label: "All jobs", key: "All", icon: BriefcaseBusiness },
  { label: "Active", key: "Active", icon: Clock3 },
  { label: "Completed", key: "Completed", icon: CheckCircle2 },
];

export default function WasherJobs() {
  const { data, loading, error, errorStatus, refresh } = useWasherWorkspace();
  const [filter, setFilter] = useState("All");
  const allJobs = data?.jobs || [];
  const jobs = allJobs.filter(job => filter === "All"
    || (filter === "Active" ? ACTIVE_STATUSES.includes(job.status) : completedStatuses.includes(job.status)));
  const counts = {
    All: allJobs.length,
    Active: allJobs.filter(job => ACTIVE_STATUSES.includes(job.status)).length,
    Completed: allJobs.filter(job => completedStatuses.includes(job.status)).length,
  };

  return <main className="mx-auto max-w-7xl space-y-7 p-5 lg:p-8">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Washer partner workspace</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">My jobs</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Your assigned services, schedules, customer details, and the next step for every wash.</p>
      </div>
      <button type="button" onClick={refresh} disabled={loading} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60">
        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />Refresh jobs
      </button>
    </header>

    <section aria-label="Filter jobs" className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      {filters.map(({ label, key, icon: Icon }) => <button
        key={key}
        type="button"
        aria-pressed={filter === key}
        onClick={() => setFilter(key)}
        className={"inline-flex min-h-10 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition " + (filter === key ? "bg-blue-800 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950")}
      >
        <Icon size={16} />{label}<span className={"rounded-full px-2 py-0.5 text-xs tabular-nums " + (filter === key ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500")}>{counts[key]}</span>
      </button>)}
    </section>

    {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
      <p className="font-semibold">{error}</p>
      {errorStatus === 403 && <p className="mt-1">Ask your supervisor to confirm this account has the washer role and an active washer profile.</p>}
      <button type="button" onClick={refresh} className="mt-3 font-semibold underline">Try again</button>
    </div>}

    {loading && !allJobs.length && <div role="status" className="grid gap-5 md:grid-cols-2">
      <span className="sr-only">Loading jobs</span>
      {[0, 1].map(item => <div key={item} className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white" />)}
    </div>}

    {!loading && !error && jobs.length > 0 && <div className="grid items-start gap-5 xl:grid-cols-2">
      {jobs.map(booking => <WasherBookingCard key={booking.id} booking={booking} />)}
    </div>}

    {!loading && !error && !jobs.length && <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><BriefcaseBusiness size={24} /></span>
      <h2 className="mt-4 text-lg font-bold text-slate-900">{allJobs.length ? `No ${filter.toLowerCase()} jobs` : "No assigned jobs yet"}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{allJobs.length ? "Try another filter to see more of your work." : "When a booking is assigned to you, you’ll find its schedule and customer details here."}</p>
    </section>}
  </main>;
}
