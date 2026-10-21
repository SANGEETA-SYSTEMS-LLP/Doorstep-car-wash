import { supabaseAdmin } from "../../../config/supabase.js";

export const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

export async function getCustomerBooking(bookingId, userId) {
  const { data: customer, error: customerError } = await supabaseAdmin
    .from("customers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (customerError) throw customerError;
  if (!customer) return null;

  const { data: booking, error } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("customer_id", customer.id)
    .maybeSingle();

  if (error) throw error;
  return booking;
}

