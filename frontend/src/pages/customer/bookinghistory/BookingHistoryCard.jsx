import {
  CalendarDays,
  CarFront,
  Check,
  ChevronRight,
  Clock3,
  MapPin,
  Trash2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import {
  cancelledStatuses,
  completedStatuses,
} from "./bookingHistoryUtils";

function BookingHistoryCard({ booking, onDetails, onDelete, deleting, onCancel, cancelling, onCheckRefund }) {
  const status = booking.status || "unknown";
  const awaitingPayment = status === "pending"
    && !["cod", "cash"].includes(String(booking.payment?.payment_method || booking.payment_method || "").toLowerCase())
    && booking.payment?.status !== "paid";
  const statusStyle = awaitingPayment ? "bg-amber-50 text-amber-800" : getStatusStyle(status);
  const scheduledDate = formatDate(booking.scheduled_date);
  const scheduledTime = formatTime(
    booking.scheduled_time || booking.scheduled_start_time
  );
  const vehicleName = booking.vehicle
    ? [booking.vehicle.brand, booking.vehicle.model].filter(Boolean).join(" ")
    : "Vehicle details unavailable";
  const amount = Number(booking.total_amount);
  const removable = ["completed", "customer_confirmed", "payment_completed", "closed", "cancelled", "rejected", "expired"].includes(status);
  const cancellable = ["pending", "confirmed", "finding_washer", "support_escalated", "washer_assigned", "washer_on_the_way", "washer_arrived", "otp_verified"].includes(status);

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors duration-150 hover:border-green-200">
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
          {awaitingPayment ? "Awaiting payment · not confirmed" : status === "expired" ? "Expired · not confirmed" : formatStatus(status)}
        </span>
      </div>

      <div className="flex flex-col gap-5 p-5 sm:p-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
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
            {(booking.payment?.provider_method || booking.payment?.payment_method) && <p className="mt-2 text-xs font-medium capitalize text-slate-500">Payment method: {formatPaymentMethod(booking.payment.provider_method || booking.payment.payment_method)}</p>}
            {awaitingPayment && <p className="mt-2 text-xs font-medium text-amber-800">Complete payment within 30 minutes to confirm this booking. Unpaid bookings expire automatically.</p>}
            {status === "expired" && <p className="mt-2 text-xs font-medium text-slate-500">Payment was not completed within 30 minutes, so the booking expired without being confirmed.</p>}
            {booking.cancellation && <p className="mt-2 text-xs font-medium text-slate-600">
              {Number(booking.cancellation.refund_amount_paise || 0) > 0
                ? `Refund ₹${(Number(booking.cancellation.refund_amount_paise) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })} · ${formatRefundStatus(booking.cancellation.status)}`
                : "No online refund due"}
            </p>}
            {booking.washer && (
              <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                <span className="font-semibold">Washer: {booking.washer.name}</span>
                {booking.washer.phone && <a className="ml-2 underline" href={`tel:${String(booking.washer.phone).replace(/[^+0-9]/g, "")}`}>{booking.washer.phone}</a>}
              </div>
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

        <div className="flex w-full flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4 xl:w-auto xl:shrink-0 xl:flex-nowrap xl:border-0 xl:pt-0">
          <div className="shrink-0 whitespace-nowrap">
            <p className="text-xs text-slate-400">Booking total</p>
            <p className="mt-0.5 whitespace-nowrap text-xl font-bold tabular-nums text-slate-900">
              {Number.isFinite(amount)
                ? `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "-"}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-1">
            {cancellable && <button type="button" onClick={onCancel} disabled={cancelling} className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-50 disabled:opacity-50">
              <XCircle size={15} />{cancelling ? "Cancelling…" : "Cancel booking"}
            </button>}
            {booking.cancellation?.status === "refund_pending" && <button type="button" onClick={onCheckRefund} disabled={cancelling} className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-50 disabled:opacity-50">
              <RefreshCw size={15} className={cancelling ? "animate-spin" : ""} />Check refund
            </button>}
            {removable && <button type="button" onClick={onDelete} disabled={deleting} className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50">
              <Trash2 size={15} />{deleting ? "Removing…" : "Remove"}
            </button>}
            <button
              type="button"
              onClick={onDetails}
              className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-50"
            >
              Details <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function formatPaymentMethod(method) {
  const value = String(method || "").toLowerCase();
  if (value === "netbanking") return "Net banking";
  if (value === "online") return "Razorpay";
  if (value === "cod" || value === "cash") return "Cash after service";
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "Unavailable";
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

function formatRefundStatus(status) {
  if (status === "refund_processed") return "Processed";
  if (status === "refund_failed") return "Failed · contact support";
  return "Pending";
}

function getStatusStyle(status) {
  if (completedStatuses.includes(status)) {
    return "bg-emerald-50 text-emerald-700";
  }
  if (cancelledStatuses.includes(status)) {
    return "bg-rose-50 text-rose-700";
  }
  if (status === "washer_arrived" || status === "service_started") {
    return "bg-green-50 text-green-700";
  }
  return "bg-green-50 text-green-700";
}

export default BookingHistoryCard;
