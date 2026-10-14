import {
  apiRequest,
} from "./api";

export function uploadServicePhotos({
  bookingId,
  type,
  files,
}) {
  const formData =
    new FormData();

  formData.append(
    "type",
    type
  );

  for (
    const file of files
  ) {
    formData.append(
      "photos",
      file
    );
  }

  return apiRequest(
    `/washer/bookings/${bookingId}/photos`,
    {
      method: "POST",
      body: formData,
    }
  );
}