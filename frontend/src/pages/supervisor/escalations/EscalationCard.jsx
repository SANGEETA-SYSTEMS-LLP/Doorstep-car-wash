import { Link } from "react-router-dom";

function EscalationCard({ booking }) {
  return (
    <div className="rounded-2xl border border-amber-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.025] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-bold tracking-tight text-slate-950">{booking.booking_number}</p>
          <p className="mt-1 text-sm text-slate-500">{booking.service_address}</p>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
          NEEDS SUPERVISOR
        </span>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div>
          <p className="text-xs text-slate-400">Vehicle</p>
          <p className="font-semibold">
            {booking.vehicle ? `${booking.vehicle.brand} ${booking.vehicle.model}` : "-"}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Package</p>
          <p className="font-semibold">{booking.package?.name || "-"}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Schedule</p>
          <p className="font-semibold">
            {booking.scheduled_date} {booking.scheduled_time}
          </p>
        </div>
      </div>
      <Link
        to={`/supervisor/escalations/${booking.id}`}
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-green-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-950"
      >
        Review assignment
      </Link>
    </div>
  );
}

export default EscalationCard;
