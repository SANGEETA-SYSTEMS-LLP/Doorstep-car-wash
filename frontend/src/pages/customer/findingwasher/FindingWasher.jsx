import { referenceId } from "../../../services/referenceId";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../../context/BookingContext";
import { supabase } from "../../../services/supabase";
import { getBookingById } from "../../../services/bookingService";
import FindingWasherMap from "./FindingWasherMap";
import FindingWasherStatus from "./FindingWasherStatus";
import FindingWasherHeader from "./FindingWasherHeader";

function FindingWasher() {
  const { booking, setWasher, updateStatus } = useBooking();
  const navigate = useNavigate();

  const [databaseBooking, setDatabaseBooking] = useState(null);
  const [error, setError] = useState("");

  const washerFound = databaseBooking?.status === "washer_assigned";


  useEffect(() => {
    const bookingId = booking.databaseBookingId;
    if (!bookingId) return;

    let cancelled = false;
    let revision = 0;
    setError("");
    setDatabaseBooking(null);

    const loadAssignedWasher = async (updated) => {
      try {
        const bookingWithWasher = updated.washer
          ? updated
          : await getBookingById(bookingId);
        const assignedWasher = bookingWithWasher.washer;
        if (cancelled) return;
        if (!assignedWasher) {
          throw new Error("Assigned washer not found.");
        }

        setWasher({
          id: assignedWasher.id,
          referenceId: assignedWasher.referenceId ||
            referenceId("WSH", assignedWasher.user_id),
          userId: assignedWasher.user_id,
          name: assignedWasher.name || "Washer Partner",
          phone: assignedWasher.phone,
          rating: assignedWasher.rating,
          totalJobs: assignedWasher.totalJobs,
        });
        updateStatus("washer_assigned");
        navigate("/customer/track-booking");
      } catch (error) {
        console.error("Load assigned washer error:", error);
        if (!cancelled) setError("Unable to load assigned washer details.");
      }
    };

    const loadBooking = async () => {
      const version = revision;
      try {
        const data = await getBookingById(bookingId);
        if (!cancelled && version === revision) {
          setDatabaseBooking(data);
          if (data?.status === "washer_assigned") {
            await loadAssignedWasher(data);
          }
        }
      } catch (error) {
        console.error(error);
        if (!cancelled && version === revision) setError("Unable to load booking.");
      }
    };

    loadBooking();
    const timer = setInterval(loadBooking, 15000);

    const channel = supabase
      .channel(`customer-booking-${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bookings",
          filter: `id=eq.${bookingId}`,
        },
        async (payload) => {
          if (cancelled) return;
          revision += 1;
          const updated = payload.new;
          setDatabaseBooking(updated);
          setError("");
          updateStatus(updated.status);

          if (updated.status === "washer_assigned") {
            await loadAssignedWasher(updated);
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}

      <FindingWasherHeader booking={booking} washerFound={washerFound} />

      <main className="mx-auto max-w-7xl p-6 lg:p-8">
        {error && (
          <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}
        <div className="grid gap-6 xl:grid-cols-[1.5fr_0.7fr]">
          {/* MAP */}

          <FindingWasherMap washerFound={washerFound} />

          {/* STATUS */}

          <FindingWasherStatus booking={booking} databaseBooking={databaseBooking} navigate={navigate} washerFound={washerFound} />
        </div>
      </main>
    </div>
  );
}

export default FindingWasher;
