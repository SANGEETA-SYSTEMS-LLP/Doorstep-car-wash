import { supabase } from "./supabase";
import { isPackageForVehicle } from "../utils/packageCompatibility";
export async function validateBookingPackage(packageId, vehicleId) {
  if (!packageId || !vehicleId) throw new Error("Choose a vehicle and package first.");
  const [vehicleResult, packageResult] = await Promise.all([
    supabase.from("vehicles").select("id,vehicle_type").eq("id", vehicleId).eq("is_active", true).single(),
    supabase.from("service_packages").select("id,name,description,price,duration_minutes,vehicle_type,is_active").eq("id", packageId).eq("is_active", true).single(),
  ]);
  if (vehicleResult.error || packageResult.error) throw new Error("This vehicle or package is no longer available. Please select it again.");
  if (!isPackageForVehicle(packageResult.data, vehicleResult.data)) throw new Error("Your vehicle details changed. Please choose a matching package again.");
  const price = Number(packageResult.data.price);
  if (!Number.isFinite(price) || price <= 0) throw new Error("This package has no valid price. Please choose another package.");
  return packageResult.data;
}
