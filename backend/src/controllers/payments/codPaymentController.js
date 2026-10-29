import { supabaseAdmin, createWasherEarning } from "./paymentDependencies.js";

export async function recordCodPayment(
  req,
  res
) {
  try {
    const { bookingId } =
      req.params;
    const { data: washer, error: washerError } = await supabaseAdmin
      .from("washers")
      .select("id")
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (washerError) throw washerError;
    if (!washer) return res.status(403).json({ message: "Washer profile not found." });

    const {
      data: booking,
      error,
    } = await supabaseAdmin
      .from("bookings")
      .select(`
        id,
        customer_id,
        assigned_washer_id,
        total_amount,
        payment_method,
        status
      `)
      .eq("id", bookingId)
      .eq("assigned_washer_id", washer.id)
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

    if (
      booking.payment_method !==
      "cod"
    ) {
      return res.status(400).json({
        message:
          "Booking is not COD.",
      });
    }

    if (
      booking.status !==
      "completed"
    ) {
      return res.status(400).json({
        message:
          "Service must be validated before recording payment.",
      });
    }

    const { data: payment, error: paymentError } = await supabaseAdmin.rpc("record_cod_payment_once", { p_booking_id: booking.id, p_washer_id: washer.id });
    if (paymentError) throw paymentError;

    await createWasherEarning(
      booking.id
    );

    return res.json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error("COD payment recording failed", {
      name: typeof error?.name === "string" ? error.name : "Error",
      code: typeof error?.code === "string" ? error.code : undefined,
    });
    return res.status(400).json({
      success: false,
      message: "Unable to record this cash payment. Verify the booking status and retry.",
    });
  }
}

