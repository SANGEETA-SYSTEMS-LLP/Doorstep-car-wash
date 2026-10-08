import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Navigation } from "lucide-react";
import { useBooking } from "../../../context/BookingContext";
import TrackBookingLiveMap from "./TrackBookingLiveMap";
import TrackingSidebar from "./TrackingSidebar";

function TrackBooking() {
  const { booking, updateStatus } = useBooking();
  const washer = booking.washer;
  const navigate = useNavigate();

  const [distance, setDistance] = useState(1.8);
  const [eta, setEta] = useState(12);
  const [progress, setProgress] = useState(22);

  // Mock washer movement
  useEffect(() => {
    const interval = setInterval(() => {
      setDistance((previous) =>
        Math.max(0.2, Number((previous - 0.1).toFixed(1)))
      );

      setEta((previous) => Math.max(2, previous - 1));

      setProgress((previous) =>
        Math.min(75, previous + 4)
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/customer")}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500"
            >
              <ArrowLeft size={19} />
            </button>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                {booking.bookingId || "Booking"}
              </p>

              <h1 className="text-xl font-bold">
                Track Your Washer
              </h1>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 sm:flex">
            <Navigation size={16} />
            On the way
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6 lg:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.5fr_0.7fr]">
          {/* LIVE MAP */}

          <TrackBookingLiveMap booking={booking} washer={washer} distance={distance} eta={eta} progress={progress} />

          {/* RIGHT */}

          <TrackingSidebar updateStatus={updateStatus} washer={washer} navigate={navigate} distance={distance} eta={eta} />
        </div>
      </main>
    </div>
  );
}

export default TrackBooking;
