import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../../context/BookingContext";
import {
  createReview,
  skipReview,
} from "../../../services/reviewService";
import ReviewForm from "./ReviewForm";
import ReviewThankYou from "./ReviewThankYou";

function RateService() {
  const { booking, updateStatus, resetBooking } = useBooking();
  const washer = booking.washer;
  const navigate = useNavigate();

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [review, setReview] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const submitReview = async () => {
    if (!booking.databaseBookingId || !rating || processing) {
      return;
    }

    try {
      setProcessing(true);
      setError("");
      await createReview(
        booking.databaseBookingId,
        {
          rating,
          comment: review,
        }
      );
      updateStatus("closed");
      setSubmitted(true);
    } catch (submitError) {
      console.error("Review submission error:", submitError);
      setError(
        submitError.message ||
          "Unable to submit your review."
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleSkipReview = async () => {
    if (!booking.databaseBookingId || processing) {
      setError("Booking details are unavailable.");
      return;
    }

    try {
      setProcessing(true);
      setError("");
      await skipReview(booking.databaseBookingId);
      updateStatus("closed");
      resetBooking();
      navigate("/customer");
    } catch (skipError) {
      console.error("Skip review error:", skipError);
      setError(
        skipError.message ||
          "Unable to close this booking."
      );
    } finally {
      setProcessing(false);
    }
  };

  if (submitted) {
    return (
      <ReviewThankYou
        onContinue={() => {
          resetBooking();
          navigate("/customer");
        }}
      />
    );
  }

  return (
    <ReviewForm
      washer={washer}
      rating={rating}
      hovered={hovered}
      setRating={setRating}
      setHovered={setHovered}
      review={review}
      setReview={setReview}
      error={error}
      processing={processing}
      submitReview={submitReview}
      handleSkipReview={handleSkipReview}
    />
  );
}

export default RateService;