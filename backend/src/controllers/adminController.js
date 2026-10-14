import { supabaseAdmin as db } from "../config/supabase.js";
import { resources, validateResourceInput } from "../config/adminResources.js";
function specFor(req) {
  const spec = Object.hasOwn(resources, req.params.resource) ? resources[req.params.resource] : null;
  if (!spec) throw Object.assign(new Error("Resource not found."), { status: 404 });
  return spec;
}
export async function listResource(req, res, next) {
  try {
    const spec = specFor(req);
    const page = Number(req.query.page || 1);
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000) throw Object.assign(new Error("Invalid page."), { status: 400 });
    let query = db.from(spec.table).select(spec.columns.join(","), { count: "exact" }).order("id").range((page - 1) * 25, page * 25 - 1);
    if (spec.filter) query = query.eq(...spec.filter);
    const { data, count, error } = await query;
    if (error) throw error;
    res.json({ success: true, title: spec.title, columns: spec.columns, fields: spec.fields || null, rows: data || [], count: count || 0, page, pageSize: 25 });
  } catch (err) { next(err); }
}
export async function saveResource(req, res, next) {
  try {
    const spec = specFor(req);
    const payload = validateResourceInput(spec, req.body, Boolean(req.params.id));
    if (req.params.id && !/^[a-f0-9-]{36}$/i.test(req.params.id)) throw Object.assign(new Error("Invalid record ID."), { status: 400 });
    for (const [key, field] of Object.entries(spec.fields)) {
      if (field.type !== "relation" || !payload[key]) continue;
      const { data, error } = await db.from(resources[field.resource].table).select("id").eq("id", payload[key]).maybeSingle();
      if (error) throw error;
      if (!data) throw Object.assign(new Error(field.label + " was not found."), { status: 400 });
    }
    const query = req.params.id ? db.from(spec.table).update(payload).eq("id", req.params.id) : db.from(spec.table).insert(payload);
    const { data, error } = await query.select(spec.columns.join(",")).maybeSingle();
    if (error) throw error;
    if (!data) throw Object.assign(new Error("Record not found."), { status: 404 });
    res.status(req.params.id ? 200 : 201).json({ success: true, record: data });
  } catch (err) { next(err); }
}
export async function getAdminDashboard(req, res, next) {
  try {
    const keys = ["customers", "washers", "bookings", "societies", "zones", "services"];
    const stats = await Promise.all(keys.map(async key => {
      const { count, error } = await db.from(resources[key].table).select("id", { count: "exact", head: true });
      if (error) throw error;
      return { key, label: resources[key].title, count: count || 0 };
    }));
    res.json({ success: true, stats });
  } catch (err) { next(err); }
}
