import { apiRequest } from "../core/api";
export async function getMyVehicles(userId) {
  if (!userId) {
    return [];
  }

  const result = await apiRequest("/account/customer/vehicles");
  return result.rows || [];
}

export function getVehicleLoadErrorMessage(error) {
  if (error?.status === 401) {
    return "Your session has expired. Sign in again to load your vehicles.";
  }
  if (error?.status === 403) {
    return "Your customer profile is not available yet. Please contact support.";
  }
  if (error instanceof TypeError) {
    return "The vehicle service could not be reached. Start the backend, then try again.";
  }
  return error?.message || "Unable to load vehicles. Please try again.";
}

export async function createVehicle({ userId, vehicleNumber, vehicleType, brand, model, colour, seatingCapacity }) {
  if (!userId) throw new Error("You must be logged in.");
  return apiRequest("/account/vehicles", {
    method: "POST",
    body: JSON.stringify({
      vehicle_number: vehicleNumber.trim().toUpperCase(), vehicle_type: vehicleType.trim(),
      brand: brand.trim(), model: model.trim(), colour: colour?.trim() || null,
      seating_capacity: Number(seatingCapacity),
    }),
  });
}

export async function deleteVehicle(vehicleId, userId) {
  if (!userId) throw new Error("You must be logged in to manage vehicles.");
  return apiRequest(`/account/vehicles/${encodeURIComponent(vehicleId)}`, { method: "DELETE" });
}
