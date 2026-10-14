import {
  apiRequest,
} from "./api";

export function getServiceOtp(
  bookingId
) {
  return apiRequest(
    `/customer/bookings/${bookingId}/service-otp`
  );
}

export function getCustomerServicePhotos(bookingId) {
  return apiRequest(
    `/customer/bookings/${bookingId}/service-photos`
  );
}
