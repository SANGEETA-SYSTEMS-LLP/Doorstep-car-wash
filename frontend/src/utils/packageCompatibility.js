export function isPackageForVehicle(pkg, vehicle) {
 const packageType = pkg?.vehicle_type ?? pkg?.vehicleType;
 const vehicleType = vehicle?.vehicle_type ?? vehicle?.type;
 if (!pkg || !vehicle || typeof packageType !== "string" || !packageType.trim() || typeof vehicleType !== "string" || pkg.is_active === false) return false;
 const normalize = value => value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
 const category = value => {
  const normalized = normalize(value);
  if (normalized.includes("luxury") || normalized.includes("large")) return "luxury";
  if (normalized.includes("hatch") || normalized === "compact") return "hatchback";
  if (normalized.includes("sedan")) return "sedan";
  if (["suv", "muv", "mpv", "crossover"].some(type => normalized.includes(type))) return "suv";
  return normalized;
 };
 return category(packageType) === category(vehicleType) || ["all", "all vehicles", "all car types", "one time"].includes(normalize(packageType));
}
