import { supabaseAdmin as db } from "../../config/supabase.js";
import { calculateOfferDiscount, customerOffers } from "../../services/customer/customerOfferService.js";

const bad = (message, status = 400) => Object.assign(new Error(message), { status });
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getCustomer(userId) {
  const { data, error } = await db.from("customers").select("id").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (!data) throw bad("Your customer profile is unavailable.", 403);
  return data;
}

export function listCustomerOffers(req, res) {
  return res.json({ offers: customerOffers });
}

export async function validateCustomerOffer(req, res, next) {
  try {
    const { code, vehicleId, packageId, scheduledDate } = req.body || {};
    if (typeof code !== "string" || !code.trim() || !uuid.test(vehicleId || "") || !uuid.test(packageId || "")) {
      throw bad("Enter an offer code and choose a vehicle and package first.");
    }
    const customer = await getCustomer(req.user.id);
    const [vehicleResult, packageResult] = await Promise.all([
      db.from("vehicles").select("id,vehicle_type").eq("id", vehicleId).eq("customer_id", customer.id).eq("is_active", true).maybeSingle(),
      db.from("service_packages").select("id,name,price,vehicle_type,is_active").eq("id", packageId).eq("is_active", true).maybeSingle(),
    ]);
    if (vehicleResult.error) throw vehicleResult.error;
    if (packageResult.error) throw packageResult.error;
    if (!vehicleResult.data) throw bad("This vehicle is no longer available. Please choose it again.", 404);
    const packageType = String(packageResult.data?.vehicle_type || "").trim().toLowerCase();
    if (!packageResult.data || (packageType !== String(vehicleResult.data.vehicle_type || "").trim().toLowerCase() && !["all", "all vehicles", "all car types", "one time"].includes(packageType))) throw bad("This package is not available for the selected vehicle.");
    let firstBooking = false;
    if (code.trim().toUpperCase() === "FIRSTWASH") {
      const { count, error } = await db.from("bookings").select("id", { count: "exact", head: true }).eq("customer_id", customer.id);
      if (error) throw error;
      firstBooking = (count || 0) === 0;
    }
    const applied = calculateOfferDiscount({
      code,
      servicePrice: Number(packageResult.data.price),
      packageName: packageResult.data.name,
      scheduledDate,
      firstBooking,
    });
    const offer = customerOffers.find(item => item.code === applied.code);
    return res.json({ offer: { ...offer, discount_amount: applied.discountAmount } });
  } catch (error) { next(error); }
}
