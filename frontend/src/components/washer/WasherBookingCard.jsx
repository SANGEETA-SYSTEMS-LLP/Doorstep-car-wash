import { Link } from "react-router-dom";
import { Car, Check, Clock3, MapPin, Phone, Route } from "lucide-react";

const progressStages = ["Assigned", "On the way", "Arrived", "Washing", "Done"];

function progressIndex(status) {
  if (["service_completed", "completed", "customer_confirmed", "payment_completed", "closed"].includes(status)) return 4;
  if (["otp_verified", "service_started"].includes(status)) return 3;
  if (status === "washer_arrived") return 2;
  if (status === "washer_on_the_way") return 1;
  return 0;
}

function formatSchedule(date, time) {
  const formattedDate = date
    ? new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" }).format(new Date(`${date}T00:00:00`))
    : "Schedule unavailable";
  if (!time) return formattedDate;
  const [hour, minute] = time.split(":");
  const formattedTime = Number.isFinite(Number(hour))
    ? new Date(2000, 0, 1, Number(hour), Number(minute || 0)).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
    : time;
  return `${formattedDate} · ${formattedTime}`;
}

function navigationUrl(location) {
  const destination = location?.latitude != null && location?.longitude != null
    ? `${location.latitude},${location.longitude}`
    : location?.address;
  return destination
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
    : null;
}

export function ContactButtons({ phone }) {
  const number = String(phone || "").replace(/[^+0-9]/g, "");
  if (!number) return <p className="text-sm text-slate-500">Customer phone unavailable</p>;
  return <div className="flex flex-wrap gap-2">
    <a href={"tel:" + number} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"><Phone size={16} />Call customer</a>
    <a href={"sms:" + number} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">Send SMS</a>
  </div>;
}

