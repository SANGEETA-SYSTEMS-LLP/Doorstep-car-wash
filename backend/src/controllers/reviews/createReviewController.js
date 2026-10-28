import { supabaseAdmin } from "../../config/supabase.js";
import { getCustomerBooking, getBookingWasher, closeBookingAndReleaseWasher } from "./reviewAccess.js";

export async function createReview(
  req,
  res
) {
  try {
    const {
      bookingId,
    } = req.params;

    const {
      rating,
      comment,
    } = req.body;

    if (comment != null && (typeof comment !== "string" || comment.length > 5000)) return res.status(400).json({ message: "Comment must be 5000 characters or fewer." });

    const numericRating =
      Number(rating);

    if (
      !Number.isInteger(
        numericRating
      ) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        message:
          "Rating must be between 1 and 5.",
      });
    }

    const booking =
      await getCustomerBooking(
        bookingId,
        req.user.id
      );

    if (!booking) {
      return res.status(404).json({
        message:
          "Booking not found.",
      });
    }

    if (
      !["customer_confirmed", "payment_completed", "closed"].includes(booking.status)
    ) {
      return res.status(400).json({
        message:
          "Confirm the completed service before rating.",
      });
    }

    const washer =
      await getBookingWasher(booking);

    const { data: existingReview, error: existingReviewError } = await supabaseAdmin
      .from("reviews")
      .select("id")
      .eq("booking_id", booking.id)
      .limit(1)
      .maybeSingle();
    if (existingReviewError) throw existingReviewError;
    if (existingReview) return res.status(409).json({ message: "This booking has already been rated." });

    const {
      data: review,
      error: reviewError,
    } = await supabaseAdmin
      .from("reviews")
      .insert({
        booking_id:
          booking.id,

        customer_id:
          booking.customer_id,

        washer_id:
          washer.id,

        rating:
          numericRating,

        comment:
          comment?.trim() ||
          null,
      })
      .select("id, booking_id, customer_id, washer_id, rating, comment, created_at")
      .single();

    if (reviewError) {
      if (reviewError.code === "23505") return res.status(409).json({ message: "This booking has already been rated." });
      throw reviewError;
    }

    await closeBookingAndReleaseWasher(
      booking,
      washer
    );

    const {
      data: reviews,
      error: ratingError,
    } = await supabaseAdmin
      .from("reviews")
      .select("rating")
      .eq(
        "washer_id",
        washer.id
      );

    if (ratingError) {
      throw ratingError;
    }

    const totalReviews =
      reviews.length;

    const average =
      totalReviews
        ? reviews.reduce(
            (sum, item) =>
              sum +
              Number(item.rating),
            0
          ) / totalReviews
        : 5;

    const {
      error: washerUpdateError,
    } = await supabaseAdmin
      .from("washers")
      .update({
        rating:
          Number(
            average.toFixed(2)
          ),


        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        washer.id
      );

    if (washerUpdateError) {
      throw washerUpdateError;
    }

    return res.status(201).json({
      success: true,
      review,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error.message,
    });
  }
}

