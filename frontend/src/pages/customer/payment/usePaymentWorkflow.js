import { isPackageForVehicle } from "../../../utils/packageCompatibility";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../../context/BookingContext";
import { useAuth } from "../../../context/AuthContext";
import { createBooking } from "../../../services/bookingService";
import { openRazorpayPayment } from "./paymentHelpers";

function usePaymentWorkflow() {
  const { booking, updateBooking } = useBooking();
  const { user } = useAuth();
  const navigate = useNavigate();
  const requestId = useRef(crypto.randomUUID());
  const processingRef = useRef(false);
  const [paymentError, setPaymentError] = useState("");
  const [createdBooking, setCreatedBooking] = useState(null);
  const [processing, setProcessing] = useState(false);

  const completeBooking = async (savedBooking) => {
    updateBooking({
      databaseBookingId: savedBooking.id,
      bookingId: savedBooking.booking_number,
      paymentMethod: "online",
      status: savedBooking.status,
    });
    navigate("/customer/finding-washer");
  };

  const handlePayment = async () => {
    if (processingRef.current) return;
    if (!isPackageForVehicle(booking.package, booking.vehicle)) {
      setPaymentError("Your package does not match this vehicle. Choose a compatible package to continue.");
      return;
    }
    if (!user) {
      setPaymentError("Please login before creating a booking.");
      return;
    }
    processingRef.current = true;
    setProcessing(true);
    setPaymentError("");
    try {
      let savedBooking = createdBooking;
      if (!savedBooking) {
        savedBooking = await createBooking({
          userId: user.id,
          requestId: requestId.current,
          booking: { ...booking, paymentMethod: "online" },
        });
        setCreatedBooking(savedBooking);
      }
      await openRazorpayPayment(
        savedBooking,
        completeBooking,
        setPaymentError,
        () => {
          processingRef.current = false;
          setProcessing(false);
        },
      );
    } catch (error) {
      console.error(error);
      setPaymentError(error.message || "Unable to create payment.");
      processingRef.current = false;
      setProcessing(false);
    }
  };

  return {
    booking,
    paymentError,
    processing,
    handlePayment,
  };
}

export default usePaymentWorkflow;
