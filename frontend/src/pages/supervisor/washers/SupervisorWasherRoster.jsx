import { matchesWasherLocation } from "./washerDirectoryUtils.js";
import { useMemo, useState } from "react";
import { ArrowUpRight, MapPin, Search, UserRound, Wifi } from "lucide-react";
import { Link } from "react-router-dom";

const filters = ["All washers", "Online", "Pending review", "Offline", "On a job", "Inactive"];

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}

function statusFor(washer) {
  if (!washer.active) return { label: "Inactive", className: "bg-slate-100 text-slate-600" };
  if (!washer.verified) return { label: "Pending review", className: "bg-amber-50 text-amber-800" };
  if (washer.status === "available") return { label: "Online", className: "bg-emerald-50 text-emerald-800" };
  if (washer.status === "busy") return { label: "On a job", className: "bg-green-50 text-green-800" };
  return { label: "Offline", className: "bg-slate-100 text-slate-600" };
}

function WasherIdentity({ washer }) {
  const initials = washer.name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "W";
  return <div className="flex min-w-0 items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-green-800">{initials}</span><div className="min-w-0"><p className="truncate font-semibold text-slate-900">{washer.name}</p><p className="mt-0.5 truncate text-xs text-slate-500">{washer.phone || "Phone not provided"}</p></div></div>;
}

export default function SupervisorWasherRoster({ washers = [], loading, error, onRetry }) {
  const [filter, setFilter] = useState("All washers");
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const shown = useMemo(() => washers.filter(washer => {
    const status = statusFor(washer).label;
    const matchesFilter = filter === "All washers" || (filter === "Pending review" ? !washer.verified && washer.active : status === filter);
    const haystack = `${washer.name} ${washer.phone || ""} ${washer.address || ""}`.toLowerCase();
    return matchesFilter && haystack.includes(search.trim().toLowerCase()) && matchesWasherLocation(washer.address, location);
  }), [washers, filter, search, location]);

  return <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.03]">
    <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
      <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700">Workforce</p><h2 className="mt-1 text-xl font-bold text-slate-950">Washer directory</h2><p className="mt-1 text-sm text-slate-500">Availability, assigned work, and verified earnings for every washer.</p></div>
      <label className="relative block w-full lg:max-w-xs"><span className="sr-only">Search washers</span><Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name, phone, address" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-green-400 focus:bg-white focus:ring-2 focus:ring-green-100" /></label>
    </div>

    <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
      <label className="block text-sm font-semibold text-slate-700">Filter by registered location<input value={location} onChange={event => setLocation(event.target.value)} placeholder="City, area or postal code, e.g. Bhubaneswar or 751001" className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal" /></label>
      <p role="status" className="mt-2 text-sm text-slate-500">{loading ? "Loading washers..." : `${shown.length} matching washers`}. All statuses are included when All washers is selected. Matches use the saved address.</p>
    </div>

    <div className="flex flex-wrap gap-2 border-b border-slate-100 px-5 py-3 sm:px-6">{filters.map(item => <button key={item} type="button" onClick={() => setFilter(item)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition ${filter === item ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"}`}>{item}</button>)}</div>

    {error && <div role="alert" className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:m-6">{error} <button type="button" onClick={onRetry} className="ml-2 font-semibold underline">Retry</button></div>}
    {loading ? <div className="space-y-3 p-5 sm:p-6" role="status"><span className="sr-only">Loading washer directory</span>{[1, 2, 3].map(item => <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}</div> : !error && shown.length === 0 ? <div className="p-10 text-center"><UserRound size={28} className="mx-auto text-slate-300" /><p className="mt-3 font-semibold text-slate-800">No washers match this view</p><p className="mt-1 text-sm text-slate-500">Clear your location or search filter, or choose All washers. Washers need a saved address to match a location.</p></div> : <>
      <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-2">{shown.map(washer => {
        const status = statusFor(washer);
        return <article key={washer.id} className="min-w-0 space-y-4 rounded-xl border border-slate-100 bg-white p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><WasherIdentity washer={washer} /><span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.className}`}>{status.label}</span></div>{washer.address && <p className="flex items-start gap-1.5 text-xs text-slate-500"><MapPin size={14} className="mt-0.5 shrink-0" />{washer.address}</p>}<div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Accepted assignments</p><p className="mt-1 font-bold text-slate-900">{washer.acceptedAssignments}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Active jobs</p><p className="mt-1 font-bold text-slate-900">{washer.activeJobs}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Gross service value</p><p className="mt-1 font-bold text-slate-900">{formatMoney(washer.grossEarnings)}</p></div><div className="rounded-xl bg-green-50/70 p-3"><p className="text-xs text-slate-500">Platform commission</p><p className="mt-1 font-bold text-slate-900">{formatMoney(washer.platformCommission)}</p></div><div className="rounded-xl bg-emerald-50/70 p-3"><p className="text-xs text-slate-500">Washer earned</p><p className="mt-1 font-bold text-slate-900">{formatMoney(washer.totalEarnings)}</p></div><div className="rounded-xl bg-amber-50/70 p-3"><p className="text-xs text-slate-500">Pending payout</p><p className="mt-1 font-bold text-slate-900">{formatMoney(washer.pendingEarnings)}</p></div><div className="rounded-xl bg-emerald-50/70 p-3"><p className="text-xs text-slate-500">Settled payout</p><p className="mt-1 font-bold text-slate-900">{formatMoney(washer.settledEarnings)}</p></div><div className="rounded-xl bg-green-50 p-3"><p className="text-xs text-slate-500">Payment method</p><p className="mt-1 font-bold text-slate-900">{washer.payoutMethod}</p><p className="mt-1 text-xs text-slate-500">{washer.payoutDestination||"Destination not set"}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Payment status</p><p className="mt-1 font-bold text-amber-700">{washer.pendingPayoutCount||0} pending</p><p className="mt-1 font-bold text-emerald-700">{washer.paidPayoutCount||0} paid</p></div></div>{!washer.verified && washer.active && <Link to="/supervisor/washers/review" className="inline-flex items-center gap-1 text-sm font-semibold text-green-700">Review application<ArrowUpRight size={14} /></Link>}</article>;
      })}</div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-3 text-xs text-slate-500 sm:px-6"><span>Showing {shown.length} of {washers.length} washer{washers.length === 1 ? "" : "s"}</span><span className="inline-flex items-center gap-1.5"><Wifi size={13} className="text-emerald-600" />Live status is updated when a washer refreshes their workspace.</span></footer>
    </>}
  </section>;
}
