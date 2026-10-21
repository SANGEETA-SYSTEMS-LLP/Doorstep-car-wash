import { apiRequest } from "../core/api";

export function getCustomerExtraCharges(bookingId) {
  return apiRequest(`/customer/bookings/${bookingId}/extra-charges`);
}

export function respondToExtraCharge(bookingId, requestId, action) {
  return apiRequest(`/customer/bookings/${bookingId}/extra-charges/${requestId}`, {
    method: "PATCH",
    body: JSON.stringify({ action }),
  });
}

export function requestWasherExtraCharge(bookingId, reason, amount) {
  return apiRequest(`/washer/bookings/${bookingId}/extra-charge`, {
    method: "POST",
    body: JSON.stringify({ reason, amount }),
  });
}
