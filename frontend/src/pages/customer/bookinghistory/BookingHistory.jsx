import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Car,
  CheckCircle2,
  ChevronRight,
  Clock3,
  History,
} from "lucide-react";

const bookings = [
  {
    id: "CW-2026-1028",
    service: "Premium Wash",
    vehicle: "Hyundai Creta",
    date: "08 Oct 2026",
    time: "10:30 AM",
    amount: "₹499",
    status: "Completed",
  },
  {
    id: "CW-2026-0987",
    service: "Basic Wash",
    vehicle: "Maruti Suzuki Swift",
    date: "24 Sep 2026",
    time: "09:00 AM",
    amount: "₹299",
    status: "Completed",
  },
  {
    id: "CW-2026-0854",
    service: "Complete Detailing",
    vehicle: "Hyundai Creta",
    date: "10 Sep 2026",
    time: "02:00 PM",
    amount: "₹1,499",
    status: "Completed",
  },
];

function BookingHistory() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div>
          <p className="font-semibold text-blue-600">
            BOOKINGS
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Booking History
          </h1>

          <p className="mt-2 text-slate-500">
            View your previous car-wash services.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-md"
            >
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                <div className="flex gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Car size={25} />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-bold">
                        {booking.service}
                      </h2>

                      <span className="flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                        <CheckCircle2 size={13} />
                        {booking.status}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      {booking.vehicle} • {booking.id}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-2">
                        <CalendarDays size={15} />
                        {booking.date}
                      </span>

                      <span className="flex items-center gap-2">
                        <Clock3 size={15} />
                        {booking.time}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-6 lg:justify-end">
                  <p className="text-xl font-bold">
                    {booking.amount}
                  </p>

                  <button
                    onClick={() =>
                      navigate(
                        `/customer/bookings/${booking.id}`
                      )
                    }
                    className="flex items-center gap-1 font-semibold text-blue-600"
                  >
                    Details
                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {bookings.length === 0 && (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-12 text-center">
            <History
              size={40}
              className="mx-auto text-slate-300"
            />

            <h2 className="mt-4 text-xl font-bold">
              No bookings yet
            </h2>
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingHistory;