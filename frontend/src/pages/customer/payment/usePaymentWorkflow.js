import { isPackageForVehicle } from "../../../utils/packageCompatibility";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../../context/BookingContext";
import { useAuth } from "../../../context/AuthContext";
import { createBooking } from "../../../services/bookingService";
import { findWasherForBooking } from "../../../services/assignmentService";
import { openRazorpayPayment } from "./paymentHelpers";

function usePaymentWorkflow() {
  const { booking, updateBooking } = useBooking();
  const { user } = useAuth();
  const navigate = useNavigate();
  const requestId = useRef(crypto.randomUUID());
  const [paymentError, setPaymentError] = useState("");
  const [createdBooking, setCreatedBooking] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [upiId, setUpiId] = useState("");
  const [processing, setProcessing] = useState(false);

  const handlePaymentMethodChange = (method) => {
    if (processing) return;
    requestId.current = crypto.randomUUID();
    setPaymentMethod(method);
    setCreatedBooking(null);
    setPaymentError("");
  };

  const completeBooking = async (savedBooking) => {
    let assignmentStarted = false;
    try {
      await findWasherForBooking(savedBooking.id);
      assignmentStarted = true;
    } catch (error) {
      console.error("Washer assignment error:", error);
    }
    updateBooking({
      databaseBookingId: savedBooking.id,
      bookingId: savedBooking.booking_number,
      paymentMethod,
      status: assignmentStarted ? "finding_washer" : savedBooking.status,
    });
    navigate("/customer/finding-washer");
  };

  const handlePayment = async () => {
    if (!isPackageForVehicle(booking.package, booking.vehicle)) {
      setPaymentError("Your package does not match this vehicle. Choose a compatible package to continue.");
      return;
    }
    if (!user) {
      setPaymentError("Please login before creating a booking.");
      return;
    }
    setProcessing(true);
    setPaymentError("");
    try {
      let savedBooking = createdBooking;
      if (!savedBooking) {
        savedBooking = await createBooking({
          userId: user.id,
          requestId: requestId.current,
          booking: { ...booking, paymentMethod },
        });
        setCreatedBooking(savedBooking);
      }
      if (paymentMethod === "cod") {
        await completeBooking(savedBooking);
        setProcessing(false);
        return;
      }
      await openRazorpayPayment(
        savedBooking,
        completeBooking,
        setPaymentError,
        () => setProcessing(false),
      );
    } catch (error) {
      console.error(error);
      setPaymentError(error.message || "Unable to create payment.");
      setProcessing(false);
    }
  };

  return {
    booking,
    paymentError,
    paymentMethod,
    upiId,
    setUpiId,
    processing,
    handlePayment,
    handlePaymentMethodChange,
  };
}

export default usePaymentWorkflow;
