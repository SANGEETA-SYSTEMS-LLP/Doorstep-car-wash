import { supabaseAdmin } from "../../config/supabase.js";
import { referenceId } from "../../../../shared/referenceId.mjs";

export function normalizeServiceAddress(value) {
  return String(value || "").normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "").trim();
}

// Fetch related records by their booking foreign keys, keeping the list response
// compatible with the supervisor pages without selecting legacy booking columns.
export async function enrichSupervisorBookings(bookings) {
  async function loadRelated(table, foreignKey, columns) {
    const ids = [...new Set(bookings.map((booking) => booking[foreignKey]).filter(Boolean))];
    if (!ids.length) return new Map();

    const { data, error } = await supabaseAdmin
      .from(table)
      .select(columns)
      .in("id", ids);
    if (error) throw error;
    return new Map((data || []).map((record) => [record.id, record]));
  }

  const [addresses, vehicles, packages, customers] = await Promise.all([
    loadRelated("customer_addresses", "address_id",
      "id, address_line, tower, flat_number, landmark, city, state, postal_code, latitude, longitude"),
    loadRelated("vehicles", "vehicle_id", "id, brand, model, vehicle_number, vehicle_type"),
    loadRelated("service_packages", "package_id", "id, name, duration_minutes"),
    loadRelated("customers", "customer_id", "id, user_id"),
  ]);
  const userIds = [...new Set([...customers.values()].map((customer) => customer.user_id).filter(Boolean))];
  const profilesByUserId = new Map();
  if (userIds.length) {
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, phone")
      .in("id", userIds);
    if (error) throw error;
    for (const profile of profiles || []) {
      profilesByUserId.set(profile.id, profile);
    }
  }

  return bookings.map((booking) => {
    const address = addresses.get(booking.address_id) || null;
    const customer = customers.get(booking.customer_id);
    const customerProfile = profilesByUserId.get(customer?.user_id);
    return {
      ...booking,
      customer: {
        name: customerProfile?.full_name || "Customer",
        phone: customerProfile?.phone || null,
        referenceId: referenceId("CUS", customer?.user_id),
      },
      address,
      service_address: booking.service_address?.trim() || (address
        ? [address.address_line, address.tower, address.flat_number,
            address.landmark, address.city, address.state, address.postal_code]
            .filter(Boolean).join(", ")
        : "") || "Address unavailable",
      scheduled_time: booking.scheduled_start_time,
      vehicle: vehicles.get(booking.vehicle_id) || null,
      package: packages.get(booking.package_id) || null,
    };
  });
}

