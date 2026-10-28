import { supabaseAdmin as db } from "../../config/supabase.js";
import { boundQueryToSupervisorArea, isWithinSupervisorArea } from "../../services/supervisor/supervisorServiceArea.js";
async function rows(table, fields, configure = q => q) {
  const result = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await configure(db.from(table).select(fields)).order("id").range(offset, offset + 999);
    if (error) throw error;
    result.push(...data);
    if (data.length < 1000) return result;
  }
}
async function queryRows(query) {
  const result = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await query.range(offset, offset + 999);
    if (error) throw error;
    result.push(...(data || []));
    if (!data || data.length < 1000) return result;
  }
}
export async function getOperations(req, res, next) {
  try {
    let jobsQuery = db.from("bookings").select("id,booking_number,status,assigned_washer_id,latitude,longitude,service_address,scheduled_date,scheduled_start_time").not("status", "in", "(closed,cancelled,payment_completed)");
    let locationsQuery = db.from("washer_locations").select("id,washer_id,latitude,longitude,service_latitude,service_longitude,updated_at");
    if (req.profile?.role === "supervisor") {
      jobsQuery = boundQueryToSupervisorArea(jobsQuery, req.supervisorArea);
      locationsQuery = boundQueryToSupervisorArea(locationsQuery, req.supervisorArea);
    }
    const [washers, locationResult, jobsResult] = await Promise.all([
      rows("washers", "id,status,is_active,rating", q => q.eq("is_active", true)),
      queryRows(locationsQuery),
      queryRows(jobsQuery),
    ]);
    const locations = req.profile?.role === "supervisor" ? locationResult.filter(point => isWithinSupervisorArea({ latitude: point.service_latitude ?? point.latitude, longitude: point.service_longitude ?? point.longitude }, req.supervisorArea)) : locationResult;
    const jobs = req.profile?.role === "supervisor" ? jobsResult.filter(job => isWithinSupervisorArea(job, req.supervisorArea)) : jobsResult;
    const latest = new Map();
    for (const point of locations) if (!latest.has(point.washer_id) || Date.parse(point.updated_at) > Date.parse(latest.get(point.washer_id).updated_at)) latest.set(point.washer_id, point);
    const now = Date.now();
    const areaWasherIds = req.profile?.role === "supervisor" ? new Set(locations.map(point => point.washer_id)) : null;
    res.json({ success: true, refreshedAt: new Date(now).toISOString(), washers: washers.filter(w => !areaWasherIds || areaWasherIds.has(w.id)).map(w => {
      const location = latest.get(w.id) || null;
      return { ...w, location, stale: !location || !Number.isFinite(Date.parse(location.updated_at)) || now - Date.parse(location.updated_at) > 5 * 60_000 };
    }), jobs: jobs.filter(job => job.status !== "completed").map(job => ({ ...job, delayed: ["pending", "finding_washer", "washer_assigned"].includes(job.status) && Date.parse(job.scheduled_date + "T" + (job.scheduled_start_time || "00:00:00") + "+05:30") < now - 15 * 60_000 })) });
  } catch (error) { next(error); }
}

export async function getServiceCompletions(req, res, next) {
  try {
    const isSupervisor = req.profile?.role === "supervisor";
    let scopedWasherIds = null;
    if (isSupervisor) {
      const { data: linkedWashers, error: linkedWashersError } = await db.from("washers")
        .select("id")
        .eq("supervisor_id", req.user.id);
      if (linkedWashersError) throw linkedWashersError;
      scopedWasherIds = (linkedWashers || []).map(washer => washer.id);
      if (scopedWasherIds.length === 0) return res.json({ jobs: [] });
    }

    let bookingsQuery = db.from("bookings")
      .select("id,booking_number,status,assigned_washer_id,latitude,longitude,service_address,scheduled_date,scheduled_start_time,service_completed_at,service_validated_at,total_amount")
      .not("service_completed_at", "is", null)
      .in("status", ["service_completed", "customer_confirmed", "payment_completed", "closed"])
      .order("service_completed_at", { ascending: false });
    if (scopedWasherIds) bookingsQuery = bookingsQuery.in("assigned_washer_id", scopedWasherIds);
    if (isSupervisor) bookingsQuery = boundQueryToSupervisorArea(bookingsQuery, req.supervisorArea);
    const { data: bookings, error } = await bookingsQuery;
    if (error) throw error;

    const scopedBookings = isSupervisor ? (bookings || []).filter(booking => isWithinSupervisorArea(booking, req.supervisorArea)) : bookings || [];
    const limitedBookings = scopedBookings.slice(0, 100);
    const washerIds = [...new Set(limitedBookings.map(booking => booking.assigned_washer_id).filter(Boolean))];
    const { data: washers, error: washerError } = washerIds.length
      ? await db.from("washers").select("id,user_id").in("id", washerIds)
      : { data: [], error: null };
    if (washerError) throw washerError;
    const userIds = [...new Set((washers || []).map(washer => washer.user_id).filter(Boolean))];
    const { data: profiles, error: profileError } = userIds.length
      ? await db.from("profiles").select("id,full_name,phone").in("id", userIds)
      : { data: [], error: null };
    if (profileError) throw profileError;

    const profilesById = new Map((profiles || []).map(profile => [profile.id, profile]));
    const washerById = new Map((washers || []).map(washer => [washer.id, {
      id: washer.id,
      name: profilesById.get(washer.user_id)?.full_name || "Washer partner",
      phone: profilesById.get(washer.user_id)?.phone || null,
    }]));
    res.json({ jobs: limitedBookings.map(booking => ({
      ...booking,
      washer: washerById.get(booking.assigned_washer_id) || null,
    })) });
  } catch (error) { next(error); }
}
