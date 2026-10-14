import { Link } from "react-router-dom";
import { Car, MapPin, Phone, Clock3 } from "lucide-react";
export function ContactButtons({ phone }) {
  const number = String(phone || "").replace(/[^+0-9]/g, "");
  if (!number) return <p className="text-sm text-slate-500">Customer phone unavailable</p>;
  return <div className="flex flex-wrap gap-3"><a href={"tel:" + number} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"><Phone size={16} />Call customer</a><a href={"sms:" + number} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold">Send SMS</a></div>;
}
export default function WasherBookingCard({ booking, assignment, busy, onAccept, onReject, hideLink }) {
  const statusLabel = booking.status === "service_completed"
    ? "Awaiting validation"
    : booking.status === "completed"
      ? "Completed"
      : ["washer_assigned", "washer_on_the_way", "washer_arrived", "otp_verified", "service_started"].includes(booking.status)
        ? "In Progress"
        : booking.status?.replaceAll("_", " ");
  return <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <header className={"flex flex-wrap items-center justify-between gap-3 p-5 " + (assignment ? "bg-blue-600 text-white" : "border-b border-slate-100")}>
      <div><p className="text-xs font-semibold uppercase tracking-wide">{assignment ? "New wash request" : statusLabel}</p><h2 className="mt-1 text-xl font-bold">{booking.package?.name || "Car wash"}</h2><p className="mt-1 text-sm">Booking {booking.booking_number}</p></div>
      {assignment && <span className="text-sm">Expires {new Date(assignment.expires_at).toLocaleTimeString()}</span>}
    </header>
    <div className="space-y-5 p-5">
      <div><h3 className="text-lg font-bold">{booking.customer?.name || "Customer"}</h3><p className="mt-1 break-all text-xs text-slate-500">Customer ID: {booking.customer?.referenceId || "Unavailable"}</p></div>
      <div className="grid gap-4 text-sm sm:grid-cols-2">
        <div className="flex gap-2"><Car size={18} className="shrink-0 text-blue-600" /><div><p className="font-semibold">{[booking.vehicle?.brand, booking.vehicle?.model].filter(Boolean).join(" ") || "Vehicle details unavailable"}</p><p className="mt-1 text-slate-500">{[booking.vehicle?.vehicle_number, booking.vehicle?.colour, booking.vehicle?.vehicle_type].filter(Boolean).join(" · ")}</p></div></div>
        <div className="flex gap-2"><Clock3 size={18} className="shrink-0 text-blue-600" /><div><p className="font-semibold">{booking.scheduled_date} · {booking.scheduled_start_time}</p><p className="mt-1 text-slate-500">{booking.package?.duration_minutes ? booking.package.duration_minutes + " minute service" : "Duration unavailable"}</p></div></div>
      </div>
      <div className="flex gap-2 rounded-xl bg-slate-50 p-4 text-sm"><MapPin size={18} className="shrink-0 text-blue-600" /><p>{booking.location?.address || "Address unavailable"}</p></div>
      {booking.customer_notes && <p className="rounded-xl bg-amber-50 p-3 text-sm"><strong>Customer instructions:</strong> {booking.customer_notes}</p>}
      <div className="flex flex-wrap justify-between gap-4 border-t border-slate-100 pt-4"><div><p className="text-xs text-slate-500">Booking total</p><p className="text-xl font-bold">₹{Number(booking.total_amount || 0).toLocaleString("en-IN")}</p></div><div className="text-sm"><p className="font-semibold capitalize">{booking.payment?.method?.replaceAll("_", " ")}</p><p className="text-slate-500">Payment: {booking.payment?.status}</p>{assignment?.distance_km != null && <p>{assignment.distance_km} km at offer time</p>}</div></div>
      <ContactButtons phone={booking.customer?.phone} />
      {assignment ? <div className="grid grid-cols-2 gap-3"><button disabled={busy} onClick={onReject} className="rounded-xl border border-red-200 p-3 font-semibold text-red-700 disabled:opacity-50">Decline</button><button disabled={busy} onClick={onAccept} className="rounded-xl bg-green-600 p-3 font-semibold text-white disabled:opacity-50">{busy ? "Updating..." : "Accept booking"}</button></div> : !hideLink && <Link to={"/washer/jobs/" + booking.id} className="block rounded-xl bg-blue-600 p-3 text-center font-semibold text-white">View booking details</Link>}
    </div>
  </article>;
}
