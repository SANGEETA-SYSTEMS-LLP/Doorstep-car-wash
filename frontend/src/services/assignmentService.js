import { apiRequest } from "./api";
import { supabase } from "./supabase";

export async function findWasherForBooking(bookingId) {
  if (!bookingId) {
    throw new Error("Booking ID is required.");
  }

  return apiRequest(`/bookings/${bookingId}/assign`, {
    method: "POST",
  });
}

export async function acceptAssignment(
  assignmentId
) {
  const { data, error } =
    await supabase.rpc(
      "accept_booking_assignment",
      {
        p_assignment_id:
          assignmentId,
      }
    );

  if (error) {
    console.error(
      "Accept assignment error:",
      error
    );

    throw error;
  }

  // Earnings are finalized after service/payment, not during acceptance.

  return data;
}

export async function rejectAssignment(assignmentId, reason = null) {
  return apiRequest(`/assignments/${assignmentId}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}
