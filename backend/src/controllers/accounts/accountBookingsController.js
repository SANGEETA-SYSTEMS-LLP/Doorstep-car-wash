import { supabaseAdmin as db } from "../../config/supabase.js";

export async function getMyBookings(req, res, next) {
  try {
    const customer = await db.from("customers").select("id").eq("user_id", req.user.id).maybeSingle();
    if (customer.error) throw customer.error;
    if (!customer.data) return res.json({ bookings: [] });
    const bookings = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await db.from("bookings").select(`
        id,booking_number,status,scheduled_date,scheduled_start_time,scheduled_time,total_amount,created_at,
        service_address,tower,assigned_washer_id,
        vehicle:vehicles(id,brand,model,vehicle_number,vehicle_type,colour),
        package:service_packages(id,name,description,price,duration_minutes)
      `).eq("customer_id", customer.data.id).order("created_at", { ascending: false }).order("id", { ascending: false }).range(offset, offset + 999);
      if (error) throw error;
      bookings.push(...(data || []));
      if (!data || data.length < 1000) break;
    }
    const washerIds = [...new Set(bookings.map(booking => booking.assigned_washer_id).filter(Boolean))];
    const washersById = new Map();
    if (washerIds.length) {
      for (let offset = 0; offset < washerIds.length; offset += 500) {
        const { data: washers, error: washerError } = await db.from("washers")
          .select("id,user_id,rating,jobs_completed,status")
          .in("id", washerIds.slice(offset, offset + 500));
        if (washerError) throw washerError;
        const userIds = [...new Set((washers || []).map(washer => washer.user_id).filter(Boolean))];
        let profiles = [];
        if (userIds.length) {
          const { data, error } = await db.from("profiles").select("id,full_name,phone,avatar_url").in("id", userIds);
          if (error) throw error;
          profiles = data || [];
        }
        const profilesById = new Map(profiles.map(profile => [profile.id, profile]));
        for (const washer of washers || []) {
          const profile = profilesById.get(washer.user_id);
          washersById.set(washer.id, {
            id: washer.id,
            name: profile?.full_name || "Washer Partner",
            phone: profile?.phone || null,
            avatarUrl: profile?.avatar_url || null,
            rating: washer.rating,
            totalJobs: washer.jobs_completed,
            status: washer.status,
          });
        }
      }
    }
    res.json({ bookings: bookings.map(booking => ({
      ...booking,
      washer: booking.assigned_washer_id ? washersById.get(booking.assigned_washer_id) || null : null,
    })) });
  } catch (error) { next(error); }
}
