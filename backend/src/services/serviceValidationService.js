import { supabaseAdmin } from "../config/supabase.js";
import { createWasherEarning } from "./earningService.js";

export async function validateServiceCompletion({
  bookingId,
  userId,
  role,
}) {
  if (!["washer", "supervisor", "sub_admin", "super_admin"].includes(role)) {
    throw Object.assign(new Error("Not authorized to validate service completion."), { status: 403 });
  }

  const { data: booking, error: bookingError } = await supabaseAdmin
    .from("bookings")
    .select("id, assigned_washer_id, status")
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingError) throw bookingError;
  if (!booking) throw Object.assign(new Error("Booking not found."), { status: 404 });

  if (role === "washer") {
    const { data: washer, error: washerError } = await supabaseAdmin
      .from("washers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (washerError) throw washerError;
    if (!washer || washer.id !== booking.assigned_washer_id) {
      throw Object.assign(new Error("Only the assigned washer can validate this booking."), { status: 403 });
    }
  }

  if (booking.status === "completed") {
    await createWasherEarning(bookingId);
    return booking;
  }

  if (booking.status !== "service_completed") {
    throw Object.assign(new Error("Service must be submitted with photos before validation."), { status: 409 });
  }

  const { data: afterPhoto, error: photoError } = await supabaseAdmin
    .from("booking_service_photos")
    .select("id")
    .eq("booking_id", bookingId)
    .eq("photo_type", "after")
    .limit(1)
    .maybeSingle();

  if (photoError) throw photoError;
  if (!afterPhoto) {
    throw Object.assign(new Error("At least one after-service photo is required."), { status: 400 });
  }

  const now = new Date().toISOString();
  const { data: completedBooking, error: updateError } = await supabaseAdmin
    .from("bookings")
    .update({
      status: "completed",
      service_validated_at: now,
      service_validated_by: userId,
      service_validated_role: role,
      completed_at: now,
      updated_at: now,
    })
    .eq("id", bookingId)
    .eq("status", "service_completed")
    .select("id, status, assigned_washer_id")
    .maybeSingle();

  if (updateError) throw updateError;
  if (!completedBooking) {
    throw Object.assign(new Error("This booking was already validated."), { status: 409 });
  }

  await createWasherEarning(bookingId);
  return completedBooking;
}
