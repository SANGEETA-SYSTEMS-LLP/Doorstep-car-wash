import { supabaseAdmin as db } from "../../config/supabase.js";

const failure = (message, status = 400) => Object.assign(new Error(message), { status });
async function customerId(req) {
  const { data, error } = await db.from("customers").select("id").eq("user_id", req.user.id).maybeSingle();
  if (error) throw error;
  if (!data) throw failure("Your customer profile is not ready. Please contact support.", 403);
  return data.id;
}
export async function createCustomerVehicle(req, res, next) {
  try {
    const input = req.body;
    const aliases = {
      vehicle_number: ["vehicle_number", "vehicleNumber"],
      vehicle_type: ["vehicle_type", "vehicleType"],
      brand: ["brand"],
      model: ["model"],
      colour: ["colour", "color"],
      seating_capacity: ["seating_capacity", "seatingCapacity"],
    };
    const ignoredLegacyFields = new Set(["customer_id", "user_id", "userId"]);
    const allowedFields = new Set([...Object.values(aliases).flat(), ...ignoredLegacyFields, "customVehicleType"]);
    if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).some(key => !allowedFields.has(key))) throw failure("Invalid vehicle details. Please use the vehicle form and try again.");
    const body = {};
    for (const [field, names] of Object.entries(aliases)) {
      const supplied = names.find(name => input[name] !== undefined);
      body[field] = supplied ? input[supplied] : undefined;
    }
    if ((!body.vehicle_type || body.vehicle_type === "other") && typeof input.customVehicleType === "string") body.vehicle_type = input.customVehicleType;
    if (!Number.isInteger(body.seating_capacity) || body.seating_capacity < 2 || body.seating_capacity > 20) throw failure("Enter a valid seating capacity from 2 to 20.");
    const limits = { vehicle_number: 30, vehicle_type: 50, brand: 100, model: 100, colour: 50 };
    const values = {};
    for (const [key, limit] of Object.entries(limits)) {
      const value = body[key];
      if (key === "colour" && value == null) { values[key] = null; continue; }
      if (typeof value !== "string" || value.trim().length > limit || (key !== "colour" && !value.trim())) throw failure("Enter valid vehicle details, including registration, type, brand and model.");
      values[key] = value.trim() || null;
    }
    values.vehicle_number = values.vehicle_number.toUpperCase();
    values.seating_capacity = body.seating_capacity;
    values.customer_id = await customerId(req);
    const { data, error } = await db.from("vehicles").insert(values).select("id,vehicle_number,vehicle_type,brand,model,colour,seating_capacity,is_default,is_active").single();
    if (error?.code === "23505") throw failure("This vehicle registration is already saved in your account.", 409);
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) { next(error); }
}
export async function deleteCustomerVehicle(req, res, next) {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) throw failure("Invalid vehicle.");
    const owner = await customerId(req);
    const { data, error } = await db.from("vehicles").delete().eq("id", req.params.id).eq("customer_id", owner).select("id").maybeSingle();
    if (error?.code === "23503") throw failure("This vehicle is linked to a booking and cannot be deleted.", 409);
    if (error) throw error;
    if (!data) throw failure("Vehicle not found.", 404);
    res.json(data);
  } catch (error) { next(error); }
}
