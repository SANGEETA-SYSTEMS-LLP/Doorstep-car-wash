import { supabaseAdmin as db } from "../../config/supabase.js";
import { fields, failure, normalizeVehicleType, vehicleTypeCandidates, monthlyTiers } from "./packageCatalog.js";

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
    if (![packageId, vehicleId].every(id => typeof id === "string" && uuid.test(id))) throw failure("Choose a vehicle and package first.");
    const { data: customer, error: customerError } = await db.from("customers").select("id").eq("user_id", req.user.id).maybeSingle();
    if (customerError) throw customerError;
    if (!customer) throw failure("Your customer profile is unavailable.", 403);
    const vehicle = await db.from("vehicles").select("id,vehicle_type").eq("id", vehicleId).eq("customer_id", customer.id).eq("is_active", true).maybeSingle();
    if (vehicle.error) throw vehicle.error;
    if (!vehicle.data) throw failure("This vehicle is no longer available. Please select it again.", 404);
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
