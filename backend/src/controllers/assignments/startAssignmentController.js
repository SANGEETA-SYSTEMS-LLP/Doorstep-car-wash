import { supabaseAdmin } from "../../config/supabase.js";
import { assignWasherToBooking, rejectAssignmentAndRetry } from "../../services/bookingAssignmentService.js";
import { createWasherEarning } from "../../services/earningService.js";

export async function startAssignment(
  req,
  res
) {
  try {
    const {
      bookingId,
    } = req.params;

    /*
     * Verify booking belongs to
     * authenticated customer.
     */

    const {
      data: booking,
      error,
    } = await supabaseAdmin
      .from("bookings")
      .select(
        "id, customer_id, status, payment_method, total_amount"
      )
      .eq("id", bookingId)
      .maybeSingle();

    if (
      error ||
      !booking
    ) {
      return res.status(404).json({
        message:
          "Booking not found.",
      });
    }

    const { data: customer, error: customerError } = await supabaseAdmin
      .from("customers").select("id").eq("user_id", req.user.id).maybeSingle();
    if (customerError) throw customerError;
    if (!customer || booking.customer_id !== customer.id) {
      return res.status(403).json({
        message:
          "You cannot assign this booking.",
      });
    }

    if (booking.status === "pending") return res.status(409).json({ message: "Your booking is waiting for supervisor review." });

    if (booking.payment_method !== "cod") {
      const {data:paid,error:paidError}=await supabaseAdmin.from("payments").select("id,amount").eq("booking_id",booking.id).eq("status","paid").maybeSingle();
      if(paidError)throw paidError;
      if(!paid || Number(paid.amount)<Number(booking.total_amount))return res.status(409).json({message:"Complete online payment before requesting a washer."});
    }
    const result =
      await assignWasherToBooking(
        booking.id
      );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error(
      "Start assignment:",
      error
    );

    return res.status(400).json({
      success: false,

      message:
        error.message ||
        "Unable to find washer.",
    });
  }
}

