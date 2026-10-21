import { supabaseAdmin as db } from "../config/supabase.js";

const fail = (message, status = 400) => Object.assign(new Error(message), { status });
const uuid = value => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
function payload(body) {
  const limits = { address_line: 500, label: 100, city: 100, state: 100, postal_code: 6, tower: 200, flat_number: 200, landmark: 200 };
  const allowed = [...Object.keys(limits), "latitude", "longitude", "society_id", "address_id"];
  if (!body || Array.isArray(body) || Object.keys(body).some(key => !allowed.includes(key))) throw fail("Invalid address details.");
  const result = {};
  for (const [key, limit] of Object.entries(limits)) {
    if (body[key] != null && (typeof body[key] !== "string" || body[key].trim().length > limit)) throw fail("Invalid address details.");
    result[key] = body[key]?.trim() || null;
  }
  if (!result.address_line || result.address_line.length < 10) throw fail("Enter a complete street address (10–500 characters).");
  if (result.postal_code && !/^\d{6}$/.test(result.postal_code)) throw fail("Enter a six-digit PIN code.");
  for (const [key, max] of [["latitude", 90], ["longitude", 180]]) {
    if (typeof body[key] !== "number" || !Number.isFinite(body[key]) || Math.abs(body[key]) > max) throw fail("Select a valid map location.");
    result[key] = body[key];
  }
  if (body.society_id != null && !uuid(body.society_id)) throw fail("Invalid society.");
  if (body.address_id != null && !uuid(body.address_id)) throw fail("Invalid address.");
  return { ...result, label: result.label || "Service location", society_id: body.society_id || null };
}
async function owner(req) {
  const { data, error } = await db.from("customers").select("id").eq("user_id", req.user.id).maybeSingle();
  if (error) throw error;
  if (!data) throw fail("Your customer profile is not ready. Please contact support.", 403);
  return data.id;
}
export async function saveAddress(req, res, next) {
  try {
    const values = payload(req.body);
    const customerId = await owner(req);
    if (req.body.address_id) {
      const { data, error } = await db.from("customer_addresses").select("*").eq("id", req.body.address_id).eq("customer_id", customerId).maybeSingle();
      if (error) throw error;
      if (!data) throw fail("Address not found.", 404);
      const unchanged = Object.entries(values).every(([key, value]) => key === "label" ||
        (["latitude", "longitude"].includes(key) ? data[key] != null && Number(data[key]) === value : (data[key] || null) === value));
      if (unchanged) return res.json({ id: data.id });
    }
    // A changed booking address is a new record, preserving earlier booking locations.
    const { data, error } = await db.from("customer_addresses").insert({ ...values, customer_id: customerId }).select("id").single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) { next(error); }
}
export async function updateAddress(req, res, next) {
  try {
    if (!uuid(req.params.id)) throw fail("Invalid address.");
    const values = payload(req.body);
    const customerId = await owner(req);
    const { data, error } = await db.from("customer_addresses").update(values).eq("id", req.params.id).eq("customer_id", customerId).select("id").maybeSingle();
    if (error) throw error;
    if (!data) throw fail("Address not found.", 404);
    res.json(data);
  } catch (error) { next(error); }
}
export async function deleteAddress(req, res, next) {
  try {
    if (!uuid(req.params.id)) throw fail("Invalid address.");
    const customerId = await owner(req);
    const { data, error } = await db.from("customer_addresses").delete().eq("id", req.params.id).eq("customer_id", customerId).select("id").maybeSingle();
    if (error?.code === "23503") throw fail("This address is linked to a booking and cannot be deleted. Add a new address for future bookings.", 409);
    if (error) throw error;
    if (!data) throw fail("Address not found.", 404);
    res.json(data);
  } catch (error) { next(error); }
}
