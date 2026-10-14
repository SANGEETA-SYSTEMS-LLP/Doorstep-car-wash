import { apiRequest } from "./api";

export function createReview(
  bookingId,
  { rating, comment }
) {
  return apiRequest(
    `/reviews/bookings/${bookingId}`,
    {
      method: "POST",
      body: JSON.stringify({
        rating,
        comment,
      }),
    }
  );
}

export function skipReview(
  bookingId
) {
  return apiRequest(
    `/reviews/bookings/${bookingId}/skip`,
    {
      method: "POST",
    }
  );
}