export default function WasherBookingCard({ booking, assignment, busy, onAccept, onReject, hideLink }) {
  const completed = ["service_completed", "completed", "customer_confirmed", "payment_completed", "closed"].includes(booking.status);
  const statusLabel = booking.status === "service_completed"
    ? "Awaiting validation"
    : booking.status === "completed"
      ? "Completed"
      : ["washer_assigned", "washer_on_the_way", "washer_arrived", "otp_verified", "service_started"].includes(booking.status)
        ? "In progress"
        : booking.status?.replaceAll("_", " ");
  const mapsUrl = navigationUrl(booking.location);
  const jobAction = booking.status === "washer_assigned"
    ? "Start navigation"
    : booking.status === "washer_on_the_way"
      ? "Continue to customer"
      : ["washer_arrived", "otp_verified", "service_started"].includes(booking.status)
        ? "Continue wash"
        : booking.status === "service_completed"
          ? "View completion"
          : "View job";

  return <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors duration-150 hover:border-green-200">
    <header className={"flex flex-wrap items-center justify-between gap-3 p-5 " + (assignment ? "bg-green-900 text-white" : "border-b border-slate-100 bg-white")}>
      <div>
        <p className={"text-[11px] font-bold uppercase tracking-[0.16em] " + (assignment ? "text-green-200" : "text-slate-500")}>{assignment ? "New wash request" : `Booking ${booking.booking_number}`}</p>
        <h2 className="mt-1 text-xl font-bold">{booking.package?.name || "Car wash"}</h2>
        {assignment && <p className="mt-1 text-sm text-green-100">Booking {booking.booking_number}</p>}
      </div>
      {assignment && <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold">Offer ends {new Date(assignment.expires_at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</span>}
      {!assignment && <span className={"rounded-full px-3 py-1.5 text-xs font-bold capitalize " + (completed ? "bg-green-50 text-green-800" : "bg-green-50 text-green-800")}>{statusLabel}</span>}
    </header>

    <div className="space-y-5 p-5">
      {!assignment && <ol aria-label="Job progress" className="grid grid-cols-5 gap-1">
        {progressStages.map((defaultStage, index) => {
          const reached = index <= progressIndex(booking.status);
          const stage = booking.status === "service_completed" && index === 4 ? "Proof sent" : defaultStage;
          return <li key={stage} className="min-w-0 text-center">
            <span className={"mx-auto flex h-7 w-7 items-center justify-center rounded-full " + (reached ? "bg-green-700 text-white" : "bg-slate-100 text-slate-400")}>{reached ? <Check size={14} /> : <span className="text-xs">{index + 1}</span>}</span>
            <span className={"mt-1 block truncate text-[10px] sm:text-xs " + (reached ? "font-semibold text-green-800" : "text-slate-400")}>{stage}</span>
          </li>;
        })}
      </ol>}

      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Customer</p>
        <h3 className="mt-1 text-lg font-bold text-slate-900">{booking.customer?.name || "Customer"}</h3>
        {booking.customer?.referenceId && <p className="mt-0.5 break-all text-xs text-slate-500">Partner ID · {booking.customer.referenceId}</p>}
      </div>

      <div className="grid gap-4 text-sm sm:grid-cols-2">
        <div className="flex gap-3 rounded-xl border border-slate-100 p-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700"><Car size={18} /></span><div><p className="font-semibold text-slate-800">{[booking.vehicle?.brand, booking.vehicle?.model].filter(Boolean).join(" ") || "Vehicle details unavailable"}</p><p className="mt-1 text-xs text-slate-500">{[booking.vehicle?.vehicle_number, booking.vehicle?.colour, booking.vehicle?.vehicle_type].filter(Boolean).join(" · ") || "Vehicle information unavailable"}</p></div></div>
        <div className="flex gap-3 rounded-xl border border-slate-100 p-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700"><Clock3 size={18} /></span><div><p className="font-semibold text-slate-800">{formatSchedule(booking.scheduled_date, booking.scheduled_start_time)}</p><p className="mt-1 text-xs text-slate-500">{booking.package?.duration_minutes ? booking.package.duration_minutes + " minute service" : "Duration unavailable"}</p></div></div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-green-100 bg-green-50/70 p-4 text-sm">
        <div className="flex min-w-0 gap-3"><span className="mt-0.5 shrink-0 text-green-700"><MapPin size={18} /></span><div><p className="mb-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">Service address</p><p className="break-words text-slate-800">{booking.location?.address || "Address unavailable"}</p></div></div>
        {mapsUrl && <a href={mapsUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg bg-white px-3 font-semibold text-green-800 shadow-sm transition hover:bg-green-100"><Route size={16} />Navigate</a>}
      </div>

      {booking.customer_notes && <p className="rounded-xl bg-amber-50 p-3 text-sm"><strong>Customer instructions:</strong> {booking.customer_notes}</p>}

      <div className="flex flex-wrap items-end justify-between gap-4 border-t border-slate-100 pt-4">
        <div><p className="text-xs font-medium text-slate-500">Booking total</p><p className="mt-0.5 text-xl font-bold tabular-nums text-slate-950">₹{Number(booking.total_amount || 0).toLocaleString("en-IN")}</p></div>
        <div className="text-right text-xs"><p className="font-semibold capitalize text-slate-700">{booking.payment?.method?.replaceAll("_", " ") || "Payment method unavailable"}</p><p className="mt-1 text-slate-500">Payment · {booking.payment?.status || "Not recorded"}</p>{assignment?.distance_km != null && <p className="mt-1 text-slate-500">{assignment.distance_km} km away at offer</p>}</div>
      </div>

      <ContactButtons phone={booking.customer?.phone} />
      {assignment ? <div className="grid grid-cols-2 gap-3">
        <button disabled={busy} onClick={onReject} className="rounded-xl border border-red-200 p-3 font-semibold text-red-700 disabled:opacity-50">Decline</button>
        <button disabled={busy} onClick={onAccept} className="rounded-xl bg-green-600 p-3 font-semibold text-white disabled:opacity-50">{busy ? "Confirming..." : "Accept & confirm booking"}</button>
      </div> : !hideLink && <Link to={"/washer/jobs/" + booking.id} className={"block rounded-xl p-3 text-center font-semibold " + (completed ? "border border-slate-200 text-slate-700" : "bg-green-700 text-white hover:bg-green-800")}>{jobAction}</Link>}
    </div>
  </article>;
}
