import { useNavigate } from "react-router-dom";
import { useBooking } from "../../../context/BookingContext";
import WasherArrivedContent from "./WasherArrivedContent";

function WasherArrived() {
  const { booking, updateStatus } = useBooking();
  const navigate = useNavigate();
  return (
    <WasherArrivedContent
      booking={booking}
      washer={booking.washer}
      loading={false}
      otp=""
      error=""
      onContinue={() => {
        updateStatus("washer_arrived");
        navigate("/customer/service-progress");
      }}
    />
  );
}

export default WasherArrived;
