import { supabaseAdmin as db } from "../../config/supabase.js";
export async function getCustomerPaymentOptions(req, res, next) {
  try {
    const customer = await db.from("customers").select("id").eq("user_id", req.user.id).maybeSingle();
    if (customer.error) throw customer.error;
    if (!customer.data) return res.status(404).json({ message: "Booking not found." });
    const result = await db.from("bookings").select("id,booking_number,status,total_amount,assigned_washer_id")
      .eq("id", req.params.bookingId).eq("customer_id", customer.data.id).maybeSingle();
    if (result.error) throw result.error;
    const booking = result.data;
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    if (!["customer_confirmed", "payment_completed", "closed"].includes(booking.status)) return res.status(409).json({ message: "Confirm the completed service before making this payment." });
    const payments = await db.from("payments").select("id").eq("booking_id", booking.id).eq("status", "paid").limit(1);
    if (payments.error) throw payments.error;
    let washerName = "Your washer";
    if (booking.assigned_washer_id) {
      const washer = await db.from("washers").select("user_id").eq("id", booking.assigned_washer_id).maybeSingle();
      if (washer.error) throw washer.error;
      if (washer.data) {
        const profile = await db.from("profiles").select("full_name").eq("id", washer.data.user_id).maybeSingle();
        if (profile.error) throw profile.error;
        washerName = profile.data?.full_name || washerName;
      }
    }
    res.json({ booking: { id: booking.id, booking_number: booking.booking_number, status: booking.status, total_amount: booking.total_amount },
      paid: Boolean(payments.data?.length), washerName, paymentMode: "Razorpay" });
  } catch (error) { next(error); }
}
