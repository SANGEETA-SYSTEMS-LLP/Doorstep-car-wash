import { Star } from "lucide-react";

function RatingStars({ rating, hovered, setRating, setHovered }) {
  const labels = ["Tap a star to rate", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <>
      <div className="mt-8 flex justify-center gap-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(star)}
          >
            <Star
              size={40}
              className={star <= (hovered || rating)
                ? "fill-amber-400 text-amber-400"
                : "text-slate-200"}
            />
          </button>
        ))}
      </div>
      <p className="mt-3 text-center text-sm font-semibold text-slate-500">
        {labels[rating]}
      </p>
    </>
  );
}

export default RatingStars;
