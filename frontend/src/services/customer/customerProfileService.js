import { apiRequest } from "../../api/apiClient";

export function updateCustomerProfile(profile) {
  return apiRequest("/api/customer/profile", {
    method: "PATCH",
    body: JSON.stringify(profile),
  });
}
