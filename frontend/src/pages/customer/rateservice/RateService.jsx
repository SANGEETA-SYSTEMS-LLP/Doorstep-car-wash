import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Star,
  UserRound,
} from "lucide-react";

import { useBooking } from "../../../context/BookingContext";

function RateService() {
  const { booking, updateStatus, resetBooking } = useBooking();
  const washer = booking.washer;
  const navigate = useNavigate();

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [review, setReview] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitReview = () => {
    const reviewData = {
      bookingId: booking.bookingId,
      washerId: booking.washer?.id,
      rating,
      review,
    };

    console.log("Review submitted:", reviewData);
    updateStatus("closed");
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-9 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-600">
            <CheckCircle2 size={42} />
          </div>

          <h1 className="mt-6 text-3xl font-bold">
            Thank you!
          </h1>

          <p className="mt-3 leading-7 text-slate-500">
            Your feedback has been submitted successfully.
          </p>

          <button
            onClick={() => {
              resetBooking();
              navigate("/customer");
            }}
            className="mt-7 w-full rounded-xl bg-blue-600 py-4 font-semibold text-white"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-7 sm:p-9">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-700">
            <UserRound size={30} />
          </div>

          <h1 className="mt-5 text-3xl font-bold">
            How was your service?
          </h1>

          <p className="mt-2 text-slate-500">
            Rate your experience with{" "}
            {washer?.name || "your washer"}.
          </p>
        </div>

        {/* STARS */}

        <div className="mt-8 flex justify-center gap-3">
          {[1, 2, 3, 4, 5].map((star) => {
            const active = star <= (hovered || rating);

            return (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  size={40}
                  className={
                    active
                      ? "fill-amber-400 text-amber-400"
                      : "text-slate-200"
                  }
                />
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-center text-sm font-semibold text-slate-500">
          {rating === 1 && "Poor"}
          {rating === 2 && "Fair"}
          {rating === 3 && "Good"}
          {rating === 4 && "Very Good"}
          {rating === 5 && "Excellent"}
          {rating === 0 && "Tap a star to rate"}
        </p>

        {/* QUICK FEEDBACK */}

        <div className="mt-8">
          <p className="text-sm font-bold">
            What did you like?
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {[
              "On time",
              "Professional",
              "Great cleaning",
              "Polite",
              "Good communication",
              "Value for money",
            ].map((item) => (
              <button
                key={item}
                type="button"
                className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-7">
          <label className="text-sm font-bold">
            Write a review
          </label>

          <textarea
            rows={5}
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Tell us about your service experience..."
            className="mt-2 w-full resize-none rounded-xl border border-slate-300 p-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <button
          disabled={!rating}
          onClick={submitReview}
          className="mt-6 w-full rounded-xl bg-blue-600 py-4 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Submit Review
        </button>

        <button
          onClick={() => {
            updateStatus("closed");
            resetBooking();
            navigate("/customer");
          }}
          className="mt-3 w-full py-3 text-sm font-semibold text-slate-500"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

export default RateService;