import { apiRequest } from "../api/apiClient";

export async function getCustomerOffers() {
  const result = await apiRequest("/account/offers");
  return result.offers || [];
}

export async function validateCustomerOffer(payload) {
  const result = await apiRequest("/account/offers/validate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return result.offer;
}
