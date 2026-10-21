import { supabaseAdmin as db } from "../config/supabase.js";
import { referenceId } from "../utils/referenceId.js";
export const activeJobStatuses = ["washer_assigned", "washer_on_the_way", "washer_arrived", "otp_verified", "service_started", "service_completed"];
const bookingColumns = "id, booking_number, customer_id, address_id, vehicle_id, package_id, assigned_washer_id, scheduled_date, scheduled_start_time, status, total_amount, customer_notes, created_at";

export async function washerForUser(userId) {
  const { data, error } = await db.from("washers").select("id, user_id, status, is_active, is_verified, rating, jobs_completed").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (!data) throw Object.assign(new Error("Washer profile not found."), { status: 404 });
  if (!data.is_active) throw Object.assign(new Error("Your washer account is inactive."), { status: 403 });
  return { ...data, referenceId: referenceId("WSH", data.user_id) };
}

async function records(table, ids, columns) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return new Map();
  const { data, error } = await db.from(table).select(columns).in("id", unique);
  if (error) throw error;
  return new Map((data || []).map(row => [row.id, row]));
}

export async function hydrateWasherJobs(bookings, washer) {
  if (!bookings.length) return [];
  const [customers, addresses, vehicles, packages] = await Promise.all([
    records("customers", bookings.map(b => b.customer_id), "id, user_id"),
    records("customer_addresses", bookings.map(b => b.address_id), "*"),
    records("vehicles", bookings.map(b => b.vehicle_id), "id, brand, model, vehicle_type, vehicle_number, colour"),
    records("service_packages", bookings.map(b => b.package_id), "id, name, description, duration_minutes"),
  ]);
  const profiles = await records("profiles", [...customers.values()].map(c => c.user_id), "id, full_name, phone");
  const { data: payments, error } = await db.from("payments").select("booking_id, status, payment_method, created_at").in("booking_id", bookings.map(b => b.id)).order("created_at", { ascending: false });
  if (error) throw error;
  return bookings.map(booking => {
    const customer = customers.get(booking.customer_id);
    const profile = profiles.get(customer?.user_id);
    const address = addresses.get(booking.address_id);
    const paymentRows = (payments || []).filter(p => p.booking_id === booking.id);
    const payment = paymentRows.find(p => ["paid", "captured", "success", "completed"].includes(p.status)) || paymentRows[0];
    const fullAddress = address ? [address.address_line, address.tower, address.flat_number, address.landmark, address.city, address.state, address.postal_code].filter(Boolean).join(", ") : "";
    return {
      ...booking,
      customer: { name: profile?.full_name || "Customer", phone: profile?.phone || null, referenceId: referenceId("CUS", customer?.user_id) },
      washerReferenceId: washer.referenceId,
      vehicle: vehicles.get(booking.vehicle_id) || null,
      package: packages.get(booking.package_id) || null,
      location: { name: address?.address_line || "Service location", address: fullAddress || "Address unavailable", latitude: address?.latitude ?? null, longitude: address?.longitude ?? null },
      payment: { status: payment?.status || "Not recorded", method: payment?.payment_method || "Not recorded" },
    };
  });
}

export async function washerWorkspace(userId) {
  const washer = await washerForUser(userId);
  const now = new Date().toISOString();
  const [offersResult, jobsResult] = await Promise.all([
    db.from("booking_assignments").select("id, booking_id, washer_id, status, distance_km, expires_at, offered_at").eq("washer_id", washer.id).eq("status", "pending").gt("expires_at", now).order("offered_at", { ascending: true }),
    db.from("bookings").select(bookingColumns).eq("assigned_washer_id", washer.id).order("scheduled_date", { ascending: false }).limit(100),
  ]);
  if (offersResult.error) throw offersResult.error;
  if (jobsResult.error) throw jobsResult.error;
  const offers = offersResult.data || [];
  const offerBookings = await records("bookings", offers.map(o => o.booking_id), bookingColumns);
  const eligibleOffers = offers.filter(o => {
    const booking = offerBookings.get(o.booking_id);
    return booking && !booking.assigned_washer_id && ["pending", "confirmed", "finding_washer", "support_escalated"].includes(booking.status);
  });
  const all = new Map((jobsResult.data || []).map(b => [b.id, b]));
  eligibleOffers.forEach(o => all.set(o.booking_id, offerBookings.get(o.booking_id)));
  const enriched = new Map((await hydrateWasherJobs([...all.values()], washer)).map(b => [b.id, b]));
  return { washer, assignments: eligibleOffers.map(o => ({ ...o, booking: enriched.get(o.booking_id) })), jobs: (jobsResult.data || []).map(b => enriched.get(b.id)) };
}

export async function washerBooking(userId, bookingId) {
  const washer = await washerForUser(userId);
  // Accepted ownership is checked before customer/contact data is fetched.
  const { data: booking, error } = await db.from("bookings").select(bookingColumns).eq("id", bookingId).eq("assigned_washer_id", washer.id).maybeSingle();
  if (error) throw error;
  if (!booking) throw Object.assign(new Error("Assigned booking not found."), { status: 404 });
  return (await hydrateWasherJobs([booking], washer))[0];
}
