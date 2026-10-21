import { apiRequest } from "./api";

export async function validateBookingPackage(packageId, vehicleId) {
  if (!packageId || !vehicleId) throw new Error("Choose a vehicle and package first.");
  const result = await apiRequest("/account/packages/validate", {
    method: "POST", body: JSON.stringify({ packageId, vehicleId }),
  });
  return result.package;
}
