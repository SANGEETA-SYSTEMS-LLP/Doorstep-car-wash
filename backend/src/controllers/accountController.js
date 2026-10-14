import { supabaseAdmin as db } from "../config/supabase.js";
export async function getAccount(req, res, next) {
  try {
    const { data, error } = await db.from("profiles").select("id, full_name, phone, role, avatar_url, is_active").eq("id", req.user.id).single();
    if (error) throw error;
    res.json({ success: true, profile: { ...data, email: req.user.email } });
  } catch (err) { next(err); }
}
export async function updateAccount(req, res, next) {
  try {
    const body = req.body;
    if (!body || Object.keys(body).some(key => !["full_name", "phone"].includes(key)) || typeof body.full_name !== "string" || !body.full_name.trim() || body.full_name.length > 150 || typeof body.phone !== "string" || !/^[+()0-9 -]{7,25}$/.test(body.phone)) throw Object.assign(new Error("Enter a valid name and phone number."), { status: 400 });
    const { data, error } = await db.from("profiles").update({ full_name: body.full_name.trim(), phone: body.phone.trim(), updated_at: new Date().toISOString() }).eq("id", req.user.id).select("id, full_name, phone, role").single();
    if (error) throw error;
    res.json({ success: true, profile: data });
  } catch (err) { next(err); }
}
export async function myEarnings(req, res, next) {
  try {
    const { data: washer, error: washerError } = await db.from("washers").select("id").eq("user_id", req.user.id).maybeSingle();
    if (washerError) throw washerError;
    if (!washer) throw Object.assign(new Error("Washer account not found."), { status: 404 });
    const page = Number(req.query.page || 1);
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000) throw Object.assign(new Error("Invalid page."), { status: 400 });
    const { data, count, error } = await db.from("washer_earnings").select("id, booking_id, gross_amount, platform_commission, washer_amount, status, settled_at, created_at", { count: "exact" }).eq("washer_id", washer.id).order("created_at", { ascending: false }).range((page - 1) * 25, page * 25 - 1);
    if (error) throw error;
    res.json({ success: true, rows: data || [], count: count || 0, page, pageSize: 25 });
  } catch (err) { next(err); }
}
