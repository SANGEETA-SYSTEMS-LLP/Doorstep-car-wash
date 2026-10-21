import { supabaseAdmin as db } from "../../config/supabase.js";
import { fields, failure, normalizeVehicleType, oneTimeTiers, monthlyPrices, monthlyTiers } from "./packageCatalog.js";

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
    const prices = monthlyPrices[category];
    if (!prices) throw failure("Monthly prices are not configured for this vehicle category.", 400);

    const [{ data: services, error: serviceError }, { data: defaults, error: defaultError }] = await Promise.all([
      db.from("services").select("id,name").eq("is_active", true).ilike("name", "%wash%").order("name"),
      db.from("service_packages").select("duration_minutes,washer_commission_percent").eq("is_active", true).order("id").limit(1).maybeSingle(),
    ]);
    if (serviceError) throw serviceError;
    if (defaultError) throw defaultError;
    if (!services?.length) throw failure("No active wash service is configured. Ask an administrator to add one.", 503);
    if (!defaults) throw failure("No active package exists to set washer commission and duration. Ask an administrator to add a package first.", 503);
    const service = services.find(item => item.name.trim().toLowerCase() === "exterior wash") || services[0];
    const names = monthlyTiers.map(tier => `${tier.name} - ${vehicle.vehicle_type}`);
    const { data: existing, error: existingError } = await db.from("service_packages").select("id,name").in("name", names);
    if (existingError) throw existingError;
    const existingByName = new Map((existing || []).map(item => [item.name.toLowerCase(), item]));
    const packages = [];
    for (let index = 0; index < monthlyTiers.length; index += 1) {
      const tier = monthlyTiers[index];
      const name = names[index];
      const payload = {
        service_id: service.id,
        name,
        description: `${tier.washes} exterior washes per billing month for one registered ${vehicle.vehicle_type} vehicle. One wash is one exterior cleaning. Interior cleaning, vacuuming, polishing, and detailing are excluded. GST extra.`,
        vehicle_type: vehicle.vehicle_type,
        price: prices[index],
        duration_minutes: defaults.duration_minutes,
        washer_commission_percent: defaults.washer_commission_percent,
        is_active: true,
      };
      const prior = existingByName.get(name.toLowerCase());
      const query = prior ? db.from("service_packages").update(payload).eq("id", prior.id) : db.from("service_packages").insert(payload);
      const { data, error } = await query.select(fields).single();
      if (error) throw error;
      packages.push({ ...data, plan_washes: tier.washes });
    }
    res.json({ packages, vehicleType: vehicle.vehicle_type });
  } catch (error) { next(error); }
}

