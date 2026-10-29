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
    // Legacy service OTP hashes may still be present on existing database rows.
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

export async function getCustomerBookingByNumber(req, res) {
  try {
    const bookingNumber = typeof req.params.bookingNumber === "string" ? req.params.bookingNumber.trim() : "";
    if (!/^[A-Z0-9-]{3,64}$/i.test(bookingNumber)) {
      return res.status(400).json({ message: "Invalid booking number." });
    }
    const { data: customer, error: customerError } = await supabaseAdmin.from("customers")
      .select("id").eq("user_id", req.user.id).maybeSingle();
    if (customerError) throw customerError;
    if (!customer) return res.status(404).json({ message: "Booking not found." });
    const { data: booking, error } = await supabaseAdmin.from("bookings")
      .select("id,booking_number,status,scheduled_date,scheduled_start_time,service_address,total_amount,vehicle_id,package_id")
      .eq("booking_number", bookingNumber).eq("customer_id", customer.id).maybeSingle();
    if (error) throw error;
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    return res.json({ success: true, booking });
  } catch (error) {
    console.error("Get customer booking by number failed", {
      name: typeof error?.name === "string" ? error.name : "Error",
      code: typeof error?.code === "string" ? error.code : undefined,
    });
    return res.status(500).json({ message: "Unable to load booking details." });
  }
}

export async function getTrackingWasherLocation(req, res) {
  if (!uuidPattern.test(req.params.bookingId || "")) return res.status(400).json({ message: "Invalid booking ID." });
  try {
    const booking = await getCustomerBooking(req.params.bookingId, req.user.id);
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    if (!booking.assigned_washer_id || !["washer_assigned", "washer_on_the_way", "washer_arrived", "otp_verified", "service_started"].includes(booking.status)) {
      return res.json({ location: null });
    }
    const { data, error } = await supabaseAdmin.from("washer_locations")
      .select("latitude,longitude,heading,speed,updated_at")
      .eq("washer_id", booking.assigned_washer_id).maybeSingle();
    if (error) throw error;
    return res.json({ location: data || null });
  } catch (error) {
    console.error("Customer washer location lookup failed", {
      name: typeof error?.name === "string" ? error.name : "Error",
      code: typeof error?.code === "string" ? error.code : undefined,
    });
    return res.status(500).json({ message: "Unable to load the washer's location." });
  }
}

