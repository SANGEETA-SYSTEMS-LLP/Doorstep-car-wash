import { validServiceAddress } from "./locationSelection";
import { apiRequest } from "./api";
import { supabase } from "./supabase";

export function checkCoverage(location) {
  return apiRequest("/locations/coverage?" + new URLSearchParams({ latitude: location.latitude, longitude: location.longitude }));
}

export async function saveServiceAddress(userId, location, address = {}, societyId) {
  if (!validServiceAddress(location)) throw new Error("Select a map pin and enter a complete street address.");
  const { data: customer, error: customerError } = await supabase.from("customers").select("id").eq("user_id", userId).maybeSingle();
  if (customerError) throw customerError;
  if (!customer) throw new Error("Your customer profile is not ready. Please contact support.");
  const payload = {
    customer_id: customer.id, label: "Service location", address_line: location.address,
    society_id: societyId || null, tower: address.tower || null, flat_number: address.flatNumber || null,
    landmark: address.landmark || null, city: location.city || null, state: location.state || null,
    postal_code: location.postalCode || null, latitude: location.latitude, longitude: location.longitude,
  };
  if (location.addressId) {
    const { data: existing, error: lookupError } = await supabase.from("customer_addresses").select("*").eq("id", location.addressId).eq("customer_id", customer.id).maybeSingle();
    if (lookupError) throw lookupError;
    const unchanged = existing && Object.entries(payload).every(([key, value]) => key === "label" || (["latitude", "longitude"].includes(key) ? Number(existing[key]) === Number(value) : (existing[key] || null) === (value || null)));
    if (unchanged) return { id: existing.id };
  }
  const { data, error } = await supabase.from("customer_addresses").insert(payload).select("id").single();
  if (error) throw error;
  return data;
}

export async function getSavedAddresses(userId) {
  if (!userId) return [];
  const { data: customer, error: customerError } = await supabase.from("customers").select("id").eq("user_id", userId).maybeSingle();
  if (customerError) throw customerError;
  if (!customer) return [];
  const { data, error } = await supabase.from("customer_addresses").select("id,address_line,label,latitude,longitude,city,state,postal_code,tower,flat_number,landmark").eq("customer_id", customer.id).order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return data || [];
}
