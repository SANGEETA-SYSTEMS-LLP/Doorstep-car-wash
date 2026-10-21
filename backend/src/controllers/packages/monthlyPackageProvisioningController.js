import { supabaseAdmin as db } from "../../config/supabase.js";
import { fields, failure, normalizeVehicleType, vehicleTypeCandidates, monthlyTiers } from "./packageCatalog.js";

export async function ensureMonthlyWashPackages(req, res, next) {
  try {
    const vehicleId = req.body?.vehicleId;
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuid.test(vehicleId || "")) throw failure("Select a vehicle before loading monthly plans.");
    const { data: customer, error: customerError } = await db.from("customers").select("id").eq("user_id", req.user.id).maybeSingle();
    if (customerError) throw customerError;
    if (!customer) throw failure("Your customer profile is unavailable.", 403);
    const { data: vehicle, error: vehicleError } = await db.from("vehicles").select("id,vehicle_type").eq("id", vehicleId).eq("customer_id", customer.id).eq("is_active", true).maybeSingle();
    if (vehicleError) throw vehicleError;
    if (!vehicle) throw failure("This vehicle is no longer available. Please select it again.", 404);

    const normalizedType = normalizeVehicleType(vehicle.vehicle_type);
    const category = normalizedType.includes("luxury") || normalizedType.includes("large") ? "luxury"
      : normalizedType.includes("hatch") || normalizedType === "compact" ? "hatchback"
      : normalizedType.includes("sedan") ? "sedan"
      : ["suv", "muv", "mpv", "crossover"].some(value => normalizedType.includes(value)) ? "suv"
      : normalizedType;
    const candidates = vehicleTypeCandidates(category);
    const { data: catalog, error } = await db.from("service_packages").select(fields).eq("is_active", true).order("price", { ascending: true });
    if (error) throw error;
    const packages = (catalog || []).filter(pack => {
      const name = normalizeVehicleType(pack.name || "");
      const packCategory = normalizeVehicleType(pack.vehicle_type || "");
      const monthlyTier = monthlyTiers.find(tier => name.startsWith(normalizeVehicleType(tier.name)));
      return monthlyTier && candidates.some(candidate => normalizeVehicleType(candidate) === packCategory);
    }).map(pack => {
      const tier = monthlyTiers.find(item => normalizeVehicleType(pack.name).startsWith(normalizeVehicleType(item.name)));
      return { ...pack, plan_washes: tier.washes };
    });
    res.json({ packages, vehicleType: vehicle.vehicle_type });
  } catch (error) { next(error); }
}

