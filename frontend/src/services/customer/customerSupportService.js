import { apiRequest } from "../../api/apiClient";

export function createSupportTicket({
  bookingId,
  issueType,
  subject,
  description,
}) {
  return apiRequest("/support/my", {
    method: "POST",
    body: JSON.stringify({
      bookingId: bookingId?.trim() || null,
      issueType,
      subject,
      description,
    }),
  });
}
