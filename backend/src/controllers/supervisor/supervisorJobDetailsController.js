import { supabaseAdmin } from "../../config/supabase.js";
import { calculateDistanceKm } from "../../utils/distance.js";
import { referenceId } from "../../utils/referenceId.js";
import { washerHasScheduleConflict } from "../../services/bookingAssignmentService.js";
import { getSignedServicePhotos } from "../servicePhotoController.js";
import { enrichSupervisorBookings, normalizeServiceAddress } from "./supervisorBookingEnrichment.js";

export async function getSupervisorJobDetails(req, res) {
  try {
    const { bookingId } = req.params;
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select(`
        *,
        vehicle:vehicles (
          id,
          brand,
          model,
          vehicle_number,
          vehicle_type
        ),
        package:service_packages (
          id,
          name,
          service_id,
          duration_minutes
        )
      `)
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError) throw bookingError;

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    const bookingPackage = Array.isArray(booking.package)
      ? booking.package[0]
      : booking.package;

    let washers = [];
    if (
      !booking.assigned_washer_id &&
      ["pending", "confirmed", "finding_washer", "support_escalated"].includes(booking.status)
    ) {
      const { data, error } = await supabaseAdmin
        .from("washers")
        .select(`
          id,
          user_id,
          status,
          service_radius_km,
          rating,
          jobs_completed,
          is_active,
          is_verified,
          current_address,
          location:washer_locations (
            latitude,
            longitude,
            service_latitude,
            service_longitude,
            updated_at
          )
        `);

      if (error) throw error;
      washers = data || [];
    }

    const { data: previousAssignments, error: assignmentsError } =
      await supabaseAdmin
        .from("booking_assignments")
        .select("washer_id, status")
        .eq("booking_id", booking.id);

    if (assignmentsError) throw assignmentsError;

    const excludedWasherIds = new Set(
      (previousAssignments || [])
        .filter((assignment) =>
          ["rejected", "expired", "cancelled"].includes(assignment.status)
        )
        .map((assignment) => assignment.washer_id)
    );

    const userIds = [...new Set(washers.map(washer => washer.user_id).filter(Boolean))];
    const profiles = new Map();
    if (userIds.length) {
      const result = await supabaseAdmin.from("profiles").select("id,full_name,phone,is_active").in("id", userIds);
      if (result.error) throw result.error;
      for (const profile of result.data || []) profiles.set(profile.id, profile);
    }
    const availableWashers = [];
    for (const washer of washers) {
      const profile = profiles.get(washer.user_id);
      const location = Array.isArray(washer.location) ? washer.location[0] : washer.location;
      const reasons = [];
      const washerLatitude = location?.service_latitude ?? location?.latitude;
      const washerLongitude = location?.service_longitude ?? location?.longitude;
      const sameServiceAddress = normalizeServiceAddress(booking.service_address) !== ""
        && normalizeServiceAddress(booking.service_address) === normalizeServiceAddress(washer.current_address);
      const measuredDistanceKm = calculateDistanceKm(booking.latitude, booking.longitude, washerLatitude, washerLongitude);
      const distanceKm = sameServiceAddress ? 0 : measuredDistanceKm;
      const age = (Date.now() - Date.parse(location?.updated_at || "")) / 60000;
      const radius = Number(washer.service_radius_km || 5);
      if (!washer.is_active || !profile?.is_active) reasons.push("Washer account is inactive or incomplete.");
      if (!washer.is_verified) reasons.push("Supervisor verification required.");
      if (washer.status !== "available") reasons.push(washer.status === "busy" ? "Washer is currently busy." : "Washer must go online.");
      if (booking.latitude == null || booking.longitude == null) reasons.push("Booking map coordinates are missing.");
      if (distanceKm == null) reasons.push("Valid booking and washer map locations are required.");
      else if (!Number.isFinite(radius) || radius <= 0 || distanceKm > Math.min(Math.max(radius, 5), 7)) reasons.push(`Booking is ${Number.isFinite(radius) ? `outside the ${radius} km radius and the 7 km extended limit` : "outside the service radius"}.`);
      if (!Number.isFinite(age) || age > 15) reasons.push("Washer must refresh their live location.");
      if (excludedWasherIds.has(washer.id)) reasons.push("A previous offer was rejected, expired or cancelled.");
      if (await washerHasScheduleConflict(washer.id, booking, bookingPackage)) reasons.push("Washer has a conflicting booking.");
      availableWashers.push({
        id: washer.id, user_id: washer.user_id, name: profile?.full_name || "Washer",
        phone: profile?.phone || null, address: washer.current_address,
        referenceId: referenceId("WSH", washer.user_id), status: washer.status,
        rating: washer.rating, jobs_completed: washer.jobs_completed,
        latitude: washerLatitude, longitude: washerLongitude,
        locationUpdatedAt: location?.updated_at,
        distanceKm: distanceKm == null ? null : Number(distanceKm.toFixed(2)),
        serviceRadiusKm: radius,
        extendedRadius: distanceKm != null && distanceKm > radius && distanceKm <= 7,
        serviceAddressMatched: sameServiceAddress,
        eligible: reasons.length === 0, reasons,
      });
    }
    availableWashers.sort((a, b) => Number(b.eligible) - Number(a.eligible) || (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));

    const servicePhotos = await getSignedServicePhotos(booking.id);
    const [supervisorBooking] = await enrichSupervisorBookings([booking]);

    return res.status(200).json({
      success: true,
      job: { ...supervisorBooking, servicePhotos },
      booking: { ...supervisorBooking, servicePhotos },
      address: {
        ...supervisorBooking.address,
        service_address: supervisorBooking.service_address,
        tower: booking.tower,
        flat_number: booking.flat_number,
        landmark: booking.landmark,
        latitude: booking.latitude,
        longitude: booking.longitude,
      },
      availableWashers,
    });
  } catch (error) {
    console.error("Get supervisor job details:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load booking details.",
    });
  }
}

