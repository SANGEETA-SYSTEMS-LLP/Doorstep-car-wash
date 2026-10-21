import {
  supabaseAdmin,
} from "../../config/supabase.js";

export async function createWasherEarning(
  bookingId
) {
  const {
    data: booking,
    error,
  } = await supabaseAdmin
    .from("bookings")
    .select(`
      id,
      assigned_washer_id,
      service_amount,
      extra_charge,
      status,

      package:service_packages (
        washer_commission_percent
      )
    `)
    .eq("id", bookingId)
    .single();

  if (error) throw error;

  if (
    ![
      "customer_confirmed",
      "closed",
      "payment_completed",
    ].includes(booking.status)
  ) {
    return null;
  }

  const {
    data: paidPayment,
    error: paymentError,
  } = await supabaseAdmin
    .from("payments")
    .select("id")
    .eq("booking_id", bookingId)
    .eq("status", "paid")
    .limit(1)
    .maybeSingle();

  if (paymentError) {
    throw paymentError;
  }

  if (!paidPayment || !booking.assigned_washer_id) {
    return null;
  }

  const packageData =
    Array.isArray(
      booking.package
    )
      ? booking.package[0]
      : booking.package;

  const percentage = Number(
    packageData?.washer_commission_percent
  );

  if (
    !Number.isFinite(percentage) ||
    percentage < 0 ||
    percentage > 100
  ) {
    throw new Error(
      "Package washer commission must be between 0 and 100 percent."
    );
  }

  // Approved extra charges are included in the earning base.
  const serviceAmount =
    Number(booking.service_amount || 0);
  const extraCharge =
    Number(booking.extra_charge || 0);

  if (
    !Number.isFinite(serviceAmount) ||
    serviceAmount < 0 ||
    !Number.isFinite(extraCharge) ||
    extraCharge < 0
  ) {
    throw new Error(
      "Booking service and extra charge amounts must be valid non-negative values."
    );
  }

  const gross =
    serviceAmount + extraCharge;

  const washerAmount =
    Number(
      (
        gross *
        (percentage / 100)
      ).toFixed(2)
    );

  const commission =
    Number(
      (
        gross -
        washerAmount
      ).toFixed(2)
    );

  const earningAmounts = {
    washer_id:
      booking.assigned_washer_id,

    booking_id:
      booking.id,

    gross_amount:
      gross,

    platform_commission:
      commission,

    washer_amount:
      washerAmount,
  };

  const {
    data: existingEarning,
    error: existingEarningError,
  } = await supabaseAdmin
    .from("washer_earnings")
    .select("id, status")
    .eq("booking_id", booking.id)
    .maybeSingle();

  if (existingEarningError) {
    throw existingEarningError;
  }

  if (existingEarning) return existingEarning;

  const {
    data,
    error: earningError,
  } = existingEarning
    ? await supabaseAdmin
        .from("washer_earnings")
        .update(earningAmounts)
        .eq("id", existingEarning.id)
        .select("*")
        .single()
    : await supabaseAdmin
        .from("washer_earnings")
        .insert({
          ...earningAmounts,
          status: "pending",
        })
        .select("*")
        .single();

  if (earningError) {
    throw earningError;
  }

  return data;
}