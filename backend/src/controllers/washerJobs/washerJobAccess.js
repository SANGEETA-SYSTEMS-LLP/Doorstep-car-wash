import { supabaseAdmin } from "../../config/supabase.js";

export async function getWasher(userId) {
  const {
    data,
    error,
  } = await supabaseAdmin
    .from("washers")
    .select("id, user_id, status, is_active")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "Washer profile not found."
    );
  }
  if (data.is_active === false) {
    throw Object.assign(new Error("Your washer account is inactive."), { status: 403 });
  }

  return data;
}

export async function getAssignedBooking(
  bookingId,
  washerUserId
) {
  const washer = await getWasher(washerUserId);
  const {
    data,
    error,
  } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("assigned_washer_id", washer.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "Assigned booking not found."
    );
  }

  return data;
}

