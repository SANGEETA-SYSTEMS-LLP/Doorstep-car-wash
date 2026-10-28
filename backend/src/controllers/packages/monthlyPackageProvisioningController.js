import { supabaseAdmin as db } from "../../config/supabase.js";
import { createHash } from "node:crypto";
import { fields, failure, normalizeVehicleType, vehicleTypeCandidates, monthlyTiers, monthlyPrices } from "./packageCatalog.js";

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
    const { data: washServices, error: serviceError } = await db.from("services")
      .select("id,name,is_active").eq("is_active", true).ilike("name", "%wash%").order("name");
    if (serviceError) throw serviceError;
    const serviceId = (washServices || []).find(service => normalizeVehicleType(service.name) === "exterior wash")?.id
      || washServices?.[0]?.id;
    if (!serviceId) throw failure("Monthly wash service is not configured. Please contact support.", 503);

    const { data: catalog, error } = await db.from("service_packages").select(fields)
      .eq("service_id", serviceId).eq("is_active", true).order("price", { ascending: true });
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
    if (packages.length) return res.json({ packages, vehicleType: vehicle.vehicle_type });

    // Provision this vehicle category from the configured monthly price table
    // when the database has no monthly plans for it yet.
    const prices = monthlyPrices[category];
    if (!prices) return res.json({ packages: [], vehicleType: vehicle.vehicle_type });
    const template = (catalog || []).find(pack => monthlyTiers.some(tier =>
      normalizeVehicleType(pack.name || "").startsWith(normalizeVehicleType(tier.name))
    )) || (catalog || [])[0];
    if (!template) throw failure("No active wash package is configured. Please contact support.", 503);
    const generated = monthlyTiers.map((tier, index) => ({
      id: `monthly-${createHash("sha256").update(`${serviceId}:${category}:${tier.washes}`).digest("hex").slice(0, 32)}`,
      name: `${tier.name} - ${category[0].toUpperCase()}${category.slice(1)}`,
      description: `${tier.washes} exterior washes per month for one registered vehicle. GST extra.`,
      vehicle_type: category,
      price: prices[index],
      duration_minutes: template.duration_minutes,
      service_id: serviceId,
      is_active: true,
      plan_washes: tier.washes,
      virtual_monthly_plan: true,
    }));
    return res.json({ packages: generated, vehicleType: vehicle.vehicle_type });
  } catch (error) { next(error); }
}

