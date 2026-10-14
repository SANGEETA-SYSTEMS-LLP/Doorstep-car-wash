import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../../context/BookingContext";
import { getServiceOtp } from "../../../services/customerBookingService";
import WasherArrivedContent from "./WasherArrivedContent";

function WasherArrived() {
  const { booking, updateStatus } = useBooking();
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const bookingId = booking.databaseBookingId;
    let active = true;

    if (!bookingId) return () => { active = false; };

    const loadServiceOtp = async () => {
      try {
        setLoading(true);
        setError("");
        const result = await getServiceOtp(bookingId);
        if (active) setOtp(result.otp);
      } catch (loadError) {
        console.error(loadError);
        if (active) setError(loadError.message || "Unable to load service OTP.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadServiceOtp();
    return () => { active = false; };
  }, [booking.databaseBookingId]);

  const displayedError = error || (!booking.databaseBookingId
    ? "Booking details are unavailable."
    : "");
  const isLoading = Boolean(booking.databaseBookingId) && loading;

  return (
    <WasherArrivedContent
      booking={booking}
      washer={booking.washer}
      loading={isLoading}
      otp={otp}
      error={displayedError}
      onContinue={() => {
        updateStatus("otp_verified");
        navigate("/customer/service-progress");
      }}
    />
  );
}

export default WasherArrived;
