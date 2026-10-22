import {
  apiRequest,
} from "../core/api";

export function getCustomerServicePhotos(bookingId) {
  return apiRequest(
    `/customer/bookings/${bookingId}/service-photos`
  );
}
