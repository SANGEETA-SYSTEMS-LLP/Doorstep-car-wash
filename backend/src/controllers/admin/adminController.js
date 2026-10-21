import { supabaseAdmin as db } from "../../config/supabase.js";
import { resources, validateResourceInput } from "../../config/adminResources.js";
function specFor(req) {
  const spec = Object.hasOwn(resources, req.params.resource) ? resources[req.params.resource] : null;
  if (!spec) throw Object.assign(new Error("Resource not found."), { status: 404 });
  return spec;
}

async function loadProfileDetails(userIds) {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!ids.length) return { profiles: new Map(), emails: new Map() };
  const { data, error } = await db.from("profiles").select("id,full_name,phone").in("id", ids);
  if (error) throw error;
  const profiles = new Map((data || []).map(profile => [profile.id, profile]));
  const entries = await Promise.all(ids.map(async id => {
    const { data: result, error: authError } = await db.auth.admin.getUserById(id);
    if (authError) throw authError;
    return [id, result?.user?.email || null];
  }));
  return { profiles, emails: new Map(entries) };
}

async function addDirectoryDetails(resource, rows, role) {
  if (!["customers", "washers", "supervisors"].includes(resource)) return rows;
  const userIds = rows.map(row => resource === "supervisors" ? row.id : row.user_id);
  const { profiles, emails } = resource === "supervisors"
    ? { profiles: new Map(rows.map(row => [row.id, row])), emails: new Map(await Promise.all(userIds.map(async id => {
        const { data, error } = await db.auth.admin.getUserById(id);
        if (error) throw error;
        return [id, data?.user?.email || null];
      }))) }
    : await loadProfileDetails(userIds);

  const payoutByWasher = new Map();
  const addressesByCustomer = new Map();
  const vehiclesByCustomer = new Map();
  if (resource === "customers" && rows.length) {
    const customerIds = rows.map(row => row.id);
    const [addressResult, vehicleResult] = await Promise.all([
      db.from("customer_addresses").select("customer_id,label,address_line,city,state,postal_code,tower,flat_number,landmark").in("customer_id", customerIds),
      db.from("vehicles").select("customer_id,brand,model,vehicle_number,vehicle_type,colour,seating_capacity,is_active").in("customer_id", customerIds),
    ]);
    if (addressResult.error) throw addressResult.error;
    if (vehicleResult.error) throw vehicleResult.error;
    for (const address of addressResult.data || []) {
      const list = addressesByCustomer.get(address.customer_id) || [];
      list.push(address);
      addressesByCustomer.set(address.customer_id, list);
    }
    for (const vehicle of vehicleResult.data || []) {
      const list = vehiclesByCustomer.get(vehicle.customer_id) || [];
      list.push(vehicle);
      vehiclesByCustomer.set(vehicle.customer_id, list);
    }
  }
  if (resource === "washers" && role === "super_admin" && rows.length) {
    const { data, error } = await db.from("washer_payout_accounts")
      .select("washer_id,account_label,updated_at")
      .in("washer_id", rows.map(row => row.id));
    if (error) throw error;
    for (const payout of data || []) payoutByWasher.set(payout.washer_id, payout);
  }

  return rows.map(row => {
    const userId = resource === "supervisors" ? row.id : row.user_id;
    const profile = profiles.get(userId) || {};
    const detail = { ...row, full_name: profile.full_name || null, email: emails.get(userId) || null, phone: profile.phone || row.phone || null };
    if (resource === "customers") {
      detail.saved_addresses = (addressesByCustomer.get(row.id) || []).map(address => [
        address.label,
        [address.address_line, address.tower, address.flat_number, address.landmark, address.city, address.state, address.postal_code].filter(Boolean).join(", "),
      ].filter(Boolean).join(": ")).join(" | ") || "None saved";
      detail.vehicles = (vehiclesByCustomer.get(row.id) || []).map(vehicle => [
        [vehicle.brand, vehicle.model].filter(Boolean).join(" "),
        vehicle.vehicle_number,
        vehicle.vehicle_type,
        vehicle.seating_capacity ? `${vehicle.seating_capacity} seats` : null,
        vehicle.is_active === false ? "Inactive" : null,
      ].filter(Boolean).join(" · ")).join(" | ") || "None saved";
    }
    // The current schema stores payout beneficiaries only for washers. Do not
    // imply that supervisors can receive payouts until their payout workflow exists.
    if (resource === "supervisors") detail.payout_method = "Not configured";
    if (resource === "washers" && role === "super_admin") {
      const payout = payoutByWasher.get(row.id);
      detail.payout_method = payout ? "Bank transfer (RazorpayX)" : "Not configured";
      detail.payout_destination = payout && /^Bank account •••• \d{4} \([A-Z]{4}0[A-Z0-9]{6}\)$/.test(payout.account_label || "")
        ? payout.account_label
        : payout ? "Bank account (linked)" : null;
      detail.payout_updated_at = payout?.updated_at || null;
    }
    return detail;
  });
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
    const rows = await addDirectoryDetails(req.params.resource, data || [], req.profile?.role);
    const detailColumns = (spec.detailColumns || []).filter(column => column !== "payout_method" || req.profile?.role === "super_admin");
    const columns = [...spec.columns, ...detailColumns];
    if (req.params.resource === "washers" && req.profile?.role === "super_admin") columns.push("payout_method", "payout_destination", "payout_updated_at");
    res.json({ success: true, title: spec.title, columns, fields: spec.fields || null, rows, count: count || 0, page, pageSize: 25 });
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
    if (req.params.resource === "packages") {
      let packageName = payload.name;
      let vehicleType = payload.vehicle_type;
      if (req.params.id && (!packageName || !vehicleType)) {
        const { data: current, error: currentError } = await db.from(spec.table).select("name,vehicle_type").eq("id", req.params.id).maybeSingle();
        if (currentError) throw currentError;
        if (!current) throw Object.assign(new Error("Record not found."), { status: 404 });
        packageName ||= current.name;
        vehicleType ||= current.vehicle_type;
      }
      let duplicateQuery = db.from(spec.table).select("id").eq("name", packageName).eq("vehicle_type", vehicleType);
      if (req.params.id) duplicateQuery = duplicateQuery.neq("id", req.params.id);
      const { data: duplicate, error: duplicateError } = await duplicateQuery.maybeSingle();
      if (duplicateError) throw duplicateError;
      if (duplicate) throw Object.assign(new Error("A package with this name already exists for that vehicle category."), { status: 409 });
    }
    const query = req.params.id ? db.from(spec.table).update(payload).eq("id", req.params.id) : db.from(spec.table).insert(payload);
    const { data, error } = await query.select(spec.columns.join(",")).maybeSingle();
    if (error) throw error;
    if (!data) throw Object.assign(new Error("Record not found."), { status: 404 });
    res.status(req.params.id ? 200 : 201).json({ success: true, record: data });
  } catch (err) { next(err); }
}
export async function deletePackage(req, res, next) {
  try {
    if (!/^[a-f0-9-]{36}$/i.test(req.params.id || "")) throw Object.assign(new Error("Invalid package ID."), { status: 400 });
    const { data, error } = await db.from("service_packages").update({ is_active: false }).eq("id", req.params.id).eq("is_active", true).select("id,name,is_active").maybeSingle();
    if (error) throw error;
    if (!data) throw Object.assign(new Error("Active package not found."), { status: 404 });
    res.json({ success: true, record: data });
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
