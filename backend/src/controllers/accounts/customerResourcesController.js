import { supabaseAdmin as db } from "../../config/supabase.js";

export async function getCustomerResources(req, res, next) {
  try {
    const resource = req.params.resource;
    if (!["addresses", "vehicles"].includes(resource)) return res.status(404).json({message: "Resource not found."});
    const { data: customer, error: customerError } = await db.from("customers").select("id").eq("user_id", req.user.id).maybeSingle();
    if (customerError) throw customerError;
    if (!customer) return res.json({rows: []});
    const table = resource === "addresses" ? "customer_addresses" : "vehicles";
    const fields = resource === "addresses" ? "id,address_line,label,latitude,longitude,city,state,postal_code,tower,flat_number,landmark" : "id,vehicle_number,vehicle_type,brand,model,colour,seating_capacity,is_default,is_active";
    // Read available columns, then explicitly allowlist the response fields.
    let query = db.from(table).select("*").eq("customer_id", customer.id);
    if (resource === "vehicles") query = query.eq("is_active", true);
    const { data, error } = await query.order("created_at", {ascending: false}).limit(50);
    if (error) throw error;
    res.json({rows: (data || []).map(row => Object.fromEntries(fields.split(",").map(field => [field, row[field] ?? null])))});
  } catch (error) { next(error); }
}
