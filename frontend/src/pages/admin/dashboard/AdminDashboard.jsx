import { Link } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Building2,
  CarFront,
  CheckCircle2,
  ClipboardList,
  FileText,
  LifeBuoy,
  MapPinned,
  Package,
  RefreshCw,
  Settings2,
  Users,
  Wrench,
} from "lucide-react";
import useApi from "../../../hooks/useApi";
import { useAuth } from "../../../context/AuthContext";
import ServiceCompletionFeed from "../../../components/operations/ServiceCompletionFeed";

const statIcons = {
  customers: Users,
  washers: CarFront,
  bookings: ClipboardList,
  societies: Building2,
  zones: MapPinned,
  services: Wrench,
};

const statRoutes = {
  customers: "customers",
  washers: "washers",
  bookings: "bookings",
  societies: "societies",
  zones: "zones",
  services: "services",
};

const shortcuts = [
  { title: "Bookings", description: "Review customer requests and service progress.", path: "bookings", icon: ClipboardList, tone: "blue" },
  { title: "Live operations", description: "See active service locations and washer activity.", path: "operations", icon: MapPinned, tone: "cyan" },
  { title: "Customer support", description: "Pick up open tickets and follow up on issues.", path: "support", icon: LifeBuoy, tone: "violet" },
  { title: "Packages and pricing", description: "Maintain the services customers can book.", path: "packages", icon: Package, tone: "amber" },
  { title: "Payment confirmations", description: "Review washer payouts and payment status.", path: "finance", icon: Banknote, tone: "emerald" },
  { title: "Reports", description: "Review operating and finance activity by date.", path: "reports", icon: FileText, tone: "slate" },
];

const toneStyles = {
  blue: "bg-blue-50 text-blue-700 ring-blue-100",
  cyan: "bg-cyan-50 text-cyan-700 ring-cyan-100",
  violet: "bg-violet-50 text-violet-700 ring-violet-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
};

function CountCard({ stat }) {
  const Icon = statIcons[stat.key] || Settings2;
  const path = statRoutes[stat.key] || stat.key;
  return (
    <Link
      to={`/admin/${path}`}
      className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/3 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-xl bg-slate-50 p-2.5 text-slate-600 ring-1 ring-slate-100 transition group-hover:bg-blue-50 group-hover:text-blue-700">
          <Icon size={19} aria-hidden="true" />
        </span>
        <ArrowUpRight size={17} className="text-slate-300 transition group-hover:text-blue-600" aria-hidden="true" />
      </div>
      <p className="mt-5 text-sm font-medium text-slate-500">{stat.label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums text-slate-950">
        {Number(stat.count || 0).toLocaleString("en-IN")}
      </p>
      <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-700">
        Open records <ArrowUpRight size={13} aria-hidden="true" />
      </p>
    </Link>
  );
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const { data, loading, error, refresh } = useApi("/admin/dashboard");
  const visibleShortcuts = shortcuts.filter(item => item.path !== "finance" || profile?.role === "super_admin");
  const totalRecords = (data?.stats || []).reduce((sum, stat) => sum + Number(stat.count || 0), 0);
  const firstName = profile?.full_name?.trim()?.split(/\s+/)[0] || "Admin";

  return (
    <section className="mx-auto max-w-7xl space-y-8">
      <header className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-7 text-white shadow-lg shadow-slate-900/10 sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-2 -top-14 h-52 w-52 rounded-full border border-white/10" />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> WashNow · Administration
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Good to see you, {firstName}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Your operations at a glance. Open a workspace below to manage the day’s work.
            </p>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-wait disabled:opacity-60 sm:self-auto"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} aria-hidden="true" />
            {loading ? "Updating…" : "Refresh overview"}
          </button>
        </div>
        <div className="relative mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-5 text-xs text-slate-300">
          <span className="inline-flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-400" aria-hidden="true" />Workspace access verified</span>
          <span className="inline-flex items-center gap-2"><ClipboardList size={15} className="text-blue-300" aria-hidden="true" />{loading ? "Loading platform records" : `${totalRecords.toLocaleString("en-IN")} total records`}</span>
        </div>
      </header>

      <section aria-labelledby="platform-overview">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Platform overview</p>
            <h2 id="platform-overview" className="mt-1 text-xl font-bold tracking-tight text-slate-950">Your operating footprint</h2>
          </div>
          <p className="text-xs text-slate-500">Record totals across the platform</p>
        </div>
        {error ? (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div><p className="font-semibold text-red-900">Overview could not be loaded</p><p className="mt-1 text-sm text-red-700">{error}</p></div>
              <button type="button" onClick={refresh} className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-800 hover:bg-red-100">Try again</button>
            </div>
          </div>
        ) : loading ? (
          <div role="status" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <span className="sr-only">Loading platform totals</span>
            {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white" />)}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {(data?.stats || []).map(stat => <CountCard key={stat.key} stat={stat} />)}
            {!data?.stats?.length && <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><p className="font-semibold text-slate-800">No overview records yet</p><p className="mt-1 text-sm text-slate-500">Platform totals will appear here when records are available.</p></div>}
          </div>
        )}
      </section>

      <section aria-labelledby="daily-management">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Workspaces</p><h2 id="daily-management" className="mt-1 text-xl font-bold tracking-tight text-slate-950">Daily management</h2></div>
          <p className="text-xs text-slate-500">Choose a workspace to continue</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleShortcuts.map(({ title, description, path, icon: Icon, tone }) => (
            <Link key={path} to={`/admin/${path}`} className="group flex min-h-32 items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/2 transition hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <span className={`shrink-0 rounded-xl p-2.5 ring-1 ${toneStyles[tone]}`}><Icon size={19} aria-hidden="true" /></span>
              <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="font-semibold text-slate-900">{title}</span><ArrowUpRight size={16} className="shrink-0 text-slate-300 transition group-hover:text-blue-600" aria-hidden="true" /></span><span className="mt-1.5 block text-sm leading-5 text-slate-500">{description}</span></span>
            </Link>
          ))}
        </div>
      </section>
      <ServiceCompletionFeed />
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-4 text-xs text-slate-500">
        <span>WashNow Admin · {profile?.role?.replaceAll("_", " ") || "Authorized workspace"}</span>
        <span className="inline-flex items-center gap-1.5"><ArrowDownRight size={13} aria-hidden="true" />Data reflects the latest dashboard refresh</span>
      </footer>
    </section>
  );
}
