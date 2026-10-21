import { apiRequest } from "../../../services/api";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useBooking } from "../../../context/BookingContext";
import { supabase } from "../../../services/supabase";
import { getBookingById } from "../../../services/bookingService";
import { getCustomerServicePhotos } from "../../../services/customerBookingService";
import ServiceSummary from "./ServiceSummary";
import ServicePhotos from "./ServicePhotos";
import ServiceCompletedHero from "./ServiceCompletedHero";
import ValidationStatus from "./ValidationStatus";
import CompletionPayment from "./CompletionPayment";

function ServiceCompleted() {
  const { booking, updateBooking, updateStatus } = useBooking();
  const washer = booking.washer;
  const servicePrice = booking.package?.price || 0;
  const [photos, setPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [photoError, setPhotoError] = useState("");
  const [photoRefresh, setPhotoRefresh] = useState(0);
  const completed = ["customer_confirmed", "payment_completed", "closed", "completed"].includes(booking.status);
  const serviceValidated = Boolean(booking.service_validated_at);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  async function confirm() {
    if (confirming) return; setConfirming(true); setConfirmError("");
    try { const result = await apiRequest(`/customer/bookings/${booking.databaseBookingId}/confirm-service`, {method:"POST"}); updateStatus(result.booking.status); }
    catch (err) { setConfirmError(err.message); } finally { setConfirming(false); }
  }
  const updateStatusRef = useRef(updateStatus);

  useEffect(() => {
    updateStatusRef.current = updateStatus;
  }, [updateStatus]);

  useEffect(() => {
    const bookingId = booking.databaseBookingId;
    let active = true;
    let revision = 0;
    const applyBooking = (updated) => {
      if (active && updated?.status) {
        updateStatusRef.current(updated.status);
        updateBooking({
          status: updated.status,
          service_validated_at: updated.service_validated_at || null,
          washer: updated.washer || booking.washer,
        });
      }
    };
    const refreshBooking = async () => {
      const version = revision;
      try {
        const updated = await getBookingById(bookingId);
        if (active && version === revision) applyBooking(updated);
      } catch (error) {
        if (active) console.error("Refresh completed booking:", error);
      }
    };

    if (!bookingId) return undefined;
    const channel = supabase
      .channel(`service-completion-${bookingId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bookings", filter: `id=eq.${bookingId}` },
        (payload) => {
          revision += 1;
          applyBooking(payload.new);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") refreshBooking();
      });
    refreshBooking();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [booking.databaseBookingId]);

  useEffect(() => {
    const bookingId = booking.databaseBookingId;
    let active = true;
    setPhotos([]);
    setPhotoError("");
    if (!bookingId) {
      setLoadingPhotos(false);
      setPhotoError("Booking details are unavailable.");
      return;
    }
    setLoadingPhotos(true);
    getCustomerServicePhotos(bookingId)
      .then((data) => { if (active) setPhotos(data.photos || []); })
      .catch((error) => {
        console.error(error);
        if (active) setPhotoError(error.message || "Unable to load service photos.");
      })
      .finally(() => { if (active) setLoadingPhotos(false); });
    return () => { active = false; };
  }, [booking.databaseBookingId, photoRefresh]);

  const beforePhotos = photos.filter((photo) => photo.photo_type === "before");
  const afterPhotos = photos.filter((photo) => photo.photo_type === "after");

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-5xl p-6 py-10 lg:p-8 lg:py-14">
        <ServiceCompletedHero
          completed={completed}
          washer={washer}
          packageName={booking.package?.name}
        />

        {/* SUMMARY */}

        <ServiceSummary
          vehicle={booking.vehicle?.name}
          packageName={booking.package?.name}
          price={servicePrice}
        />

        {/* PHOTOS */}

        <ServicePhotos
          beforePhotos={beforePhotos}
          afterPhotos={afterPhotos}
          loading={loadingPhotos}
          error={photoError}
          onRefresh={() => setPhotoRefresh((value) => value + 1)}
          onError={setPhotoError}
        />

        <ValidationStatus completed={completed} />
        {completed && booking.databaseBookingId && <CompletionPayment bookingId={booking.databaseBookingId} onPaid={updateStatus} />}
        {confirmError && <p role="alert" className="mt-4 text-red-700">{confirmError}</p>}
        {!completed && booking.databaseBookingId && (serviceValidated ? <button disabled={confirming} onClick={confirm} className="mt-5 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white disabled:opacity-50">{confirming ? "Confirming…" : "Confirm service received"}</button> : <p role="status" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Your washer has uploaded the service photos. They will be available for confirmation after the washer completes the photo review.</p>)}
        {booking.status === "customer_confirmed" && <p className="mt-4 text-slate-600">Payment is optional. You can pay now or rate and close your booking without paying.</p>}
        {["customer_confirmed", "payment_completed", "closed", "completed"].includes(booking.status) && <Link to="/customer/rate-service" className="mt-5 inline-block rounded-xl bg-blue-600 px-6 py-3 text-white">Rate your service</Link>}
      </main>
    </div>
  );
}

export default ServiceCompleted;
