import { supabaseAdmin } from "../../../config/supabase.js";
import { getCustomerBooking, uuidPattern } from "./customerBookingAccess.js";

import { referenceId } from "../../../../../shared/referenceId.mjs";

export async function getCustomerBookingDetails(req, res) {
  try {
    const { bookingId } = req.params;
    if (!uuidPattern.test(bookingId || "")) {
      return res.status(400).json({ message: "Invalid booking ID." });
    }

    const booking = await getCustomerBooking(bookingId, req.user.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    const [vehicleResult, packageResult] = await Promise.all([
      booking.vehicle_id
        ? supabaseAdmin
          .from("vehicles")
          .select("id, brand, model, vehicle_number, vehicle_type, colour")
          .eq("id", booking.vehicle_id)
          .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      booking.package_id
        ? supabaseAdmin
          .from("service_packages")
          .select("id, name, description, price, duration_minutes")
          .eq("id", booking.package_id)
          .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (vehicleResult.error) throw vehicleResult.error;
    if (packageResult.error) throw packageResult.error;

    const customerBooking = { ...booking };
    delete customerBooking.service_otp_hash;
    delete customerBooking.service_otp_expires_at;

    let washer = null;
    if (booking.assigned_washer_id) {
      const { data: washerRecord, error: washerError } = await supabaseAdmin
        .from("washers")
        .select("id, user_id, rating, jobs_completed, status")
        .eq("id", booking.assigned_washer_id)
        .maybeSingle();

      if (washerError) throw washerError;
      if (!washerRecord) {
        throw new Error("Assigned washer details are unavailable.");
      }

      const { data: washerProfile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("full_name, phone, avatar_url")
        .eq("id", washerRecord.user_id)
        .maybeSingle();

      if (profileError) throw profileError;

      washer = {
        id: washerRecord.id,
        user_id: washerRecord.user_id,
        referenceId: referenceId("WSH", washerRecord.user_id),
        name: washerProfile?.full_name || "Washer Partner",
        phone: washerProfile?.phone || null,
        avatarUrl: washerProfile?.avatar_url || null,
        rating: washerRecord.rating,
        totalJobs: washerRecord.jobs_completed,
        status: washerRecord.status,
      };
    }

    return res.json({
      success: true,
      booking: {
        ...customerBooking,
        vehicle: vehicleResult.data,
        package: packageResult.data,
        washer,
      },
    });
  } catch (error) {
    console.error("Get customer booking details:", error);
    return res.status(500).json({
      message: "Unable to load booking details.",
    });
  }
}

