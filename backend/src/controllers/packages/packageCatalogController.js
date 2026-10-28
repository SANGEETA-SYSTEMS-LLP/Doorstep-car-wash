import { supabaseAdmin as db } from "../../config/supabase.js";
import { fields, failure, normalizeVehicleType, vehicleTypeCandidates, monthlyTiers } from "./packageCatalog.js";
import { createHash } from "node:crypto";

export async function listPackages(req, res, next) {
  try {
    const type = req.query.vehicleType;
    if (type !== undefined && (typeof type !== "string" || !type.trim() || type.length > 50)) throw failure("Select a valid vehicle type.");
    let query = db.from("service_packages").select(fields).eq("is_active", true);
    if (type !== undefined) query = query.in("vehicle_type", [...vehicleTypeCandidates(type), "all", "all vehicles", "all car types", "one time"]);
    const { data, error } = await query.order("price", { ascending: true });
    if (error) throw error;
    res.json({ packages: data || [] });
  } catch (error) { next(error); }
}
export async function validatePackage(req, res, next) {
  try {
    const { packageId, vehicleId } = req.body || {};
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validVirtualMonthlyId = typeof packageId === "string" && /^monthly-[a-f0-9]{32}$/.test(packageId);
    if (!(typeof packageId === "string" && (uuid.test(packageId) || validVirtualMonthlyId)) || typeof vehicleId !== "string" || !uuid.test(vehicleId)) {
      throw failure("Choose a vehicle and package first.");
    }
    const { data: customer, error: customerError } = await db.from("customers").select("id").eq("user_id", req.user.id).maybeSingle();
    if (customerError) throw customerError;
    if (!customer) throw failure("Your customer profile is unavailable.", 403);
    const vehicle = await db.from("vehicles").select("id,vehicle_type").eq("id", vehicleId).eq("customer_id", customer.id).eq("is_active", true).maybeSingle();
    if (vehicle.error) throw vehicle.error;
    if (!vehicle.data) throw failure("This vehicle is no longer available. Please select it again.", 404);
    const generatedMonthly = validVirtualMonthlyId
      ? await findGeneratedMonthlyPlan(packageId, vehicle.data.vehicle_type)
      : null;
    if (generatedMonthly) {
      return res.json({ package: generatedMonthly });
    }
    if (String(packageId).startsWith("monthly-")) throw failure("This monthly plan is no longer available. Reload the package list and try again.", 404);
    const pack = await db.from("service_packages").select(fields).eq("id", packageId).eq("is_active", true).maybeSingle();
    if (pack.error) throw pack.error;
    if (!pack.data) throw failure("This package is no longer available. Please select it again.", 404);
    const packageType = normalizeVehicleType(pack.data.vehicle_type);
    if (!vehicleTypeCandidates(vehicle.data.vehicle_type).some(candidate => normalizeVehicleType(candidate) === packageType) && !["all", "all vehicles", "all car types", "one time"].includes(packageType)) throw failure("Your vehicle details changed. Please choose a matching package again.");
    if (!Number.isFinite(Number(pack.data.price)) || Number(pack.data.price) <= 0) throw failure("This package has no valid price. Please choose another package.");
    const packageName = String(pack.data.name || "").toLowerCase();
    const monthlyTier = monthlyTiers.find(tier => packageName.startsWith(tier.name.toLowerCase()));
    res.json({ package: { ...pack.data, ...(monthlyTier ? { plan_washes: monthlyTier.washes } : {}) } });
  } catch (error) { next(error); }
}

async function findGeneratedMonthlyPlan(packageId, vehicleType) {
  const normalizedType = normalizeVehicleType(vehicleType);
  const category = normalizedType.includes("luxury") || normalizedType.includes("large") ? "luxury"
    : normalizedType.includes("hatch") || normalizedType === "compact" ? "hatchback"
    : normalizedType.includes("sedan") ? "sedan"
    : ["suv", "muv", "mpv", "crossover"].some(value => normalizedType.includes(value)) ? "suv"
    : normalizedType;
  const prices = {
    hatchback: [399, 699, 999], sedan: [449, 799, 1099],
    suv: [499, 899, 1299], muv: [499, 899, 1299],
    luxury: [599, 1099, 1499], "large suv": [599, 1099, 1499],
  }[category];
  if (!prices) return null;
  const candidates = vehicleTypeCandidates(category);
  const { data: services, error: serviceError } = await db.from("services")
    .select("id,name").eq("is_active", true).ilike("name", "%wash%").order("name");
  if (serviceError) throw serviceError;
  const serviceId = (services || []).find(service => normalizeVehicleType(service.name) === "exterior wash")?.id || services?.[0]?.id;
  if (!serviceId) return null;
  const { data: catalog, error } = await db.from("service_packages").select(fields)
    .eq("service_id", serviceId).eq("is_active", true).order("price", { ascending: true });
  if (error) throw error;
  const template = (catalog || []).find(pack => monthlyTiers.some(tier => normalizeVehicleType(pack.name || "").startsWith(normalizeVehicleType(tier.name)))) || (catalog || [])[0];
  if (!template) return null;
  const index = monthlyTiers.findIndex(tier => packageId === `monthly-${createHash("sha256").update(`${serviceId}:${category}:${tier.washes}`).digest("hex").slice(0, 32)}`);
  if (index < 0) return null;
  const tier = monthlyTiers[index];
  return {
    id: packageId,
    name: `${tier.name} - ${category[0].toUpperCase()}${category.slice(1)}`,
    description: `${tier.washes} exterior washes per month for one registered vehicle. GST extra.`,
    vehicle_type: candidates[0],
    price: prices[index],
    duration_minutes: template.duration_minutes,
    service_id: serviceId,
    is_active: true,
    plan_washes: tier.washes,
  };
}

export function isRetiredPackage(pack) {
  const name = String(pack?.name || "").normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " ");
  const price = Number(pack?.price);
  return price === 399 && ["interior cleaning", "complete detailing", "basic car wash"].includes(name);
}
