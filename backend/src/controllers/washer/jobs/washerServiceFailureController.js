import { supabaseAdmin as db } from "../../../config/supabase.js";
import { getAssignedBooking } from "./washerJobAccess.js";

export async function reportServiceFailure(req, res, next) {
  try {
    const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
    if (reason.length < 5 || reason.length > 1000) return res.status(400).json({ message: "Describe why the service could not be completed (5 to 1000 characters)." });
    const booking = await getAssignedBooking(req.params.bookingId, req.user.id);
    if (["service_completed", "customer_confirmed", "payment_completed", "closed", "completed"].includes(booking.status) || booking.service_validated_at) {
      return res.status(409).json({ message: "This service is already marked complete and cannot be reported as incomplete." });
    }
    const start = booking.scheduled_date && booking.scheduled_start_time
      ? Date.parse(`${booking.scheduled_date}T${String(booking.scheduled_start_time).slice(0, 8)}+05:30`)
      : NaN;
    const { data: packageData, error: packageError } = await db.from("service_packages")
      .select("duration_minutes").eq("id", booking.package_id).maybeSingle();
    if (packageError) throw packageError;
    const deadline = start + (Number(packageData?.duration_minutes) || 60) * 60_000 + 30 * 60_000;
    if (!Number.isFinite(start) || Date.now() < deadline) {
      return res.status(409).json({ message: "You can report an incomplete service after the scheduled service window has ended." });
    }
    const { data: payment, error: paymentError } = await db.from("payments")
      .select("id,amount,status,provider,provider_payment_id,customer_id")
      .eq("booking_id", booking.id).eq("status", "paid").eq("provider", "razorpay")
      .not("provider_payment_id", "is", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (paymentError) throw paymentError;
    if (!payment) return res.status(409).json({ message: "A captured online payment is required before reporting this service for refund review." });

    const { data: existing, error: existingError } = await db.from("service_failure_reports")
      .select("id,status").eq("booking_id", booking.id).maybeSingle();
    if (existingError) throw existingError;
    if (existing) return res.status(409).json({ message: "A service failure report already exists for this booking and is being handled by Accounts." });

    const { data, error } = await db.from("service_failure_reports").insert({
      booking_id: booking.id,
      payment_id: payment.id,
      washer_id: booking.assigned_washer_id,
      reason,
      status: "pending_review",
      reported_by: req.user.id,
    }).select("id,status").single();
    if (error?.code === "23505") return res.status(409).json({ message: "A service failure report already exists for this booking and is being handled by Accounts." });
    if (error) throw error;
    return res.status(201).json({ success: true, report: data });
  } catch (error) {
    if (["42P01", "PGRST205"].includes(error?.code)) {
      return res.status(503).json({ message: "Service failure reporting is not configured yet. Apply the paid service failure refund migration, then retry." });
    }
    next(error);
  }
}
