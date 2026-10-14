import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../../context/BookingContext";
import { supabase } from "../../../services/supabase";
import { getBookingById } from "../../../services/bookingService";
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
    let revision = 0;
    const applyBooking = (data) => {
      if (!active) return;
      statusUpdater.current(data.status);
      if (data.status === "service_completed") navigate("/customer/service-completed", { replace: true });
    };
    const refresh = async () => {
      const version = revision;
      try {
        const data = await getBookingById(bookingId);
        if (active && version === revision) { setError(""); applyBooking(data); }
      } catch (error) { if (active) setError(error.message || "Unable to load booking."); }
    };
    const channel = supabase.channel("service-progress-" + bookingId)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "bookings", filter: "id=eq." + bookingId }, (payload) => {
        revision += 1;
        applyBooking(payload.new);
      }).subscribe((status) => {
        if (status === "SUBSCRIBED") refresh();
        if (active && (status === "CHANNEL_ERROR" || status === "TIMED_OUT")) setError("Live updates are unavailable. Please refresh to check the booking.");
      });
    refresh();
    return () => { active = false; supabase.removeChannel(channel); };
  }, [booking.databaseBookingId, navigate]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              {booking.bookingId || "Booking"}
            </p>

            <h1 className="mt-1 text-xl font-bold">
              Service In Progress
            </h1>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
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
