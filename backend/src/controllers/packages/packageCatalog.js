export const fields = "id,name,description,vehicle_type,price,duration_minutes,service_id,is_active";
export const failure = (message, status = 400) => Object.assign(new Error(message), { status });
export const normalizeVehicleType = value => value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
export function vehicleTypeCandidates(value) {
  const type = normalizeVehicleType(value);
  if (type.includes("luxury") || type.includes("large")) return ["luxury", "large suv", "luxury / large suv"];
  if (type.includes("hatch") || type === "compact") return ["hatchback", "hatch", "compact"];
  if (type.includes("sedan")) return ["sedan"];
  if (["suv", "muv", "mpv", "crossover"].some(token => type.includes(token))) return ["suv", "muv", "suv / muv", "mpv", "crossover"];
  return [value.trim()];
}
export const oneTimeTiers = [
  { name: "Essential Exterior Wash", price: 100, description: "One exterior wash for one registered vehicle. GST extra. Interior cleaning, vacuuming, polishing, and detailing are not included." },
  { name: "Plus Exterior Wash", price: 130, description: "One enhanced exterior wash for one registered vehicle. GST extra. Interior cleaning, vacuuming, polishing, and detailing are not included." },
  { name: "Premium Exterior Wash", price: 150, description: "One premium exterior wash for one registered vehicle. GST extra. Interior cleaning, vacuuming, polishing, and detailing are not included." },
];
export const monthlyPrices = {
  hatchback: [399, 699, 999],
  sedan: [449, 799, 1099],
  suv: [499, 899, 1299],
  muv: [499, 899, 1299],
  luxury: [599, 1099, 1499],
  "large suv": [599, 1099, 1499],
};
export const monthlyTiers = [
  { name: "Basic Monthly Plan", washes: 4 },
  { name: "Standard Monthly Plan", washes: 8 },
  { name: "Premium Monthly Plan", washes: 12 },
];

