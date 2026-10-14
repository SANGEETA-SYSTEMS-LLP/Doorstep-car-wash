import { Link } from "react-router-dom";
import WasherBookingCard from "../../../components/washer/WasherBookingCard";
import ServiceMap from "../../../components/map/ServiceMap";
export default function WasherJobDetailsContent({ booking, onStart, starting }) {
  const statusLabel = booking.status === "service_completed"
    ? "Awaiting validation"
    : booking.status === "completed"
      ? "Completed"
      : ["washer_assigned", "washer_on_the_way", "washer_arrived", "otp_verified", "service_started"].includes(booking.status)
        ? "In Progress"
        : booking.status?.replaceAll("_", " ");
  return <div className="grid gap-6 lg:grid-cols-2"><WasherBookingCard booking={booking} hideLink /><section className="space-y-5"><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><ServiceMap location={booking.location} className="h-80" /><p className="break-all p-4 text-xs text-slate-500">Washer ID: {booking.washerReferenceId}</p></div><div className="rounded-2xl bg-slate-900 p-6 text-white"><h2 className="text-xl font-bold">Your next step</h2><p className="mt-2 text-sm text-slate-300">{statusLabel}</p>{booking.status === "washer_assigned" && <button onClick={onStart} disabled={starting} className="mt-5 w-full rounded-xl bg-white p-3 font-semibold text-slate-900 disabled:opacity-50">{starting ? "Starting..." : "Start navigation"}</button>}{booking.status === "washer_on_the_way" && <Link to={"/washer/jobs/" + booking.id + "/navigation"} className="mt-5 block rounded-xl bg-white p-3 text-center font-semibold text-slate-900">Continue navigation</Link>}{["washer_arrived", "otp_verified", "service_started"].includes(booking.status) && <Link to={"/washer/jobs/" + booking.id + "/service"} className="mt-5 block rounded-xl bg-white p-3 text-center font-semibold text-slate-900">Open service checklist</Link>}{["service_completed", "completed"].includes(booking.status) && <Link to={"/washer/jobs/" + booking.id + "/service"} className="mt-5 block rounded-xl bg-white p-3 text-center font-semibold text-slate-900">{booking.status === "completed" ? "View completed service" : "Validate submitted photos"}</Link>}</div></section></div>;
}
