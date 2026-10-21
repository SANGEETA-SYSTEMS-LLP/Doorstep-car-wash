import { supabaseAdmin } from "../../../config/supabase.js";
import { getWasher, getAssignedBooking } from "./washerJobAccess.js";

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

    if (booking.status === "washer_arrived") {
      return res.json({
        success: true,
        booking: {
          id: booking.id,
          booking_number: booking.booking_number,
          status: booking.status,
        },
      });
    }

    if (booking.status !== "washer_on_the_way") {
      return res.status(400).json({
        message: `Cannot mark arrived from status ${booking.status}.`,
      });
    }

    const now = new Date();

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update({
        status: "washer_arrived",
        washer_arrived_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", bookingId)
      .eq("assigned_washer_id", booking.assigned_washer_id)
      .eq("status", "washer_on_the_way")
      .select("*")
      .single();

    if (error) throw error;

    return res.json({
      success: true,
      booking: {
        id: data.id,
        booking_number: data.booking_number,
        status: data.status,
      },
    });
  } catch (error) {
    console.error("Mark arrived:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

