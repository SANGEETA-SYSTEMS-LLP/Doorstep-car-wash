import { supabaseAdmin } from "../../config/supabase.js";

export async function getCustomerBooking(bookingId, userId) {
  const { data: customer, error: customerError } = await supabaseAdmin.from("customers").select("id").eq("user_id", userId).maybeSingle();
  if (customerError) throw customerError;
  if (!customer) return null;
  const { data, error } = await supabaseAdmin.from("bookings").select("id, customer_id, assigned_washer_id, status").eq("id", bookingId).eq("customer_id", customer.id).maybeSingle();
  if (error) throw error;
  return data;
}
export async function getBookingWasher(booking) {
  if (!booking.assigned_washer_id) throw new Error("This booking does not have an assigned washer.");
  const { data, error } = await supabaseAdmin.from("washers").select("id").eq("id", booking.assigned_washer_id).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Assigned washer not found.");
  return data;
}

export async function closeBookingAndReleaseWasher(
  booking,
  washer
) {
  const now =
    new Date().toISOString();

  if (["customer_confirmed", "payment_completed"].includes(booking.status)) {
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
      .eq("status", booking.status)
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
    throw new Error("Service must be confirmed before the booking can be closed.");
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

