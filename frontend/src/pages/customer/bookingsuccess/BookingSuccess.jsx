import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Search,
} from "lucide-react";

import { useBooking } from "../../../context/BookingContext";

function BookingSuccess() {
  const { booking } = useBooking();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-600">
          <CheckCircle2 size={42} />
        </div>

        <p className="mt-7 text-sm font-bold uppercase tracking-wider text-green-600">
          Booking Confirmed
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Your car wash is booked!
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Your booking has been created successfully.
          We're preparing to find an available washer near
          your service location.
        </p>

        <div className="mt-7 rounded-2xl bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Booking ID
          </p>

          <p className="mt-2 text-xl font-bold text-slate-900">
            {booking.bookingId || "Booking Created"}
          </p>
        </div>

        <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
          <Info
            icon={<CalendarDays />}
            label="Date"
            value={
              booking.schedule?.date
                ? `${booking.schedule.date.date} ${booking.schedule.date.month} 2026`
                : "Not selected"
            }
          />

          <Info
            icon={<Clock3 />}
            label="Time"
            value={booking.schedule?.time || "Not selected"}
          />

          <Info
            icon={<MapPin />}
            label="Location"
            value={booking.location?.name || "Not selected"}
          />
        </div>

        <div className="mt-7 rounded-2xl border border-blue-100 bg-blue-50 p-5 text-left">
          <div className="flex gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
              <Search size={19} />
            </div>

            <div>
              <p className="font-bold text-blue-900">
                Finding a washer
              </p>

              <p className="mt-1 text-sm leading-6 text-blue-700">
                We're checking nearby available professionals for
                your booking.
              </p>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-blue-100">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() =>
            navigate("/customer/finding-washer")
          }
          className="mt-7 w-full rounded-xl bg-blue-600 py-4 font-semibold text-white transition hover:bg-blue-700"
        >
          Track Booking
        </button>

        <button
          onClick={() => navigate("/customer")}
          className="mt-3 w-full rounded-xl border border-slate-300 py-3.5 font-semibold text-slate-600"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

function Info({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="text-blue-600">
        {icon}
      </div>

      <p className="mt-3 text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold">
        {value}
      </p>
    </div>
  );
}

export default BookingSuccess;