import { useState } from "react";
import useWasherWorkspace from "../../../hooks/useWasherWorkspace";
import WasherBookingCard from "../../../components/washer/WasherBookingCard";
import { ACTIVE_STATUSES } from "../../../services/washerWorkspaceService";
export default function WasherJobs() {
  const { data, loading, error, refresh } = useWasherWorkspace();
  const [filter, setFilter] = useState("All");
  const jobs = (data?.jobs || []).filter(job => filter === "All" || (filter === "Active" ? ACTIVE_STATUSES.includes(job.status) : ["completed", "customer_confirmed", "closed"].includes(job.status)));
  return <main className="mx-auto max-w-6xl space-y-6 p-5 lg:p-8"><div className="flex justify-between"><h1 className="text-3xl font-bold">My bookings</h1><button onClick={refresh} className="text-blue-700 underline">Refresh</button></div><p className="text-sm text-slate-500">Your latest 100 assigned bookings, with customer and service details.</p><div className="flex gap-2">{["All", "Active", "Completed"].map(label => <button key={label} onClick={() => setFilter(label)} className={"rounded-full px-5 py-2 " + (filter === label ? "bg-blue-600 text-white" : "bg-white border border-slate-200")}>{label}</button>)}</div>{loading && <p role="status">Loading bookings...</p>}{error && <p role="alert" className="text-red-700">{error}</p>}<div className="grid gap-5 lg:grid-cols-2">{jobs.map(booking => <WasherBookingCard key={booking.id} booking={booking} />)}</div>{!loading && !error && !jobs.length && <p className="rounded-xl bg-white p-8 text-center text-slate-500">No bookings in this category.</p>}</main>;
}
