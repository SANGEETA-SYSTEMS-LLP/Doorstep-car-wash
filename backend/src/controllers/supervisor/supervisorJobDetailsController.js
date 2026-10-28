import { supabaseAdmin } from "../../config/supabase.js";
import { calculateDistanceKm } from "../../utils/distance.js";
import { referenceId } from "../../../../shared/referenceId.mjs";
import { washerHasScheduleConflict } from "../../services/booking/bookingAssignmentService.js";
import { getSignedServicePhotos } from "../serviceOperations/servicePhotoController.js";
import { enrichSupervisorBookings, normalizeServiceAddress } from "./supervisorBookingEnrichment.js";
import { isWithinSupervisorArea } from "../../services/supervisor/supervisorServiceArea.js";

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
    if (req.profile?.role === "supervisor" && !isWithinSupervisorArea(booking, req.supervisorArea)) {
      return res.status(404).json({ success: false, message: "Booking not found in your service area." });
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
        .select("washer_id, status, expires_at")
        .eq("booking_id", booking.id);

    if (assignmentsError) throw assignmentsError;

    const exclusionReasonByWasherId = new Map();
    for (const assignment of previousAssignments || []) {
      const pendingOfferExpired = assignment.status === "pending"
        && assignment.expires_at
        && Date.parse(assignment.expires_at) <= Date.now();
      if (assignment.status === "rejected") {
        exclusionReasonByWasherId.set(assignment.washer_id, "Washer declined a previous offer.");
      } else if (assignment.status === "cancelled") {
        exclusionReasonByWasherId.set(assignment.washer_id, "A previous offer was cancelled.");
      } else if (assignment.status === "expired" || pendingOfferExpired) {
        exclusionReasonByWasherId.set(assignment.washer_id, "Washer did not accept the offer before its response deadline. The booking schedule is unchanged.");
      }
    }

    const userIds = [...new Set(washers.map(washer => washer.user_id).filter(Boolean))];
    const profiles = new Map();
    const payoutWasherIds = new Set();
    if (userIds.length) {
      const [profilesResult, payoutResult] = await Promise.all([
        supabaseAdmin.from("profiles").select("id,full_name,phone,is_active").in("id", userIds),
        supabaseAdmin.from("washer_payout_accounts").select("washer_id,account_label,destination_encrypted,fund_account_id").in("washer_id", washers.map(washer => washer.id)),
      ]);
      if (profilesResult.error) throw profilesResult.error;
      if (payoutResult.error) throw payoutResult.error;
      for (const profile of profilesResult.data || []) profiles.set(profile.id, profile);
      for (const payout of payoutResult.data || []) {
        if (payout.account_label && (payout.destination_encrypted || payout.fund_account_id)) payoutWasherIds.add(payout.washer_id);
      }
    }
    const availableWashers = [];
    for (const washer of washers) {
      const profile = profiles.get(washer.user_id);
      const location = Array.isArray(washer.location) ? washer.location[0] : washer.location;
      if (req.profile?.role === "supervisor" && !isWithinSupervisorArea({
        latitude: location?.service_latitude ?? location?.latitude,
        longitude: location?.service_longitude ?? location?.longitude,
      }, req.supervisorArea)) continue;
      const reasons = [];
      const washerLatitude = location?.service_latitude ?? location?.latitude;
      const washerLongitude = location?.service_longitude ?? location?.longitude;
      const sameServiceAddress = normalizeServiceAddress(booking.service_address) !== ""
        && normalizeServiceAddress(booking.service_address) === normalizeServiceAddress(washer.current_address);
      const measuredDistanceKm = calculateDistanceKm(booking.latitude, booking.longitude, washerLatitude, washerLongitude);
      const distanceKm = measuredDistanceKm;
      const age = (Date.now() - Date.parse(location?.updated_at || "")) / 60000;
      const radius = Number(washer.service_radius_km || 5);
      if (!washer.is_active || !profile?.is_active) reasons.push("Washer account is inactive or incomplete.");
      if (!washer.is_verified) reasons.push("Supervisor verification required.");
      if (!payoutWasherIds.has(washer.id)) reasons.push("Washer must save payout account details before assignment.");
      if (washer.status !== "available") reasons.push(washer.status === "busy" ? "Washer is currently busy." : "Washer must go online.");
      if (booking.latitude == null || booking.longitude == null) reasons.push("Booking map coordinates are missing.");
      if (distanceKm == null) reasons.push("Valid booking and washer map locations are required.");
      else if (!Number.isFinite(radius) || radius <= 0 || distanceKm > Math.min(Math.max(radius, 5), 7)) reasons.push(`Booking is ${Number.isFinite(radius) ? `outside the ${radius} km radius and the 7 km extended limit` : "outside the service radius"}.`);
      if (!Number.isFinite(age) || age > 15) reasons.push("Washer must refresh their live location.");
      if (exclusionReasonByWasherId.has(washer.id)) reasons.push(exclusionReasonByWasherId.get(washer.id));
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

