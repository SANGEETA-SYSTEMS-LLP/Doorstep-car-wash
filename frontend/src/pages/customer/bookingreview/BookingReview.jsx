import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import BookingSteps from "../../../components/booking/BookingSteps";
import { useBooking } from "../../../context/BookingContext";
import BookingReviewContent from "./BookingReviewContent";

function BookingReview() {
  const { booking } = useBooking();
  const servicePrice = booking.package?.price || 0;
  const platformFee = 20;
  const discount = 20;
  const total =
    servicePrice > 0
      ? servicePrice + platformFee - discount
      : 0;

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      <BookingSteps currentStep={5} />

      <div className="mx-auto max-w-6xl p-6 lg:p-8">
        <button
          onClick={() =>
            navigate("/customer/select-schedule")
          }
          className="flex items-center gap-2 text-sm font-semibold text-slate-500"
        >
          <ArrowLeft size={17} />
          Back
        </button>

        <div className="mt-7">
          <p className="font-semibold text-blue-600">
            REVIEW BOOKING
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Everything look good?
          </h1>

          <p className="mt-2 text-slate-500">
            Review your service information before continuing to
            payment.
          </p>
        </div>

        <BookingReviewContent booking={booking} servicePrice={servicePrice} platformFee={platformFee} discount={discount} total={total} navigate={navigate} />
      </div>
    </div>
  );
}

export default BookingReview;
