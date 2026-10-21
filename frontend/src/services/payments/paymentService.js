import {
  apiRequest,
} from "../core/api";

export function createPaymentOrder(
  bookingId
) {
  return apiRequest(
    `/payments/bookings/${bookingId}/order`,
    {
      method: "POST",
    }
  );
}

export function verifyOnlinePayment(
  payload
) {
  return apiRequest(
    "/payments/verify",
    {
      method: "POST",
      body:
        JSON.stringify(payload),
    }
  );
}

export function recordCodPayment(
  bookingId
) {
  return apiRequest(
    `/payments/bookings/${bookingId}/cod`,
    {
      method: "POST",
    }
  );
}