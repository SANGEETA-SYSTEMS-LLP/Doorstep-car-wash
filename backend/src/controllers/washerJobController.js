import crypto from "crypto";
import { storeOtp, deleteOtp } from "../services/otpService.js";
import {
  supabaseAdmin,
} from "../config/supabase.js";

async function getWasher(userId) {
  const {
    data,
    error,
  } = await supabaseAdmin
    .from("washers")
    .select("id, user_id, status, is_active")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "Washer profile not found."
    );
  }

  return data;
}

async function getAssignedBooking(
  bookingId,
  washerUserId
) {
  const washer = await getWasher(washerUserId);
  const {
    data,
    error,
  } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("assigned_washer_id", washer.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "Assigned booking not found."
    );
  }

  return data;
}

export async function startJourney(req, res) {
  try {
    const { bookingId } = req.params;
    const booking = await getAssignedBooking(bookingId, req.user.id);

    if (booking.status !== "washer_assigned") {
      return res.status(400).json({
        message: `Cannot start journey from status ${booking.status}.`,
      });
    }

    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update({
        status: "washer_on_the_way",
        updated_at: now,
      })
      .eq("id", bookingId)
      .eq("assigned_washer_id", booking.assigned_washer_id)
      .eq("status", "washer_assigned")
      .select("*")
      .single();

    if (error) throw error;

    return res.json({
      success: true,
      booking: data,
    });
  } catch (error) {
    console.error("Start journey:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function updateLocation(req, res) {
  try {
    const { latitude, longitude, heading, speed } = req.body || {};
    const toFiniteNumber = (value) => {
      if (
        (typeof value !== "number" && typeof value !== "string") ||
        (typeof value === "string" && value.trim() === "")
      ) return null;
      const number = Number(value);
      return Number.isFinite(number) ? number : null;
    };

    const lat = toFiniteNumber(latitude);
    const lng = toFiniteNumber(longitude);

    if (
      lat === null || lng === null ||
      lat < -90 || lat > 90 || lng < -180 || lng > 180
    ) {
      return res.status(400).json({
        message: "Valid latitude and longitude are required.",
      });
    }

    const washer = await getWasher(req.user.id);
    const { data, error } = await supabaseAdmin
      .from("washer_locations")
      .upsert({
        washer_id: washer.id,
        latitude: lat,
        longitude: lng,
        heading: toFiniteNumber(heading),
        speed: toFiniteNumber(speed),
        updated_at: new Date().toISOString(),
      }, { onConflict: "washer_id" })
      .select("*")
      .single();

    if (error) throw error;

    return res.json({ success: true, location: data });
  } catch (error) {
    console.error("Update location:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function markArrived(req, res) {
  try {
    const { bookingId } = req.params;
    const booking = await getAssignedBooking(bookingId, req.user.id);

    if (booking.status !== "washer_on_the_way") {
      return res.status(400).json({
        message: `Cannot mark arrived from status ${booking.status}.`,
      });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const { data: hashData, error: hashError } = await supabaseAdmin.rpc(
      "hash_service_otp",
      { p_otp: otp }
    );

    if (hashError) throw hashError;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update({
        status: "washer_arrived",
        washer_arrived_at: now.toISOString(),
        service_otp_hash: hashData,
        service_otp_expires_at: expiresAt.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", bookingId)
      .eq("assigned_washer_id", booking.assigned_washer_id)
      .eq("status", "washer_on_the_way")
      .select("*")
      .single();

    if (error) throw error;

    storeOtp(bookingId, otp);

    return res.json({
      success: true,
      booking: {
        id: data.id,
        booking_number: data.booking_number,
        status: data.status,
      },
      // Development only. Remove before production.
      developmentOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
    });
  } catch (error) {
    console.error("Mark arrived:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

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
    if (verifyError) throw verifyError;
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
    deleteOtp(bookingId);

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

    if (booking.status !== "otp_verified") {
      return res.status(400).json({
        message: "OTP must be verified before starting service.",
      });
    }

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
      .eq("status", "otp_verified")
      .select("*")
      .single();

    if (error) throw error;

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

    if (checklistItems?.length) {
      const rows = checklistItems.map((item) => ({
        booking_id: bookingId,
        checklist_item_id: item.id,
        completed: false,
      }));

      const { error: insertError } = await supabaseAdmin
        .from("booking_service_checklist")
        .upsert(rows, { onConflict: "booking_id,checklist_item_id" });

      if (insertError) throw insertError;
    }

    return res.json({ success: true, booking: data });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

export async function completeService(req, res) {
  try {
    const { bookingId } = req.params;
    const booking = await getAssignedBooking(bookingId, req.user.id);

    if (booking.status !== "service_started") {
      return res.status(400).json({
        message: "Service is not currently in progress.",
      });
    }

    const { data: checklist, error: checklistError } = await supabaseAdmin
      .from("booking_service_checklist")
      .select("id, completed")
      .eq("booking_id", bookingId);

    if (checklistError) throw checklistError;
    if (!checklist?.length) {
      return res.status(400).json({
        message: "Service checklist has not been initialized.",
      });
    }
    if (checklist.some((item) => !item.completed)) {
      return res.status(400).json({
        message: "Complete all checklist items first.",
      });
    }

    const { data: photos, error: photoError } = await supabaseAdmin
      .from("booking_service_photos")
      .select("id, photo_type")
      .eq("booking_id", bookingId);

    if (photoError) throw photoError;
    const hasBefore = photos?.some((photo) => photo.photo_type === "before");
    const hasAfter = photos?.some((photo) => photo.photo_type === "after");
    if (!hasBefore || !hasAfter) {
      return res.status(400).json({
        message: "Before and after photos are required.",
      });
    }

    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update({
        status: "service_completed",
        service_completed_at: now,
        updated_at: now,
      })
      .eq("id", bookingId)
      .eq("assigned_washer_id", booking.assigned_washer_id)
      .eq("status", "service_started")
      .select("*")
      .single();

    if (error) throw error;
    return res.json({ success: true, booking: data });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}
