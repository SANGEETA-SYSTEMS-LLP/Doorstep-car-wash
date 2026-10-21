import { supabaseAdmin as db } from "../../config/supabase.js";
async function rows(table, fields, configure = q => q) {
  const result = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await configure(db.from(table).select(fields)).order("id").range(offset, offset + 999);
    if (error) throw error;
    result.push(...data);
    if (data.length < 1000) return result;
  }
}
export async function getOperations(req, res, next) {
  try {
    const [washers, locations, jobs] = await Promise.all([
      rows("washers", "id,status,is_active,rating", q => q.eq("is_active", true)),
      rows("washer_locations", "id,washer_id,latitude,longitude,updated_at"),
      rows("bookings", "id,booking_number,status,assigned_washer_id,latitude,longitude,service_address,scheduled_date,scheduled_start_time", q => q.not("status", "in", "(closed,cancelled,payment_completed)")),
    ]);
    const latest = new Map();
    for (const point of locations) if (!latest.has(point.washer_id) || Date.parse(point.updated_at) > Date.parse(latest.get(point.washer_id).updated_at)) latest.set(point.washer_id, point);
    const now = Date.now();
    res.json({ success: true, refreshedAt: new Date(now).toISOString(), washers: washers.map(w => {
      const location = latest.get(w.id) || null;
      return { ...w, location, stale: !location || !Number.isFinite(Date.parse(location.updated_at)) || now - Date.parse(location.updated_at) > 5 * 60_000 };
    }), jobs: jobs.filter(job => job.status !== "completed").map(job => ({ ...job, delayed: ["pending", "finding_washer", "washer_assigned"].includes(job.status) && Date.parse(job.scheduled_date + "T" + (job.scheduled_start_time || "00:00:00") + "+05:30") < now - 15 * 60_000 })) });
  } catch (error) { next(error); }
}
