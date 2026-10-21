import {
  apiRequest,
} from "../core/api";

export function getServiceChecklist(
  bookingId
) {
  return apiRequest(
    `/washer/bookings/${bookingId}/checklist`
  );
}

export function updateServiceChecklist(
  bookingId,
  checklistId,
  completed
) {
  return apiRequest(
    `/washer/bookings/${bookingId}/checklist/${checklistId}`,
    {
      method: "PATCH",

      body: JSON.stringify({
        completed,
      }),
    }
  );
}