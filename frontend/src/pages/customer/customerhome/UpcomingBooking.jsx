import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Car,
  Clock3,
  MapPin,
} from "lucide-react";

function UpcomingBooking({ booking, loading }) {
  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
            Your schedule
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">
            Upcoming booking
          </h2>
        </div>
        <Link
          to="/customer/history"
          className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-900"
        >
          View booking history <ArrowRight size={16} />
        </Link>
      </div>

      {loading ? (
        <div role="status" className="h-36 animate-pulse rounded-2xl bg-white" />
      ) : booking ? (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div className="flex min-w-0 gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Car size={23} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-slate-950">
                    {booking.package?.name || "Car wash service"}
                  </h3>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold capitalize text-amber-800">
                    {formatStatus(booking.status)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {booking.vehicle
                    ? [
                      booking.vehicle.brand,
                      booking.vehicle.model,
                      booking.vehicle.vehicle_type,
                    ].filter(Boolean).join(" • ")
                    : "Vehicle details unavailable"}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-400">
                  {booking.booking_number || "Booking reference unavailable"}
                </p>
                {booking.washer ? (
                  <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
                    <p className="font-semibold">Your washer: {booking.washer.name}</p>
                    {booking.washer.phone && <a className="mt-0.5 inline-block underline" href={`tel:${String(booking.washer.phone).replace(/[^+0-9]/g, "")}`}>{booking.washer.phone}</a>}
                  </div>
                ) : ["pending", "payment_completed", "finding_washer"].includes(booking.status) ? (
                  <p className="mt-3 text-sm text-slate-500">We’ll show your washer’s details as soon as they accept the booking.</p>
                ) : null}
                {booking.washer ? (
                  <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
                    <p className="font-semibold">Your washer: {booking.washer.name}</p>
                    {booking.washer.phone && <a className="mt-0.5 inline-block underline" href={`tel:${String(booking.washer.phone).replace(/[^+0-9]/g, "")}`}>{booking.washer.phone}</a>}
                  </div>
                ) : ["pending", "payment_completed", "finding_washer"].includes(booking.status) ? (
                  <p className="mt-3 text-sm text-slate-500">We’ll show your washer’s details as soon as they accept the booking.</p>
                ) : null}
                {booking.washer ? (
                  <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
                    <p className="font-semibold">Your washer: {booking.washer.name}</p>
                    {booking.washer.phone && <a className="mt-0.5 inline-block underline" href={`tel:${String(booking.washer.phone).replace(/[^+0-9]/g, "")}`}>{booking.washer.phone}</a>}
                  </div>
                ) : ["pending", "payment_completed", "finding_washer"].includes(booking.status) ? (
                  <p className="mt-3 text-sm text-slate-500">We’ll show your washer’s details as soon as they accept the booking.</p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                  {booking.scheduled_date && (
                    <span className="flex items-center gap-1.5">
                      <CalendarDays size={15} className="text-slate-400" />
                      {formatDate(booking.scheduled_date)}
                    </span>
                  )}
                  {(booking.scheduled_time || booking.scheduled_start_time) && (
                    <span className="flex items-center gap-1.5">
                      <Clock3 size={15} className="text-slate-400" />
                      {formatTime(
                        booking.scheduled_time || booking.scheduled_start_time
                      )}
                    </span>
                  )}
                  {booking.service_address && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={15} className="text-slate-400" />
                      <span className="max-w-64 truncate">{booking.service_address}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Link
              to={`/customer/bookings/${booking.id}`}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-200 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              View details <ArrowRight size={16} />
            </Link>
          </div>
        </article>
      ) : (
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-dashed border-slate-300 bg-white p-6 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-bold text-slate-900">Nothing scheduled yet</h3>
            <p className="mt-1 text-sm text-slate-500">
              Your next appointment will appear here after you make a booking.
            </p>
          </div>
          <Link
            to="/customer/select-location"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Book a wash
          </Link>
        </div>
      )}
    </section>
  );
}

function formatStatus(status) {
  return (status || "scheduled")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
}

function formatTime(value) {
  const match = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return value;

  const hour = Number(match[1]);
  return `${hour % 12 || 12}:${match[2]} ${hour >= 12 ? "pm" : "am"}`;
}

export default UpcomingBooking;
