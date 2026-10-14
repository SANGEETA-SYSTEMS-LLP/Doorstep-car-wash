import { supabase } from "./supabase";

async function getCustomerId(userId) {
  if (!userId) {
    throw new Error(
      "You must be logged in to access vehicles."
    );
  }

  const { data: customer, error } = await supabase
    .from("customers")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error(
      "Get customer for vehicles error:",
      error
    );

    throw error;
  }

  return customer.id;
}

export async function getMyVehicles(userId) {
  if (!userId) {
    return [];
  }

  const customerId = await getCustomerId(userId);

  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("customer_id", customerId)
    .order("is_default", {
      ascending: false,
    })
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Get vehicles error:",
      error
    );

    throw error;
  }

  return data || [];
}

export async function createVehicle({
  userId,
  vehicleNumber,
  vehicleType,
  brand,
  model,
  colour,
}) {
  if (!userId) {
    throw new Error(
      "You must be logged in."
    );
  }

  const customerId = await getCustomerId(userId);

  const payload = {
    customer_id: customerId,

    vehicle_number:
      vehicleNumber.trim().toUpperCase(),

    vehicle_type: vehicleType,

    brand: brand.trim(),

    model: model.trim(),

    colour:
      colour?.trim() || null,
  };

  const { data, error } = await supabase
    .from("vehicles")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    console.error(
      "Create vehicle error:",
      error
    );

    throw error;
  }

  return data;
}

export async function deleteVehicle(
  vehicleId,
  userId
) {
  const customerId = await getCustomerId(userId);

  const { error } = await supabase
    .from("vehicles")
    .delete()
    .eq("id", vehicleId)
    .eq("customer_id", customerId);

  if (error) {
    throw error;
  }
}