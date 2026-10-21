import { supabase } from "../auth/supabase";

export async function getMyWasherRecord(userId) {
  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("washers")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getPendingAssignments(washerId) {
  if (!washerId) return [];

  const { data, error } = await supabase
    .from("booking_assignments")
    .select(`
      *,
      booking:bookings (
        *,
        vehicle:vehicles (*),
        package:service_packages (*)
      )
    `)
    .eq("washer_id", washerId)
    .eq("status", "pending");

  if (error) throw error;
  return data || [];
}

export async function getWasherByUserId(userId) {
  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("washers")
    .select(`
      id,
      user_id,
      rating,
      total_jobs:jobs_completed,
      status,
      profile:profiles!washers_user_id_fkey (
        id,
        full_name,
        phone,
        avatar_url
      )
    `)
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error(error);
    throw error;
  }

  return data;
}

export async function getWasherLocation(washerId) {
  if (!washerId) {
    return null;
  }

  const { data, error } = await supabase
    .from("washer_locations")
    .select(`
      washer_id,
      latitude,
      longitude,
      heading,
      speed,
      updated_at
    `)
    .eq("washer_id", washerId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getWasherById(washerId) {
  if (!washerId) return null;
  const { data, error } = await supabase.from("washers").select("id, user_id, rating, total_jobs:jobs_completed, status, profile:profiles!washers_user_id_fkey(full_name, phone)").eq("id", washerId).maybeSingle();
  if (error) throw error;
  return data;
}
