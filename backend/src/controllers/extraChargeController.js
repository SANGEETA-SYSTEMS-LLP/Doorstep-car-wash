import {
  supabaseAdmin,
} from "../config/supabase.js";

export async function requestExtraCharge(
  req,
  res
) {
  try {
    const {
      bookingId,
    } = req.params;

    const {
      reason,
      amount,
    } = req.body;

    const numericAmount =
      Number(amount);

    if (
      !reason?.trim()
    ) {
      return res.status(400).json({
        message:
          "Reason is required.",
      });
    }

    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {
      return res.status(400).json({
        message:
          "Enter a valid extra amount.",
      });
    }

    const { data: washer, error: washerError } = await supabaseAdmin
      .from("washers")
      .select("id")
      .eq("user_id", req.user.id)
      .maybeSingle();
    if (washerError) throw washerError;
    if (!washer) {
      return res.status(403).json({ message: "Washer profile not found." });
    }

    const {
      data: booking,
      error: bookingError,
    } = await supabaseAdmin
      .from("bookings")
      .select(
        "id, assigned_washer_id, status"
      )
      .eq("id", bookingId)
      .maybeSingle();
    if (bookingError) throw bookingError;

    if (
      !booking ||
      booking.assigned_washer_id !== washer.id ||
      booking.status !==
        "service_started"
    ) {
      return res.status(403).json({
        message:
          "Extra charge cannot be requested.",
      });
    }

    const {
      data,
      error,
    } = await supabaseAdmin
      .from(
        "extra_charge_requests"
      )
      .insert({
        booking_id:
          bookingId,

        washer_id:
          washer.id,

        reason:
          reason.trim(),

        requested_amount:
          numericAmount,

        status:
          "pending",
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json({
      success: true,
      request: data,
    });
  } catch (error) {
    return res.status(400).json({
      message:
        error.message,
    });
  }
}