import {
  apiRequest,
} from "../core/api";

export function startWasherJourney(
  bookingId
) {
  return apiRequest(
    `/washer/bookings/${bookingId}/start-journey`,
    {
      method: "POST",
    }
  );
}

export function sendWasherLocation({
  latitude,
  longitude,
  heading,
  accuracy,
  speed,
}) {
  return apiRequest(
    "/washer/location",
    {
      method: "POST",

      body: JSON.stringify({
        latitude,
        longitude,
        heading,
        accuracy,
        speed,
      }),
    }
  );
}

export function markWasherArrived(
  bookingId
) {
  return apiRequest(
    `/washer/bookings/${bookingId}/arrived`,
    {
      method: "POST",
    }
  );
}

export function verifyWasherOtp(
  bookingId,
  otp
) {
  return apiRequest(
    `/washer/bookings/${bookingId}/verify-otp`,
    {
      method: "POST",

      body: JSON.stringify({
        otp,
      }),
    }
  );
}

export function startBookingService(
  bookingId
) {
  return apiRequest(
    `/washer/bookings/${bookingId}/start-service`,
    {
      method: "POST",
    }
  );
}

export function completeBookingService(bookingId) {
  return apiRequest(`/washer/bookings/${bookingId}/complete-service`, {
    method: "POST",
  });
}

export function validateWasherService(bookingId) {
  return apiRequest(`/washer/bookings/${bookingId}/validate-service`, {
    method: "POST",
  });
}
