import {
  supabaseAdmin,
} from "../config/supabase.js";

import {
  calculateDistanceKm,
} from "../utils/distance.js";

import {
  washerHasScheduleConflict,
} from "../services/bookingAssignmentService.js";
import { getSignedServicePhotos } from "./servicePhotoController.js";

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
          location:washer_locations (
            latitude,
            longitude,
            updated_at
          ),
          skills:washer_skills (
            service_id
          )
        `)
        .eq("is_active", true)
        .eq("status", "available");

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

    const availableWashers = [];

    if (booking.latitude != null && booking.longitude != null) {
      for (const washer of washers || []) {
        if (excludedWasherIds.has(washer.id)) continue;

        if (
          bookingPackage?.service_id &&
          !(washer.skills || []).some(
            (skill) =>
              skill.service_id === bookingPackage.service_id
          )
        ) {
          continue;
        }

        const location = Array.isArray(washer.location)
          ? washer.location[0]
          : washer.location;

        if (!location?.updated_at) continue;

        const locationAgeMinutes =
          (Date.now() - new Date(location.updated_at).getTime()) / 60000;

        if (!Number.isFinite(locationAgeMinutes) || locationAgeMinutes > 15) {
          continue;
        }

        const distanceKm = calculateDistanceKm(
          booking.latitude,
          booking.longitude,
          location.latitude,
          location.longitude
        );

        const serviceRadius = Number(washer.service_radius_km || 5);

        if (
          distanceKm == null ||
          !Number.isFinite(serviceRadius) ||
          serviceRadius <= 0 ||
          distanceKm > serviceRadius
        ) {
          continue;
        }

        if (
          await washerHasScheduleConflict(
            washer.id,
            booking,
            bookingPackage
          )
        ) {
          continue;
        }

        availableWashers.push({
          id: washer.id,
          user_id: washer.user_id,
          status: washer.status,
          rating: washer.rating,
          jobs_completed: washer.jobs_completed,
          latitude: location.latitude,
          longitude: location.longitude,
          locationUpdatedAt: location.updated_at,
          distanceKm: Number(distanceKm.toFixed(2)),
        });
      }
    }

    availableWashers.sort((a, b) => a.distanceKm - b.distanceKm);

    const servicePhotos = await getSignedServicePhotos(booking.id);

    return res.status(200).json({
      success: true,
      job: { ...booking, servicePhotos },
      booking: { ...booking, servicePhotos },
      address: {
        service_address: booking.service_address,
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

export async function assignSupervisorWasher(req, res) {
  try {
    const { bookingId } = req.params;
    const { washerId } = req.body || {};

    if (!washerId) {
      return res.status(400).json({
        success: false,
        message: "Washer ID is required.",
      });
    }

    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const { data, error } = await supabaseAdmin.rpc(
      "supervisor_assign_washer",
      {
        p_booking_id: bookingId,
        p_washer_id: washerId,
        p_supervisor_id: req.user.id,
      }
    );

    if (error) {
      console.error("Supervisor washer assignment:", error);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Washer assigned successfully.",
      assignment: data,
    });
  } catch (error) {
    console.error("Assign supervisor washer:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to assign washer.",
    });
  }
}

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

// Fetch related records by their booking foreign keys, keeping the list response
// compatible with the supervisor pages without selecting legacy booking columns.
async function enrichSupervisorBookings(bookings) {
  async function loadRelated(table, foreignKey, columns) {
    const ids = [...new Set(bookings.map((booking) => booking[foreignKey]).filter(Boolean))];
    if (!ids.length) return new Map();

    const { data, error } = await supabaseAdmin
      .from(table)
      .select(columns)
      .in("id", ids);
    if (error) throw error;
    return new Map((data || []).map((record) => [record.id, record]));
  }

  const [addresses, vehicles, packages] = await Promise.all([
    loadRelated("customer_addresses", "address_id",
      "id, address_line, tower, flat_number, landmark, city, state, postal_code, latitude, longitude"),
    loadRelated("vehicles", "vehicle_id", "id, brand, model, vehicle_number, vehicle_type"),
    loadRelated("service_packages", "package_id", "id, name, duration_minutes"),
  ]);

  return bookings.map((booking) => {
    const address = addresses.get(booking.address_id) || null;
    return {
      ...booking,
      address,
      service_address: address
        ? [address.address_line, address.tower, address.flat_number,
            address.landmark, address.city, address.state, address.postal_code]
            .filter(Boolean).join(", ")
        : "Address unavailable",
      scheduled_time: booking.scheduled_start_time,
      vehicle: vehicles.get(booking.vehicle_id) || null,
      package: packages.get(booking.package_id) || null,
    };
  });
}

export async function getActiveJobs(req, res) {
  try {
    const activeStatuses = [
      "pending",
      "confirmed",
      "finding_washer",
      "washer_assigned",
      "washer_on_the_way",
      "washer_arrived",
      "otp_verified",
      "service_started",
      "service_completed",
    ];
    const { data: bookings, error } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .in("status", activeStatuses)
      .order("scheduled_date", { ascending: true });

    if (error) throw error;

    return res.json({
      success: true,
      jobs: await enrichSupervisorBookings(bookings || []),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getEscalations(req, res) {
  try {
    const { data: bookings, error } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .or("requires_supervisor.eq.true,status.eq.support_escalated")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      escalations: await enrichSupervisorBookings(bookings || []),
    });
  } catch (error) {
    console.error("Get supervisor escalations error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to load supervisor escalations",
    });
  }
}

export async function getSupervisorDashboard(
  req,
  res
) {
  try {
    const activeStatuses = [
      "pending",
      "confirmed",
      "finding_washer",
      "washer_assigned",
      "washer_on_the_way",
      "washer_arrived",
      "otp_verified",
      "service_started",
      "service_completed",
    ];

    const {
      count: activeJobs,
      error: activeError,
    } = await supabaseAdmin
      .from("bookings")
      .select(
        "id",
        {
          count: "exact",
          head: true,
        }
      )
      .in(
        "status",
        activeStatuses
      );

    if (activeError) {
      throw activeError;
    }

    const {
      count: escalations,
      error: escalationError,
    } = await supabaseAdmin
      .from("bookings")
      .select(
        "id",
        {
          count: "exact",
          head: true,
        }
      )
      .or("requires_supervisor.eq.true,status.eq.support_escalated");

    if (escalationError) {
      throw escalationError;
    }

    const { count: pendingExtraCharges, error: extraChargeError } = await supabaseAdmin
      .from("extra_charge_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    if (extraChargeError) {
      throw extraChargeError;
    }

    const {
      count: completedToday,
      error: completedError,
    } = await supabaseAdmin
      .from("bookings")
      .select(
        "id",
        {
          count: "exact",
          head: true,
        }
      )
      .gte(
        "completed_at",
        startOfTodayIso()
      )
      .eq("status", "completed");

    if (completedError) {
      throw completedError;
    }

    return res.json({
      success: true,
      stats: {
        activeJobs:
          activeJobs || 0,
        escalations:
          escalations || 0,
        pendingExtraCharges: pendingExtraCharges || 0,
        completedToday:
          completedToday || 0,
      },
    });
  } catch (error) {
    console.error(
      "Supervisor dashboard:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
}

function startOfTodayIso() {
  const date =
    new Date();

  date.setHours(
    0,
    0,
    0,
    0
  );

  return date.toISOString();
}
