import { apiRequest } from "../core/api";

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
  if (!assignmentId) throw new Error("Assignment ID is required.");
  const { data } = await apiRequest(`/assignments/${encodeURIComponent(assignmentId)}/accept`, {
    method: "POST",
  });

  // Earnings are finalized after service/payment, not during acceptance.

  return data.assignment;
}

export async function rejectAssignment(assignmentId, reason = null) {
  return apiRequest(`/assignments/${assignmentId}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}
