import {
  supabaseAdmin,
} from "../config/supabase.js";

import {
  calculateDistanceKm,
} from "../utils/distance.js";

const ASSIGNMENT_TIMEOUT_MINUTES = 2;

export async function assignWasherToBooking(
  bookingId
) {
  /*
   * 1. Load booking.
   */

  const {
    data: booking,
    error: bookingError,
  } = await supabaseAdmin
    .from("bookings")
    .select(`
      id,
      booking_number,
      customer_id,
      assigned_washer_id,
      address_id,
      latitude,
      longitude,
      scheduled_date,
      scheduled_start_time,
      status,
      package:service_packages (
        id,
        service_id,
        duration_minutes
      )
    `)
    .eq("id", bookingId)
    .maybeSingle();

  if (
    bookingError ||
    !booking
  ) {
    throw new Error(
      "Booking not found."
    );
  }

  const bookingPackage = Array.isArray(booking.package)
    ? booking.package[0]
    : booking.package;

  if (
    ![
      "pending",
      "finding_washer",
    ].includes(booking.status)
  ) {
    throw new Error(
      `Booking cannot be assigned from status: ${booking.status}`
    );
  }

  if (booking.assigned_washer_id) {
    throw new Error(
      "Booking already has an assigned washer."
    );
  }

  if ((booking.latitude == null || booking.longitude == null) && booking.address_id) {
    const { data: address, error: addressError } = await supabaseAdmin.from("customer_addresses").select("latitude, longitude").eq("id", booking.address_id).maybeSingle();
    if (addressError) throw addressError;
    booking.latitude = address?.latitude;
    booking.longitude = address?.longitude;
  }

  if (
    booking.latitude == null ||
    booking.longitude == null
  ) {
    await markSupervisorFallback(
      booking.id
    );

    throw new Error(
      "Booking does not have valid coordinates."
    );
  }

  /*
   * 2. Mark booking as finding washer.
   */

  const {
    error: statusError,
  } = await supabaseAdmin
    .from("bookings")
    .update({
      status:
        "finding_washer",

      requires_supervisor:
        false,

      updated_at:
        new Date().toISOString(),
    })
    .eq("id", booking.id);

  if (statusError) {
    throw statusError;
  }

  /*
   * 3. Find active/available washers.
   */

  const {
    data: washers,
    error: washersError,
  } = await supabaseAdmin
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

  if (washersError) {
    throw washersError;
  }

  if (
    !washers ||
    washers.length === 0
  ) {
    await markSupervisorFallback(
      booking.id
    );

    return {
      assigned: false,
      reason:
        "No available washers.",
      supervisorFallback: true,
    };
  }

  /*
   * 4. Find washers already rejected
   *    for this booking.
   */

  const {
    data: oldAssignments,
    error: oldAssignmentsError,
  } = await supabaseAdmin
    .from("booking_assignments")
    .select(
      "washer_id, status"
    )
    .eq(
      "booking_id",
      booking.id
    );

  if (oldAssignmentsError) {
    throw oldAssignmentsError;
  }

  const excludedWasherIds =
    new Set(
      (oldAssignments || [])
        .filter((assignment) =>
          [
            "rejected",
            "expired",
            "cancelled",
          ].includes(
            assignment.status
          )
        )
        .map(
          (assignment) =>
            assignment.washer_id
        )
    );

  /*
   * 5. Calculate distance.
   */

  const candidates = [];

  for (const washer of washers) {
    if (
      excludedWasherIds.has(
        washer.id
      )
    ) {
      continue;
    }

    const requiredServiceId = bookingPackage?.service_id;

    if (requiredServiceId) {
      const canPerformService = (washer.skills || []).some(
        (skill) => skill.service_id === requiredServiceId
      );

      if (!canPerformService) {
        continue;
      }
    }

    const location =
      Array.isArray(
        washer.location
      )
        ? washer.location[0]
        : washer.location;

    if (!location) {
      continue;
    }

    const locationUpdatedAt = location.updated_at
      ? new Date(location.updated_at).getTime()
      : NaN;
    const locationAgeMinutes = (Date.now() - locationUpdatedAt) / 60000;

    if (!Number.isFinite(locationUpdatedAt) || locationAgeMinutes > 15) {
      continue;
    }

    const distanceKm =
      calculateDistanceKm(
        booking.latitude,
        booking.longitude,
        location.latitude,
        location.longitude
      );

    if (distanceKm == null) {
      continue;
    }

    const serviceRadius =
      Number(
        washer.service_radius_km ||
          5
      );

    if (
      distanceKm >
      serviceRadius
    ) {
      continue;
    }

    candidates.push({
      ...washer,
      distanceKm,
    });
  }

  if (
    candidates.length === 0
  ) {
    await markSupervisorFallback(
      booking.id
    );

    return {
      assigned: false,
      reason:
        "No washer is within the service radius.",
      supervisorFallback: true,
    };
  }

  /*
   * 6. Check schedule conflicts.
   */

  const conflictFreeCandidates = [];

  for (const candidate of candidates) {
    const hasConflict =
      await washerHasScheduleConflict(
        candidate.id,
        booking,
        bookingPackage
      );

    if (!hasConflict) {
      conflictFreeCandidates.push(
        candidate
      );
    }
  }

  if (
    conflictFreeCandidates.length ===
    0
  ) {
    await markSupervisorFallback(
      booking.id
    );

    return {
      assigned: false,
      reason:
        "Available washers have schedule conflicts.",
      supervisorFallback: true,
    };
  }

  /*
   * 7. Rank candidates.
   *
   * Primary:
   * shortest distance
   *
   * Secondary:
   * highest rating
   *
   * Third:
   * fewer total jobs
   */

  conflictFreeCandidates.sort(
    (a, b) => {
      if (
        Math.abs(
          a.distanceKm -
            b.distanceKm
        ) > 0.1
      ) {
        return (
          a.distanceKm -
          b.distanceKm
        );
      }

      const ratingDifference =
        Number(b.rating || 0) -
        Number(a.rating || 0);

      if (
        ratingDifference !== 0
      ) {
        return ratingDifference;
      }

      return (
        Number(
          a.jobs_completed || 0
        ) -
        Number(
          b.jobs_completed || 0
        )
      );
    }
  );

  const selectedWasher =
    conflictFreeCandidates[0];

  /*
   * 8. Calculate attempt number.
   */

  const attemptNumber =
    (oldAssignments?.length || 0) +
    1;

  const expiresAt =
    new Date(
      Date.now() +
        ASSIGNMENT_TIMEOUT_MINUTES *
          60 *
          1000
    ).toISOString();

  /*
   * 9. Create/update assignment.
   */

  const {
    data: assignment,
    error: assignmentError,
  } = await supabaseAdmin
    .from("booking_assignments")
    .upsert(
      {
        booking_id:
          booking.id,

        washer_id:
          selectedWasher.id,

        status:
          "pending",

        distance_km:
          Number(
            selectedWasher.distanceKm.toFixed(
              2
            )
          ),

        attempt_number:
          attemptNumber,

        offered_at:
          new Date().toISOString(),

        expires_at:
          expiresAt,

        responded_at:
          null,

        rejection_reason:
          null,
      },
      {
        onConflict:
          "booking_id,washer_id",
      }
    )
    .select("*")
    .single();

  if (assignmentError) {
    throw assignmentError;
  }

  return {
    assigned: true,

    bookingId:
      booking.id,

    bookingNumber:
      booking.booking_number,

    assignment,

    washer: {
      id:
        selectedWasher.id,

      userId:
        selectedWasher.user_id,

      distanceKm:
        Number(
          selectedWasher.distanceKm.toFixed(
            2
          )
        ),

      rating:
        selectedWasher.rating,
    },
  };
}

