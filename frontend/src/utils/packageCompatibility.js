export function isPackageForVehicle(pkg, vehicle) {
 const packageType = pkg?.vehicle_type ?? pkg?.vehicleType;
 const vehicleType = vehicle?.vehicle_type ?? vehicle?.type;
 return Boolean(pkg && vehicle && typeof packageType === "string" && packageType.length > 0 && packageType === vehicleType && pkg.is_active !== false);
}
