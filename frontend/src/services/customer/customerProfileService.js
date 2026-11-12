import { apiRequest } from "../../api/apiClient";

export function updateCustomerProfile(profile) {
  return apiRequest("/customer/profile", {
    method: "PATCH",
    body: JSON.stringify(profile),
  });
}
