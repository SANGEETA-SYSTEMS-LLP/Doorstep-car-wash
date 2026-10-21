import { getBookingById } from "../../../services/booking/bookingService";
import useDrivingRoute from "../../../hooks/useDrivingRoute";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../../context/BookingContext";
import { supabase } from "../../../services/auth/supabase";
import { getWasherLocation } from "../../../services/washer/washerService";
import TrackBookingLiveMap from "./TrackBookingLiveMap";
import TrackingSidebar from "./TrackingSidebar";
import TrackingHeader from "./TrackingHeader";
import LiveLocationInfo from "./LiveLocationInfo";

function TrackBooking() {
  const { booking, updateStatus, setWasher } = useBooking();
  const [assignedWasher, setAssignedWasher] = useState(null);
  const [contactError, setContactError] = useState("");
  const washer = assignedWasher;
  const navigate = useNavigate();

  const [currentStatus, setCurrentStatus] = useState(booking.status);
  const [washerLocation, setWasherLocation] = useState(null);

  useEffect(() => {
    const bookingId = booking.databaseBookingId;
    if (!bookingId) return;

    let cancelled = false;
    let pending = false;
    setAssignedWasher(null);
    const refreshContact = async () => {
      if (pending) return; pending = true;
      try {
        const fresh = await getBookingById(bookingId);
        if (!cancelled) {
          setAssignedWasher(fresh.washer || null);
          setWasher(fresh.washer || null);
          setCurrentStatus(fresh.status);
          updateStatus(fresh.status);
          setContactError("");
          if (fresh.status === "washer_arrived") navigate("/customer/washer-arrived", { replace: true });
          if (["service_completed", "customer_confirmed", "payment_completed", "closed", "completed"].includes(fresh.status)) {
            navigate("/customer/service-completed", { replace: true });
          }
        }
      } catch (err) { if (!cancelled) setContactError("Unable to refresh washer contact details. Retrying shortly."); }
      finally { pending = false; }
    };
    refreshContact();
    const timer = setInterval(refreshContact, 15000);
    const channel = supabase
      .channel(`tracking-booking-${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bookings",
          filter: `id=eq.${bookingId}`,
        },
        (payload) => {
          if (cancelled) return;
          refreshContact();
          const status = payload.new.status;
          setCurrentStatus(status);
          updateStatus(status);
          if (status === "washer_arrived") navigate("/customer/washer-arrived", { replace: true });
          if (["service_completed", "customer_confirmed", "payment_completed", "closed", "completed"].includes(status)) {
            navigate("/customer/service-completed", { replace: true });
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [booking.databaseBookingId]);

  useEffect(() => {
    const washerId = assignedWasher?.id;
    let active = true;

    if (!washerId) {
      return () => {
        active = false;
      };
    }

    const loadLocation = async () => {
      try {
        const location = await getWasherLocation(washerId);

        if (active) {
          setWasherLocation(location);
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadLocation();
    const locationPoll = setInterval(loadLocation, 15000);

    const channel = supabase
      .channel(`washer-location-${washerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "washer_locations",
          filter: `washer_id=eq.${washerId}`,
        },
        (payload) => {
          if (active) {
            setWasherLocation(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      clearInterval(locationPoll);
      supabase.removeChannel(channel);
    };
  }, [assignedWasher?.id]);

  const { distance, eta, path, error: routeError } = useDrivingRoute(washerLocation, booking.location);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}

      <TrackingHeader booking={booking} washer={washer} currentStatus={currentStatus} navigate={navigate} />

      <main className="mx-auto max-w-7xl p-6 lg:p-8">
        {contactError && <p role="status" className="mb-4 text-sm text-amber-700">{contactError}</p>}
        <LiveLocationInfo location={washerLocation} />

        <div className="grid gap-6 xl:grid-cols-[1.5fr_0.7fr]">
          {/* LIVE MAP */}

          <TrackBookingLiveMap booking={booking} washerLocation={washerLocation} distance={distance} eta={eta} path={path} error={routeError} />

          {/* RIGHT */}

          <TrackingSidebar currentStatus={currentStatus} updateStatus={updateStatus} washer={washer} navigate={navigate} distance={distance} eta={eta} />
        </div>
      </main>
    </div>
  );
}

export default TrackBooking;
