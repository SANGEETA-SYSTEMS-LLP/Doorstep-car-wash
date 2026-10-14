import { supabase } from "./supabase";

export async function getServicePackages() {
  const { data, error } =
    await supabase
      .from("service_packages")
      .select(
        "id, name, description, vehicle_type, price, duration_minutes, service_id"
      )
      .eq("is_active", true)
      .order("price", {
        ascending: true,
      });

  if (error) {
    console.error(
      "Get packages error:",
      {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        status: error.status,
      }
    );

    throw error;
  }

  console.log("Loaded packages:", data);

  return data || [];
}