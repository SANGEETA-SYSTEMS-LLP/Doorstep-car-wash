import {
  CalendarDays,
  CarFront,
  Check,
  ChevronRight,
  Clock3,
  MapPin,
} from "lucide-react";
import {
  cancelledStatuses,
  completedStatuses,
} from "./bookingHistoryUtils";

function BookingHistoryCard({ booking, onDetails }) {
  const status = booking.status || "unknown";
  const statusStyle = getStatusStyle(status);
  const scheduledDate = formatDate(booking.scheduled_date);
  const scheduledTime = formatTime(
    booking.scheduled_time || booking.scheduled_start_time
  );
  const vehicleName = booking.vehicle
    ? [booking.vehicle.brand, booking.vehicle.model].filter(Boolean).join(" ")
    : "Vehicle details unavailable";
  const amount = Number(booking.total_amount);

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Booking reference
          </span>
          <span className="font-mono text-sm font-bold text-slate-700">
            {booking.booking_number || booking.id}
          </span>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyle}`}>
          {completedStatuses.includes(status) && <Check size={13} />}
          {formatStatus(status)}
        </span>
      </div>

      <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <CarFront size={23} />
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-slate-900">
              {booking.package?.name || "Car wash service"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{vehicleName}</p>
            {booking.vehicle?.vehicle_number && (
              <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                {booking.vehicle.vehicle_number}
              </p>
            )}
            {booking.service_address && (
              <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-500">
                <MapPin size={15} className="mt-0.5 shrink-0" />
                <span className="line-clamp-1">{booking.service_address}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="shrink-0 text-slate-400" />
            <span>{scheduledDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock3 size={16} className="shrink-0 text-slate-400" />
            <span>{scheduledTime}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-5 border-t border-slate-100 pt-4 lg:border-0 lg:pt-0">
          <div>
            <p className="text-xs text-slate-400">Booking total</p>
            <p className="mt-0.5 text-xl font-bold text-slate-900">
              {Number.isFinite(amount)
                ? `₹${amount.toLocaleString("en-IN")}`
                : "—"}
            </p>
          </div>
          <button
            type="button"
            onClick={onDetails}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            Details <ChevronRight size={17} />
          </button>
        </div>
      </div>
    </article>
  );
}

function formatDate(value) {
  if (!value) return "Schedule unavailable";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTime(value) {
  if (!value) return "Time unavailable";

  const match = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return value;

  const hour = Number(match[1]);
  const displayHour = hour % 12 || 12;
  const period = hour >= 12 ? "pm" : "am";

  return `${displayHour}:${match[2]} ${period}`;
}

function formatStatus(status) {
  if (!status) return "Status unavailable";
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getStatusStyle(status) {
  if (completedStatuses.includes(status)) {
    return "bg-emerald-50 text-emerald-700";
  }
  if (cancelledStatuses.includes(status)) {
    return "bg-rose-50 text-rose-700";
  }
  if (status === "washer_arrived" || status === "service_started") {
    return "bg-violet-50 text-violet-700";
  }
  return "bg-blue-50 text-blue-700";
}

export default BookingHistoryCard;