export async function washerHasScheduleConflict(washerId, booking, bookingPackage) {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("id, scheduled_date, scheduled_start_time, status")
    .eq("assigned_washer_id", washerId)
    .eq("scheduled_date", booking.scheduled_date)
    .in("status", [
      "washer_assigned",
      "washer_on_the_way",
      "washer_arrived",
      "otp_verified",
      "service_started",
      "service_completed",
    ]);

  if (error) throw error;
  if (!data || data.length === 0) return false;

  const requestedMinutes = timeToMinutes(booking.scheduled_start_time);
  const requestedDuration = Number(bookingPackage?.duration_minutes || 60);
  const TRAVEL_BUFFER = 30;
  const conflictWindow = requestedDuration + TRAVEL_BUFFER;

  return data.some((existingBooking) => {
    const existingMinutes = timeToMinutes(existingBooking.scheduled_start_time);
    return Math.abs(requestedMinutes - existingMinutes) < conflictWindow;
  });
}

function timeToMinutes(time) {
  if (!time) return 0;
  const [hours, minutes] = String(time).split(":").map(Number);
  return hours * 60 + minutes;
}

async function markSupervisorFallback(bookingId) {
  const { error } = await supabaseAdmin
    .from("bookings")
    .update({
      status: "finding_washer",
      requires_supervisor: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  if (error) {
    console.error("Supervisor fallback error:", error);
  }
}

export async function rejectAssignmentAndRetry({
  assignmentId,
  washerUserId,
  reason = null,
}) {
  const { data: assignment, error } = await supabaseAdmin
    .from("booking_assignments")
    .select(`
      id,
      booking_id,
      washer_id,
      status,
      washer:washers (
        id,
        user_id
      )
    `)
    .eq("id", assignmentId)
    .maybeSingle();

  if (error || !assignment) {
    throw new Error("Assignment not found.");
  }

  const assignmentWasher = Array.isArray(assignment.washer)
    ? assignment.washer[0]
    : assignment.washer;

  if (assignmentWasher?.user_id !== washerUserId) {
    throw new Error("You cannot reject this assignment.");
  }

  if (assignment.status !== "pending") {
    throw new Error("Assignment is no longer pending.");
  }

  const { error: updateError } = await supabaseAdmin
    .from("booking_assignments")
    .update({
      status: "rejected",
      responded_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq("id", assignment.id);

  if (updateError) {
    throw updateError;
  }

  return assignWasherToBooking(assignment.booking_id);
}
