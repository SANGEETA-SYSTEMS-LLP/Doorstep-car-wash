import { supabaseAdmin } from "../../../config/supabase.js";
import { getAssignedBooking } from "./washerJobAccess.js";

export async function verifyServiceOtp(req, res) {
  try {
    const { bookingId } = req.params;
    const { otp } = req.body || {};

    if (!/^\d{6}$/.test(String(otp || ""))) {
      return res.status(400).json({ message: "Enter a valid 6-digit OTP." });
    }

    const booking = await getAssignedBooking(bookingId, req.user.id);
    if (booking.status !== "washer_arrived") {
      return res.status(400).json({ message: "OTP cannot be verified at this stage." });
    }
    if (!booking.service_otp_hash) {
      return res.status(400).json({ message: "Service OTP has not been generated." });
    }

    const expiresAt = new Date(booking.service_otp_expires_at).getTime();
    if (!booking.service_otp_expires_at || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      return res.status(400).json({ message: "Service OTP has expired." });
    }

    const { data: valid, error: verifyError } = await supabaseAdmin.rpc(
      "verify_service_otp_hash",
      { p_otp: String(otp), p_hash: booking.service_otp_hash }
    );
    if (verifyError) {
      console.error("Service OTP verifier unavailable:", verifyError.code, verifyError.message);
      return res.status(503).json({ message: "OTP verification is temporarily unavailable. Please try again shortly." });
    }
    if (!valid) {
      return res.status(400).json({ message: "Incorrect OTP." });
    }

    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update({
        status: "otp_verified",
        otp_verified_at: now,
        updated_at: now,
      })
      .eq("id", bookingId)
      .eq("assigned_washer_id", booking.assigned_washer_id)
      .eq("status", "washer_arrived")
      .select("*")
      .single();

    if (error) throw error;
    return res.json({ success: true, booking: data });
  } catch (error) {
    console.error("Verify OTP:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
}

export async function startService(req, res) {
  try {
    const { bookingId } = req.params;
    const booking = await getAssignedBooking(bookingId, req.user.id);

    if (!["washer_arrived", "otp_verified"].includes(booking.status)) {
      return res.status(400).json({
        message: "The washer must arrive before starting service.",
      });
    }

    const { data: packageData, error: packageError } = await supabaseAdmin
      .from("service_packages")
      .select("service_id")
      .eq("id", booking.package_id)
      .single();

    if (packageError) throw packageError;

    const { data: checklistItems, error: checklistError } = await supabaseAdmin
      .from("service_checklist_items")
      .select("id")
      .eq("service_id", packageData.service_id)
      .eq("active", true);

    if (checklistError) throw checklistError;

    if (!checklistItems?.length) {
      return res.status(409).json({ message: "No active service checklist is configured for this package." });
    }

    const rows = checklistItems.map((item) => ({
      booking_id: bookingId,
      checklist_item_id: item.id,
      completed: false,
    }));

    const { error: insertError } = await supabaseAdmin
      .from("booking_service_checklist")
      .upsert(rows, { onConflict: "booking_id,checklist_item_id" });

    if (insertError) throw insertError;

    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update({
        status: "service_started",
        service_started_at: now,
        updated_at: now,
      })
      .eq("id", bookingId)
      .eq("assigned_washer_id", booking.assigned_washer_id)
      .in("status", ["washer_arrived", "otp_verified"])
      .select("*")
      .single();

    if (error) throw error;

    return res.json({ success: true, booking: data });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

