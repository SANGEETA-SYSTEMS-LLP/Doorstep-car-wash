import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getBookingById } from "../../../services/bookingService";
import BookingDetailsContent from "./BookingDetailsContent";

function BookingDetails() {
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadBooking = async () => {
      setLoading(true);
      setError("");
      setBooking(null);

      try {
        const data = await getBookingById(bookingId);
        if (!cancelled) setBooking(data);
      } catch (error) {
        console.error(error);
        if (!cancelled) setError("Unable to load booking details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadBooking();
    return () => {
      cancelled = true;
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

  return <><div className="px-8 pt-5"><Link className="text-blue-700 underline" to={"/customer/invoices/"+booking.id}>Open booking invoice</Link></div><BookingDetailsContent navigate={navigate} booking={booking} /></>;
}

export default BookingDetails;
