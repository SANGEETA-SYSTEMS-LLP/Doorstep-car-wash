import { useNavigate, useParams } from "react-router-dom";
import BookingDetailsContent from "./BookingDetailsContent";

function BookingDetails() {
  const navigate = useNavigate();
  const { bookingId } = useParams();

  return (
    <BookingDetailsContent navigate={navigate} bookingId={bookingId} />
  );
}

export default BookingDetails;
