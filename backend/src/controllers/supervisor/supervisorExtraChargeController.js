import { supabaseAdmin } from "../../config/supabase.js";

export async function getPendingExtraCharges(
  req,
  res
) {
  try {
    const {
      data,
      error,
    } = await supabaseAdmin
      .from(
        "extra_charge_requests"
      )
      .select(`
        *,
        booking:bookings (
          id,
          booking_number,
          customer_id,
          service_address,
          total_amount
        ),
        washer:washers (
          id,
          user_id
        )
      `)
      .eq(
        "status",
        "pending"
      )
      .order(
        "created_at",
        {
          ascending: true,
        }
      );

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      requests:
        data || [],
    });
  } catch (error) {
    return res.status(500).json({
      message:
        error.message,
    });
  }
}

export async function reviewExtraCharge(req, res) {
  try {
    const { requestId } = req.params;
    const { action, note } = req.body || {};

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid action." });
    }

    const status = action === "approve" ? "approved" : "rejected";
    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from("extra_charge_requests")
      .update({
        status,
        supervisor_id: req.user.id,
        supervisor_note: note?.trim() || null,
        reviewed_at: now,
        updated_at: now,
      })
      .eq("id", requestId)
      .eq("status", "pending")
      .select("*")
      .single();

    if (error) throw error;

    return res.json({ success: true, request: data });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

