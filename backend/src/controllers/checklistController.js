import {
  supabaseAdmin,
} from "../config/supabase.js";

export async function getChecklist(
  req,
  res
) {
  try {
    const {
      bookingId,
    } = req.params;

    const {
      data: booking,
    } = await supabaseAdmin
      .from("bookings")
      .select(
        "id, washer_id"
      )
      .eq("id", bookingId)
      .eq(
        "washer_id",
        req.user.id
      )
      .maybeSingle();

    if (!booking) {
      return res.status(403).json({
        message:
          "Booking not available.",
      });
    }

    const {
      data,
      error,
    } = await supabaseAdmin
      .from(
        "booking_service_checklist"
      )
      .select(`
        id,
        completed,
        completed_at,

        item:service_checklist_items (
          id,
          title,
          sort_order
        )
      `)
      .eq(
        "booking_id",
        bookingId
      );

    if (error) {
      throw error;
    }

    const sorted =
      (data || []).sort(
        (a, b) =>
          Number(
            a.item?.sort_order ||
              0
          ) -
          Number(
            b.item?.sort_order ||
              0
          )
      );

    return res.json({
      success: true,
      checklist: sorted,
    });
  } catch (error) {
    return res.status(400).json({
      message:
        error.message,
    });
  }
}

export async function updateChecklistItem(req, res) {
  try {
    const { bookingId, checklistId } = req.params;
    const { completed } = req.body || {};

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select("id, washer_id, status")
      .eq("id", bookingId)
      .eq("washer_id", req.user.id)
      .maybeSingle();

    if (bookingError) throw bookingError;

    if (!booking || booking.status !== "service_started") {
      return res.status(403).json({
        message: "Checklist cannot be updated.",
      });
    }

    const isCompleted = completed === true;
    const { data, error } = await supabaseAdmin
      .from("booking_service_checklist")
      .update({
        completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
      })
      .eq("id", checklistId)
      .eq("booking_id", bookingId)
      .select("*")
      .single();

    if (error) throw error;

    return res.json({ success: true, checklistItem: data });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}
