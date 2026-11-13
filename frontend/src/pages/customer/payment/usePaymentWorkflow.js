import { isPackageForVehicle } from "../../../utils/packageCompatibility";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../../context/BookingContext";
import { useAuth } from "../../../context/AuthContext";
import { createBooking } from "../../../services/booking/bookingService";
import { openRazorpayPayment } from "./paymentHelpers";
import { canSelectSlot } from "../selectschedule/data";

function usePaymentWorkflow() {
  const { booking, updateBooking } = useBooking();
  const { user } = useAuth();
  const navigate = useNavigate();
  const requestId = useRef(null);
  const processingRef = useRef(false);
  const [paymentError, setPaymentError] = useState("");
  const [createdBooking, setCreatedBooking] = useState(null);
  const [processing, setProcessing] = useState(false);

  const completeBooking = async (savedBooking) => {
    if (requestId.current?.storageKey) {
      try { sessionStorage.removeItem(requestId.current.storageKey); } catch { /* storage may be disabled */ }
      requestId.current = null;
    }
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
    if (!canSelectSlot(booking.schedule?.date?.iso, booking.schedule?.time)) {
      setPaymentError("Your selected service date or time has passed. Choose a new schedule to continue.");
      return;
    }
    processingRef.current = true;
    setProcessing(true);
    setPaymentError("");
    try {
      let savedBooking = createdBooking;
      if (!savedBooking) {
        // Keep the same idempotency key when the customer retries checkout or
        // the review page is re-mounted after a transient network failure.
        const requestPayload = {
          addressId: booking.location?.addressId,
          vehicleId: booking.vehicle?.id,
          packageId: booking.package?.id,
          date: booking.schedule?.date?.iso,
          time: booking.schedule?.time,
          promoCode: booking.promoCode || null,
        };
        const storageKey = `washnow-checkout:${user.id}:${JSON.stringify(requestPayload)}`;
        if (requestId.current?.storageKey !== storageKey) {
          let persistedId = null;
          try { persistedId = sessionStorage.getItem(storageKey); } catch { /* storage may be disabled */ }
          const id = persistedId || crypto.randomUUID();
          requestId.current = { storageKey, id };
          try { sessionStorage.setItem(storageKey, id); } catch { /* in-memory key still protects this attempt */ }
        }
        savedBooking = await createBooking({
          userId: user.id,
          requestId: requestId.current.id,
          booking: { ...booking, paymentMethod: "online" },
        });
        setCreatedBooking(savedBooking);
        // Save the server booking id before opening payment, so a reload or
        // retry can resume this booking instead of creating another one.
        updateBooking({
          databaseBookingId: savedBooking.id,
          bookingId: savedBooking.booking_number,
          paymentMethod: "online",
          status: savedBooking.status,
        });
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
