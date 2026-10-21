// Only these tables and columns can be reached through administration routes.
const text = (label, required = false) => ({ label, type: "text", required, maxLength: 250 });
const number = (label, min, max, required = false) => ({ label, type: "number", min, max, required });
const relation = (label, resource, required = false) => ({ label, type: "relation", resource, required });
const active = { label: "Active", type: "boolean" };
const vehicleCategory = { label: "Vehicle category", type: "select", required: true, options: ["hatchback", "sedan", "suv", "muv", "luxury", "large suv", "all vehicles"] };
export const resources = {
  societies: { table: "societies", title: "Societies", columns: ["id", "name", "formatted_address", "area", "city", "state", "postal_code", "latitude", "longitude", "service_radius_km", "is_active"], fields: { name: text("Name", true), formatted_address: text("Address", true), area: text("Area"), city: text("City", true), state: text("State", true), postal_code: text("Postal code"), latitude: number("Latitude", -90, 90, true), longitude: number("Longitude", -180, 180, true), service_radius_km: number("Society radius (km)", 0.01, 100, true), is_active: active } },
  zones: { table: "service_zones", title: "Service zones", columns: ["id", "name", "society_id", "latitude", "longitude", "radius_km", "is_active"], fields: { name: text("Zone name", true), society_id: relation("Society (optional)", "societies"), latitude: number("Latitude", -90, 90, true), longitude: number("Longitude", -180, 180, true), radius_km: number("Coverage radius (km)", 0.01, 100, true), is_active: active } },
  services: { table: "services", title: "Services", columns: ["id", "name", "description", "is_active"], fields: { name: text("Name", true), description: { ...text("Description"), maxLength: 2000 }, is_active: active } },
  packages: { table: "service_packages", title: "Packages and pricing", columns: ["id", "service_id", "name", "description", "vehicle_type", "price", "duration_minutes", "washer_commission_percent", "is_active"], fields: { service_id: relation("Service", "services", true), name: text("Package name", true), description: { ...text("Description"), maxLength: 2000 }, vehicle_type: vehicleCategory, price: number("Price (₹)", 0, 100000, true), duration_minutes: number("Duration (minutes)", 1, 1440, true), washer_commission_percent: number("Washer commission (%)", 0, 100, true), is_active: active } },
  customers: { table: "customers", title: "Customers", columns: ["id", "user_id", "total_bookings", "total_spent", "is_active", "created_at"], detailColumns: ["full_name", "email", "phone", "saved_addresses", "vehicles"] },
  washers: { table: "washers", title: "Washers", columns: ["id", "user_id", "status", "rating", "jobs_completed", "is_verified", "is_active", "current_address", "service_radius_km"], detailColumns: ["full_name", "email", "phone"] },
  supervisors: { table: "profiles", title: "Supervisors", columns: ["id", "full_name", "phone", "role", "is_active"], detailColumns: ["email", "payout_method"], filter: ["role", "supervisor"] },
  bookings: { table: "bookings", title: "Bookings", columns: ["id", "booking_number", "customer_id", "assigned_washer_id", "scheduled_date", "scheduled_start_time", "status", "total_amount"] },
  payments: { table: "payments", title: "Payments", columns: ["id", "booking_id", "amount", "payment_method", "status", "paid_at", "created_at"] },
  earnings: { table: "washer_earnings", title: "Washer earnings", columns: ["id", "washer_id", "booking_id", "gross_amount", "platform_commission", "washer_amount", "status", "settled_at"] },
  settlements: { table: "washer_settlements", title: "Settlements", columns: ["id", "washer_id", "amount", "status", "payment_reference", "processed_at"] },
};
export function validateResourceInput(spec, body, partial = false) {
  if (!spec.fields) throw Object.assign(new Error("This resource is read-only."), { status: 405 });
  if (!body || typeof body !== "object" || Array.isArray(body)) throw Object.assign(new Error("Invalid request body."), { status: 400 });
  const output = {};
  for (const key of Object.keys(body)) if (!spec.fields[key]) throw Object.assign(new Error("Unsupported field: " + key), { status: 400 });
  for (const [key, field] of Object.entries(spec.fields)) {
    if (!(key in body)) {
      if (!partial && field.required) throw Object.assign(new Error(field.label + " is required."), { status: 400 });
      continue;
    }
    let value = body[key];
    if (field.type === "boolean") {
      if (typeof value !== "boolean") throw Object.assign(new Error(field.label + " must be true or false."), { status: 400 });
    } else if (value === null || value === "") {
      if (field.required) throw Object.assign(new Error(field.label + " is required."), { status: 400 });
      value = null;
    } else if (field.type === "number") {
      if (typeof value !== "number" || !Number.isFinite(value) || value < field.min || value > field.max || (key === "duration_minutes" && !Number.isInteger(value))) throw Object.assign(new Error("Invalid " + field.label.toLowerCase() + "."), { status: 400 });
    } else if (field.type === "select") {
      if (!field.options.includes(value)) throw Object.assign(new Error("Choose a valid " + field.label.toLowerCase() + "."), { status: 400 });
    } else if (field.type === "relation") {
      if (typeof value !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)) throw Object.assign(new Error("Choose a valid " + field.label.toLowerCase() + "."), { status: 400 });
    } else {
      if (typeof value !== "string" || !value.trim() || value.length > field.maxLength) throw Object.assign(new Error("Invalid " + field.label.toLowerCase() + "."), { status: 400 });
      value = value.trim();
    }
    output[key] = value;
  }
  if (!Object.keys(output).length) throw Object.assign(new Error("No changes supplied."), { status: 400 });
  return output;
}
