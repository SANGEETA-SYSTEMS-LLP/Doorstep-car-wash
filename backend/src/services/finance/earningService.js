import {
  supabaseAdmin,
} from "../../config/supabase.js";

async function createSupervisorEarning({ bookingId, washerId, gross, percentage, platformFee, gstAmount, platformCommission }) {
  const { data: existing, error: existingError } = await supabaseAdmin.from("supervisor_earnings")
    .select("id,status").eq("booking_id", bookingId).maybeSingle();
  if (existingError) throw existingError;
  if (existing?.status !== "held") return existing;
  if (existing) {
    const { error } = await supabaseAdmin.from("supervisor_earnings").update({
      gross_amount: gross,
      platform_fee_amount: platformFee,
      gst_amount: gstAmount,
      commission_base_amount: platformCommission,
      supervisor_amount: Number((platformCommission * (percentage / 100)).toFixed(2)),
      commission_percent: percentage,
      status: "pending",
    }).eq("id", existing.id);
    if (error) throw error;
    return existing;
  }
  const { data: washer, error: washerError } = await supabaseAdmin
    .from("washers").select("id,supervisor_id").eq("id", washerId).maybeSingle();
  if (washerError) throw washerError;
  if (!washer?.supervisor_id) return null;
  const { data: supervisor, error: supervisorError } = await supabaseAdmin
    .from("profiles").select("id,role,is_active").eq("id", washer.supervisor_id).maybeSingle();
  if (supervisorError) throw supervisorError;
  if (supervisor?.role !== "supervisor" || supervisor.is_active === false) return null;
  const { error } = await supabaseAdmin.from("supervisor_earnings").upsert({
    booking_id: bookingId, supervisor_id: supervisor.id, washer_id: washer.id,
    gross_amount: gross,
    platform_fee_amount: platformFee,
    gst_amount: gstAmount,
    commission_base_amount: platformCommission,
    supervisor_amount: Number((platformCommission * (percentage / 100)).toFixed(2)),
    commission_percent: percentage,
    status: "pending",
  }, { onConflict: "booking_id", ignoreDuplicates: true });
  if (error) throw error;
  return { booking_id: bookingId, supervisor_id: supervisor.id };
}

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
      platform_fee,
      tax_amount,
      total_amount,
      status,
      service_validated_at,

      package:service_packages (
        washer_commission_percent
      )
    `)
    .eq("id", bookingId)
    .single();

  if (error) throw error;

  if (
    !booking.service_validated_at ||
    !["customer_confirmed", "closed", "payment_completed", "service_completed"].includes(booking.status)
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

  const platformFee = Number(booking.platform_fee || 0);
  const gstAmount = Number(booking.tax_amount || 0);
  const paidTotal = Number(booking.total_amount || 0);
  if (![platformFee, gstAmount, paidTotal].every(Number.isFinite) || platformFee < 0 || gstAmount < 0 || paidTotal < 0) {
    throw new Error("Booking total, platform fee and GST must be valid non-negative amounts.");
  }
  // Use the captured service portion, so discounts and approved extra charges
  // cannot make partner earnings exceed what the customer actually paid.
  const gross = Math.max(0, paidTotal - platformFee - gstAmount);

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
  if (existingEarning) {
    await createSupervisorEarning({ bookingId: booking.id, washerId: booking.assigned_washer_id, gross, percentage, platformFee, gstAmount, platformCommission: commission });
    if (existingEarning.status === "held") {
      const { data, error: releaseError } = await supabaseAdmin.from("washer_earnings")
        .update({ ...earningAmounts, status: "pending" })
        .eq("id", existingEarning.id).eq("status", "held").select("*").single();
      if (releaseError) throw releaseError;
      return data;
    }
    return existingEarning;
  }

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

  await createSupervisorEarning({ bookingId: booking.id, washerId: booking.assigned_washer_id, gross, percentage, platformFee, gstAmount, platformCommission: commission });

  return data;
}
