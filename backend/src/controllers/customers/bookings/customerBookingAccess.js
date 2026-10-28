import { supabaseAdmin } from "../../../config/supabase.js";

export const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const missingHiddenColumn = error => error?.code === "42703" || error?.code === "PGRST204"
  || /customer_hidden_at.*(does not exist|schema cache|column)/i.test(error?.message || "");

export async function getCustomerBooking(bookingId, userId) {
  const { data: customer, error: customerError } = await supabaseAdmin
    .from("customers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (customerError) throw customerError;
  if (!customer) return null;

  let result = await supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("customer_id", customer.id)
    .is("customer_hidden_at", null)
    .maybeSingle();
  if (missingHiddenColumn(result.error)) {
    result = await supabaseAdmin.from("bookings").select("*")
      .eq("id", bookingId).eq("customer_id", customer.id).maybeSingle();
  }
  const { data: booking, error } = result;

  if (error) throw error;
  return booking;
}

