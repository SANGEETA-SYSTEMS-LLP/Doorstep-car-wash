import { useEffect, useState } from "react";
import { Activity, ArrowUpRight, BadgeCheck, BriefcaseBusiness, CircleCheckBig, CircleDollarSign, RefreshCw, TriangleAlert, Users, Wifi } from "lucide-react";
import { Link } from "react-router-dom";
import { getSupervisorDashboard, getSupervisorWasherRoster } from "../../../services/supervisor/supervisorService";
import SupervisorWasherRoster from "../washers/SupervisorWasherRoster";

const emptyStats = { activeJobs: 0, escalations: 0, pendingExtraCharges: 0, completedToday: 0 };
const emptyRoster = { washers: 0, online: 0, verified: 0, pendingVerification: 0, inactive: 0, acceptedAssignments: 0, activeJobs: 0, totalEarnings: 0, pendingPayout: 0 };

function money(value) {
  return Number(value || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}

function Metric({ label, value, note, icon: Icon, tone = "blue", loading }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
  };
  return <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.03] transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0"><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{loading ? <span className="inline-block h-9 w-16 animate-pulse rounded bg-slate-100" /> : value}</p><p className="mt-1 text-xs text-slate-500">{note}</p></div>
      <span className={`rounded-xl p-3 ring-1 ${tones[tone]}`}><Icon size={20} /></span>
    </div>
  </article>;
}

export default function SupervisorDashboard() {
  const [stats, setStats] = useState(emptyStats);
  const [roster, setRoster] = useState({ summary: emptyRoster, washers: [] });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({ dashboard: "", roster: "" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrors({ dashboard: "", roster: "" });
    Promise.allSettled([getSupervisorDashboard(), getSupervisorWasherRoster()]).then(([dashboardResult, rosterResult]) => {
      if (cancelled) return;
      if (dashboardResult.status === "fulfilled") setStats(dashboardResult.value.stats || emptyStats);
      else setErrors(current => ({ ...current, dashboard: dashboardResult.reason?.message || "Supervisor metrics could not be loaded." }));
      if (rosterResult.status === "fulfilled") setRoster({ summary: { ...emptyRoster, ...rosterResult.value.summary }, washers: rosterResult.value.washers || [] });
      else setErrors(current => ({ ...current, roster: rosterResult.reason?.message || "Washer roster could not be loaded." }));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [attempt]);

  const summary = roster.summary;
  return <div className="space-y-7">
    <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-lg sm:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 -z-10 h-72 w-72 rounded-full border-[42px] border-white/[0.06]" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-[-7rem] right-1/3 -z-10 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div><p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-100"><Activity size={14} /> Operations overview</p><h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Supervisor dashboard</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">A live view of your washer network, accepted work, service progress, and earnings.</p></div>
        <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setAttempt(value => value + 1)} disabled={loading} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/15 disabled:opacity-50"><RefreshCw size={16} className={loading ? "animate-spin" : ""} />Refresh</button><Link to="/supervisor/washers/review" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-900 transition hover:bg-blue-50"><BadgeCheck size={16} />Review washers<ArrowUpRight size={15} /></Link></div>
      </div>
      <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/10 pt-5 text-sm text-slate-300"><span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400" />{loading ? "Updating workforce" : `${summary.online} washer${summary.online === 1 ? "" : "s"} online`}</span><span>{loading ? "Loading assignments" : `${summary.activeJobs} active job${summary.activeJobs === 1 ? "" : "s"}`}</span><span>{loading ? "Loading earnings" : `${money(summary.pendingPayout)} pending washer payout`}</span></div>
    </section>

    {errors.dashboard && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p>{errors.dashboard}</p><button type="button" onClick={() => setAttempt(value => value + 1)} className="font-semibold underline">Retry</button></div>}

    <section aria-label="Platform and washer metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Total washers" value={summary.washers} note={`${summary.verified} supervisor verified`} icon={Users} loading={loading} />
      <Metric label="Online now" value={summary.online} note="Available for eligible jobs" icon={Wifi} tone="green" loading={loading} />
      <Metric label="Pending verification" value={summary.pendingVerification} note="Needs supervisor review" icon={BadgeCheck} tone="amber" loading={loading} />
      <Metric label="Accepted assignments" value={summary.acceptedAssignments} note={`${summary.activeJobs} currently active`} icon={BriefcaseBusiness} tone="violet" loading={loading} />
      <Metric label="Washer earnings" value={money(summary.totalEarnings)} note={`${money(summary.pendingPayout)} awaiting payout`} icon={CircleDollarSign} tone="green" loading={loading} />
      <Metric label="Active bookings" value={stats.activeJobs} note="In the service pipeline" icon={Activity} loading={loading} />
      <Metric label="Escalations" value={stats.escalations} note="Require operations attention" icon={TriangleAlert} tone="amber" loading={loading} />
      <Metric label="Completed today" value={stats.completedToday} note={`${stats.pendingExtraCharges} extra charges awaiting review`} icon={CircleCheckBig} tone="slate" loading={loading} />
    </section>

    <section aria-label="Washer earnings breakdown" className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.03] sm:p-6">
      <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Finance overview</p><h2 className="mt-1 text-xl font-bold text-slate-950">Washer earnings breakdown</h2><p className="mt-1 text-sm text-slate-500">Gross service value, platform commission, washer earnings, and payout status across the roster.</p></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Gross service value", summary.grossEarnings, "slate"],
          ["Platform commission", summary.platformCommission, "blue"],
          ["Washer earnings", summary.totalEarnings, "green"],
          ["Pending payout", summary.pendingEarnings, "amber"],
          ["Settled payout", summary.settledEarnings, "violet"],
        ].map(([label, amount, tone]) => <div key={label} className={`rounded-xl border p-4 ${tone === "green" ? "border-emerald-100 bg-emerald-50/60" : tone === "amber" ? "border-amber-100 bg-amber-50/60" : tone === "violet" ? "border-violet-100 bg-violet-50/60" : tone === "blue" ? "border-blue-100 bg-blue-50/60" : "border-slate-100 bg-slate-50"}`}>
          <p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-2 text-xl font-bold tabular-nums text-slate-950">{loading ? "—" : money(amount)}</p>
        </div>)}
      </div>
    </section>

    <SupervisorWasherRoster washers={roster.washers} loading={loading} error={errors.roster} onRetry={() => setAttempt(value => value + 1)} />
  </div>;
}
