import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getBookingById } from "../../../services/booking/bookingService";
import BookingDetailsContent from "./BookingDetailsContent";
import { useBooking } from "../../../context/BookingContext";

function BookingDetails() {
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const { updateBooking } = useBooking();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setBooking(null);
    const loadBooking = async () => {

      try {
        const data = await getBookingById(bookingId);
        if (!cancelled) {
          setBooking(data);
          updateBooking({
            databaseBookingId: data.id,
            bookingId: data.booking_number,
            status: data.status,
            service_validated_at: data.service_validated_at || null,
            washer: data.washer || null,
            vehicle: data.vehicle ? { ...data.vehicle, name: [data.vehicle.brand, data.vehicle.model].filter(Boolean).join(" ") } : null,
            package: data.package || null,
            location: { address: data.service_address || "", latitude: data.latitude ?? null, longitude: data.longitude ?? null },
            schedule: { date: data.scheduled_date || null, time: data.scheduled_time || data.scheduled_start_time || null },
          });
          setError("");
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) setError("Unable to load booking details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadBooking();
    const timer = setInterval(loadBooking, 15000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [bookingId]);

  if (loading) {
    return <div role="status" className="p-8">Loading booking...</div>;
  }

  if (error || !booking) {
    return (
      <div role="alert" className="p-8 text-red-600">
        {error || "Booking not found."}
      </div>
    );
  }

  return <><div className="px-8 pt-5"><Link className="text-green-700 underline" to={"/customer/invoices/"+booking.id}>Open booking invoice</Link></div><BookingDetailsContent navigate={navigate} booking={booking} /></>;
}

export default BookingDetails;
