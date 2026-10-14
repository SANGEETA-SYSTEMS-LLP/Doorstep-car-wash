import {
  supabaseAdmin,
} from "../config/supabase.js";

async function getCustomerBooking(
  bookingId,
  customerId
) {
  const {
    data: booking,
    error,
  } = await supabaseAdmin
    .from("bookings")
    .select(
      "id, customer_id, washer_id, status"
    )
    .eq("id", bookingId)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return booking;
}

async function getBookingWasher(
  booking
) {
  if (!booking.washer_id) {
    throw new Error(
      "This booking does not have an assigned washer."
    );
  }

  const {
    data: washer,
    error,
  } = await supabaseAdmin
    .from("washers")
    .select("id")
    .eq(
      "user_id",
      booking.washer_id
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!washer) {
    throw new Error(
      "Washer not found for this booking."
    );
  }

  return washer;
}

async function closeBookingAndReleaseWasher(
  booking,
  washer
) {
  const now =
    new Date().toISOString();

  if (booking.status === "payment_completed") {
    const {
      data: closedBooking,
      error: closeError,
    } = await supabaseAdmin
      .from("bookings")
      .update({
        status: "closed",
        closed_at: now,
        updated_at: now,
      })
      .eq("id", booking.id)
      .eq("status", "payment_completed")
      .select("id")
      .maybeSingle();

    if (closeError) {
      throw closeError;
    }

    if (!closedBooking) {
      const {
        data: currentBooking,
        error: currentBookingError,
      } = await supabaseAdmin
        .from("bookings")
        .select("status")
        .eq("id", booking.id)
        .maybeSingle();

      if (currentBookingError) {
        throw currentBookingError;
      }

      if (currentBooking?.status !== "closed") {
        throw new Error(
          "Booking status changed before it could be closed."
        );
      }
    }
  } else if (booking.status !== "closed") {
    throw new Error(
      "Booking must be payment-completed before it can be closed."
    );
  }

  const {
    error: washerUpdateError,
  } = await supabaseAdmin
    .from("washers")
    .update({
      status: "available",
      updated_at: now,
    })
    .eq("id", washer.id);

  if (washerUpdateError) {
    throw washerUpdateError;
  }
}

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
      ![
        "payment_completed",
        "closed",
      ].includes(
        booking.status
      )
    ) {
      return res.status(400).json({
        message:
          "Complete payment before rating.",
      });
    }

    const washer =
      await getBookingWasher(booking);

    const {
      data: review,
      error: reviewError,
    } = await supabaseAdmin
      .from("reviews")
      .insert({
        booking_id:
          booking.id,

        customer_id:
          req.user.id,

        washer_id:
          washer.id,

        rating:
          numericRating,

        comment:
          comment?.trim() ||
          null,
      })
      .select("*")
      .single();

    if (reviewError) {
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

        total_jobs:
          totalReviews,

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

export async function skipReview(
  req,
  res
) {
  try {
    const booking =
      await getCustomerBooking(
        req.params.bookingId,
        req.user.id
      );

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found.",
      });
    }

    if (
      ![
        "payment_completed",
        "closed",
      ].includes(booking.status)
    ) {
      return res.status(400).json({
        message:
          "Complete payment before closing this booking.",
      });
    }

    const washer =
      await getBookingWasher(booking);

    await closeBookingAndReleaseWasher(
      booking,
      washer
    );

    return res.json({
      success: true,
      status: "closed",
    });
  } catch (error) {
    console.error(
      "Skip review and close booking:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Unable to close booking.",
    });
  }
}