import { supabaseAdmin as db } from "../../config/supabase.js";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const removableStatuses = new Set(["completed", "customer_confirmed", "payment_completed", "closed", "cancelled", "rejected", "expired"]);
const missingHiddenColumn = error => error?.code === "42703" || error?.code === "PGRST204"
  || /customer_hidden_at.*(does not exist|schema cache|column)/i.test(error?.message || "");

export async function getMyBookings(req, res, next) {
  try {
    const customer = await db.from("customers").select("id").eq("user_id", req.user.id).maybeSingle();
    if (customer.error) throw customer.error;
    if (!customer.data) return res.json({ bookings: [] });
    const bookings = [];
    for (let offset = 0; ; offset += 1000) {
      let query = db.from("bookings").select(`
        id,booking_number,status,scheduled_date,scheduled_start_time,scheduled_time,total_amount,created_at,updated_at,payment_method,
        service_address,tower,assigned_washer_id,
        vehicle:vehicles(id,brand,model,vehicle_number,vehicle_type,colour),
        package:service_packages(id,name,description,price,duration_minutes)
      `).eq("customer_id", customer.data.id).is("customer_hidden_at", null)
        .order("created_at", { ascending: false }).order("id", { ascending: false }).range(offset, offset + 999);
      let { data, error } = await query;
      if (missingHiddenColumn(error)) {
        const fallback = await db.from("bookings").select(`
          id,booking_number,status,scheduled_date,scheduled_start_time,scheduled_time,total_amount,created_at,updated_at,payment_method,
          service_address,tower,assigned_washer_id,
          vehicle:vehicles(id,brand,model,vehicle_number,vehicle_type,colour),
          package:service_packages(id,name,description,price,duration_minutes)
        `).eq("customer_id", customer.data.id).order("created_at", { ascending: false })
          .order("id", { ascending: false }).range(offset, offset + 999);
        ({ data, error } = fallback);
      }
      if (error) throw error;
      bookings.push(...(data || []));
      if (!data || data.length < 1000) break;
    }
    const historyRetentionCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const retainedBookings = bookings.filter(booking => !(booking.status === "expired" && Date.parse(booking.updated_at || booking.created_at) < historyRetentionCutoff));
    const washerIds = [...new Set(retainedBookings.map(booking => booking.assigned_washer_id).filter(Boolean))];
    const bookingIds = retainedBookings.map(booking => booking.id);
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
    const cancellationsByBooking = new Map();
    const paymentsByBooking = new Map();
    for (let start = 0; start < bookingIds.length; start += 500) {
      const { data: payments, error: paymentError } = await db.from("payments")
        .select("booking_id,payment_method,status,paid_at,created_at")
        .in("booking_id", bookingIds.slice(start, start + 500))
        .order("created_at", { ascending: false });
      if (paymentError) throw paymentError;
      for (const payment of payments || []) {
        if (!paymentsByBooking.has(payment.booking_id)) paymentsByBooking.set(payment.booking_id, payment);
      }
    }
    for (let start = 0; start < bookingIds.length; start += 500) {
      const { data: methods, error: methodError } = await db.from("payments")
        .select("booking_id,provider_method,created_at")
        .in("booking_id", bookingIds.slice(start, start + 500))
        .not("provider_method", "is", null)
        .order("created_at", { ascending: false });
      if (methodError?.code === "42703" || methodError?.code === "PGRST204") continue;
      if (methodError) throw methodError;
      for (const payment of methods || []) {
        const existing = paymentsByBooking.get(payment.booking_id);
        if (existing && !existing.provider_method) existing.provider_method = payment.provider_method;
        else if (!existing) paymentsByBooking.set(payment.booking_id, payment);
      }
    }
    for (let start = 0; start < bookingIds.length; start += 500) {
      const { data: cancellations, error: cancellationError } = await db.from("booking_cancellations")
        .select("booking_id,refund_amount_paise,platform_fee_paise,status,provider_status")
        .in("booking_id", bookingIds.slice(start, start + 500));
      if (cancellationError && !["42P01", "PGRST205"].includes(cancellationError.code)) throw cancellationError;
      for (const cancellation of cancellations || []) cancellationsByBooking.set(cancellation.booking_id, cancellation);
    }
    res.json({ bookings: retainedBookings.map(booking => ({
      ...booking,
      washer: booking.assigned_washer_id ? washersById.get(booking.assigned_washer_id) || null : null,
      payment: paymentsByBooking.get(booking.id) || null,
      cancellation: cancellationsByBooking.get(booking.id) || null,
    })) });
  } catch (error) { next(error); }
}

export async function deleteMyBooking(req, res, next) {
  try {
    if (!uuid.test(req.params.bookingId || "")) {
      return res.status(400).json({ message: "Invalid booking ID." });
    }
    const { data: customer, error: customerError } = await db.from("customers")
      .select("id").eq("user_id", req.user.id).maybeSingle();
    if (customerError) throw customerError;
    if (!customer) return res.status(403).json({ message: "Customer profile not found." });

    const { data: booking, error: bookingError } = await db.from("bookings")
      .select("id,status").eq("id", req.params.bookingId).eq("customer_id", customer.id).maybeSingle();
    if (bookingError) throw bookingError;
    if (!booking) return res.status(404).json({ message: "Booking not found in your history." });
    if (!removableStatuses.has(booking.status)) {
      return res.status(409).json({ message: "Only completed or cancelled bookings can be removed from history." });
    }

    const { data, error } = await db.from("bookings").update({ customer_hidden_at: new Date().toISOString() })
      .eq("id", booking.id).eq("customer_id", customer.id).is("customer_hidden_at", null)
      .select("id").maybeSingle();
    if (missingHiddenColumn(error)) {
      return res.status(503).json({ message: "Apply backend/database/add_customer_booking_history_visibility.sql, then retry removing this booking." });
    }
    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Booking is already removed from your history." });
    return res.json({ success: true, id: data.id });
  } catch (error) { next(error); }
}
