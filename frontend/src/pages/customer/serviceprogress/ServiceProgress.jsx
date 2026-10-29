import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../../context/BookingContext";
import { getBookingById } from "../../../services/booking/bookingService";
import ExtraChargeRequests from "./ExtraChargeRequests";
import ServiceProgressContent from "./ServiceProgressContent";

function ServiceProgress() {
  const { booking, updateStatus } = useBooking();
  const washer = booking.washer;
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const statusUpdater = useRef(updateStatus);
  statusUpdater.current = updateStatus;
  useEffect(() => {
    const bookingId = booking.databaseBookingId;
    if (!bookingId) { setError("Booking details are unavailable."); return; }
    let active = true;
    const applyBooking = (data) => {
      if (!active) return;
      statusUpdater.current(data.status);
      if (data.status === "service_completed") navigate("/customer/service-completed", { replace: true });
    };
    const refresh = async () => {
      try {
        const data = await getBookingById(bookingId);
        if (active) { setError(""); applyBooking(data); }
      } catch (error) { if (active) setError(error.message || "Unable to load booking."); }
    };
    refresh();
    const timer = setInterval(refresh, 15000);
    return () => { active = false; clearInterval(timer); };
  }, [booking.databaseBookingId, navigate]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-green-600">
              {booking.bookingId || "Booking"}
            </p>

            <h1 className="mt-1 text-xl font-bold">
              Service In Progress
            </h1>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-600" />
            In Progress
          </div>
        </div>
      </header>

      {error && <p role="alert" className="p-6 text-red-600">{error}</p>}
      <ExtraChargeRequests key={booking.databaseBookingId} bookingId={booking.databaseBookingId} />

      <ServiceProgressContent booking={booking} washer={washer} />
    </div>
  );
}

export default ServiceProgress;
