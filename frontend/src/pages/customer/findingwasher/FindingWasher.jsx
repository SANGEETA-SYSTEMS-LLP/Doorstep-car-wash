import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../../context/BookingContext";
import { searchMessages } from "./data";
import { mockWasher } from "./data";
import FindingWasherMap from "./FindingWasherMap";
import FindingWasherStatus from "./FindingWasherStatus";

function FindingWasher() {
  const { booking, setWasher, updateStatus } = useBooking();
  const navigate = useNavigate();

  const [searchStep, setSearchStep] = useState(0);
  const [washerFound, setWasherFound] = useState(false);

  useEffect(() => {
    let step = 0;
    const interval = setInterval(() => {
      if (step >= searchMessages.length - 1) {
        clearInterval(interval);
        setWasherFound(true);
        setWasher(mockWasher);
        updateStatus("washer_assigned");
        return;
      }

      step += 1;
      setSearchStep(step);
    }, 1300);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Booking {booking.bookingId || "Pending"}
            </p>

            <h1 className="mt-1 text-xl font-bold">
              {washerFound
                ? "Washer Assigned"
                : "Finding Your Washer"}
            </h1>
          </div>

          <div className="rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
            Booking Confirmed
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6 lg:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.5fr_0.7fr]">
          {/* MAP */}

          <FindingWasherMap washerFound={washerFound} />

          {/* STATUS */}

          <FindingWasherStatus booking={booking} navigate={navigate} searchStep={searchStep} washerFound={washerFound} />
        </div>
      </main>
    </div>
  );
}

export default FindingWasher;
