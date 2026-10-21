import { supabaseAdmin } from "../../../config/supabase.js";
import { getCustomerBooking } from "./customerBookingAccess.js";

import { createWasherEarning } from "../../../services/finance/earningService.js";
import { getOtp } from "../../../services/auth/otpService.js";
import { getSignedServicePhotos } from "../../serviceOperations/servicePhotoController.js";
import { referenceId } from "../../../utils/referenceId.js";

export async function getServiceOtp(
  req,
  res
) {
  try {
    const { bookingId } =
      req.params;

    const booking = await getCustomerBooking(bookingId, req.user.id);
    if (!booking) {
      return res.status(404).json({
        message:
          "Booking not found.",
      });
    }

    if (
      booking.status !==
      "washer_arrived"
    ) {
      return res.status(400).json({
        message:
          "Service OTP is not available yet.",
      });
    }

    const otp = getOtp(booking.id);
    if (!otp) {
      return res.status(410).json({
        message:
          "OTP has expired. Request a new OTP.",
      });
    }

    return res.json({ success: true, otp, expiresAt: booking.service_otp_expires_at });
  } catch (error) {
    console.error(
      "Get service OTP:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to load OTP.",
    });
  }
}

export async function getPendingExtraCharges(req, res) {
  try {
    const { bookingId } = req.params;
    const booking = await getCustomerBooking(bookingId, req.user.id);
    if (!booking) {
      return res.status(403).json({ message: "Booking not available." });
    }

    const { data, error } = await supabaseAdmin
      .from("extra_charge_requests")
      .select("*")
      .eq("booking_id", bookingId)
      .eq("status", "approved");

    if (error) throw error;

    return res.json({ success: true, requests: data || [] });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

export async function respondExtraCharge(req, res) {
  try {
    const { bookingId, requestId } = req.params;
    const { action } = req.body || {};
    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid action." });
    }

    const booking = await getCustomerBooking(bookingId, req.user.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    const { data, error } = await supabaseAdmin.rpc("respond_extra_charge", {
      p_request_id: requestId,
      p_booking_id: bookingId,
      p_customer_user_id: req.user.id,
      p_action: action,
    });
    if (error) throw error;

    return res.json({ success: true, ...data });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

export async function getServicePhotos(req, res) {
  try {
    const { bookingId } = req.params;
    const booking = await getCustomerBooking(bookingId, req.user.id);
    if (!booking) {
      return res.status(403).json({ message: "Booking not available." });
    }

    const result = await getSignedServicePhotos(bookingId);

    return res.json({ success: true, photos: result });
  } catch (error) {
    console.error("Get service photos:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

