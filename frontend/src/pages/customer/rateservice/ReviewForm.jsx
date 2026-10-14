import { UserRound } from "lucide-react";
import RatingStars from "./RatingStars";
import QuickFeedback from "./QuickFeedback";

function ReviewForm({
  washer,
  rating,
  hovered,
  setRating,
  setHovered,
  review,
  setReview,
  error,
  processing,
  submitReview,
  handleSkipReview,
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-7 sm:p-9">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-700">
            <UserRound size={30} />
          </div>
          <h1 className="mt-5 text-3xl font-bold">How was your service?</h1>
          <p className="mt-2 text-slate-500">
            Rate your experience with {washer?.name || "your washer"}.
          </p>
        </div>
        <RatingStars
          rating={rating}
          hovered={hovered}
          setRating={setRating}
          setHovered={setHovered}
        />
        <QuickFeedback />
        <div className="mt-7">
          <label className="text-sm font-bold">Write a review</label>
          <textarea
            rows={5}
            value={review}
            onChange={(event) => setReview(event.target.value)}
            placeholder="Tell us about your service experience..."
            className="mt-2 w-full resize-none rounded-xl border border-slate-300 p-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>
        {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
        <button
          disabled={!rating || processing}
          onClick={submitReview}
          className="mt-6 w-full rounded-xl bg-blue-600 py-4 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {processing ? "Processing..." : "Submit Review"}
        </button>
        <button
          disabled={processing}
          onClick={handleSkipReview}
          className="mt-3 w-full py-3 text-sm font-semibold text-slate-500 disabled:opacity-50"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

export default ReviewForm;
