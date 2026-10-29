import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../../context/BookingContext";
import { getBookingById } from "../../../services/booking/bookingService";
import { getCustomerServicePhotos } from "../../../services/booking/customerBookingService";
import ExtraChargeRequests from "./ExtraChargeRequests";
import ServiceProgressContent from "./ServiceProgressContent";

function ServiceProgress() {
  const { booking, updateBooking, updateStatus } = useBooking();
  const washer = booking.washer;
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [beforePhotos, setBeforePhotos] = useState([]);
  const [photoError, setPhotoError] = useState("");
  const statusUpdater = useRef(updateStatus);
  const bookingUpdater = useRef(updateBooking);
  statusUpdater.current = updateStatus;
  bookingUpdater.current = updateBooking;
  useEffect(() => {
    const bookingId = booking.databaseBookingId;
    if (!bookingId) { setError("Booking details are unavailable."); return; }
    let active = true;
    const applyBooking = (data) => {
      if (!active) return;
      statusUpdater.current(data.status);
      bookingUpdater.current({
        extra_charge: data.extra_charge,
        total_amount: data.total_amount,
        service_amount: data.service_amount,
        platform_fee: data.platform_fee,
        tax_amount: data.tax_amount,
      });
      if (data.status === "service_completed") navigate("/customer/service-completed", { replace: true });
    };
    const refresh = async () => {
      const [bookingResult, photoResult] = await Promise.allSettled([
        getBookingById(bookingId),
        getCustomerServicePhotos(bookingId),
      ]);
      if (!active) return;
      if (bookingResult.status === "fulfilled") {
        setError("");
        applyBooking(bookingResult.value);
      } else {
        setError(bookingResult.reason?.message || "Unable to load booking.");
      }
      if (photoResult.status === "fulfilled") {
        setBeforePhotos((photoResult.value.photos || []).filter(photo => photo.photo_type === "before"));
        setPhotoError("");
      } else {
        setPhotoError(photoResult.reason?.message || "Unable to load service photos.");
      }
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
      <ExtraChargeRequests
        key={booking.databaseBookingId}
        bookingId={booking.databaseBookingId}
        onBookingUpdate={data => bookingUpdater.current({
          extra_charge: data.extra_charge,
          total_amount: data.total_amount,
          service_amount: data.service_amount,
          platform_fee: data.platform_fee,
          tax_amount: data.tax_amount,
        })}
      />

      <ServiceProgressContent
        booking={booking}
        washer={washer}
        beforePhotos={beforePhotos}
        photoError={photoError}
        onPhotoError={() => setPhotoError("A photo could not be displayed. It will be refreshed automatically.")}
      />
    </div>
  );
}

export default ServiceProgress;
