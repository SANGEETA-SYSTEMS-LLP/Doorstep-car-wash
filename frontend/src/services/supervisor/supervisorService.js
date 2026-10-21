import {
  apiRequest,
} from "../core/api";

export function getSupervisorDashboard() {
  return apiRequest(
    "/supervisor/dashboard"
  );
}

export function getSupervisorWasherRoster() {
  return apiRequest("/supervisor/washer-roster");
}

export function getSupervisorJobs() {
  return apiRequest(
    "/supervisor/jobs"
  );
}

export function getSupervisorEscalations() {
  return apiRequest(
    "/supervisor/escalations"
  );
}

export function getSupervisorExtraCharges() {
  return apiRequest(
    "/supervisor/extra-charges"
  );
}

export function reviewSupervisorExtraCharge(
  requestId,
  action,
  note = ""
) {
  return apiRequest(
    `/supervisor/extra-charges/${requestId}`,
    {
      method: "PATCH",

      body: JSON.stringify({
        action,
        note,
      }),
    }
  );
}

export function getSupervisorJobDetails(bookingId) {
  return apiRequest(
    `/supervisor/jobs/${bookingId}`
  );
}

export function validateSupervisorService(bookingId) {
  return apiRequest(`/supervisor/jobs/${bookingId}/validate`, {
    method: "POST",
  });
}

export function getEscalationDetails(bookingId) {
  return apiRequest(
    `/supervisor/escalations/${bookingId}`
  );
}

export function assignWasherToBooking(
  bookingId,
  washerId
) {
  return apiRequest(
    `/supervisor/jobs/${bookingId}/assign`,
    {
      method: "POST",
      body: JSON.stringify({
        washerId,
      }),
    }
  );
}
export const acceptSupervisorBooking = id => apiRequest(`/supervisor/jobs/${encodeURIComponent(id)}/accept`, { method: "POST" });
