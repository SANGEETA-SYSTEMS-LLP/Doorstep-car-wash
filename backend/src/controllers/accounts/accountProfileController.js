import { supabaseAdmin as db } from "../../config/supabase.js";

export async function getAccount(req, res, next) {
  try {
    // The account page only needs these fields. Keep this query aligned with
    // the core profiles schema so a missing optional avatar column cannot make
    // every authenticated user fail to load their dashboard.
    const { data, error } = await db.from("profiles")
      .select("id, full_name, phone, role, is_active")
      .eq("id", req.user.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: "Account profile not found." });
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
