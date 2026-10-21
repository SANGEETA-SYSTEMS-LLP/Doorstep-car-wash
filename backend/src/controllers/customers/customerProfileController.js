import { supabaseAdmin } from "../../config/supabase.js";
import { validateCustomerProfileInput } from "../../services/customer/customerProfileService.js";

export function getMyCustomerProfile(req, res) {
  return res.json({
    success: true,
    profile: {
      id: req.profile.id,
      full_name: req.profile.full_name,
      phone: req.profile.phone,
      email: req.user.email,
    },
  });
}

export async function updateMyCustomerProfile(req, res, next) {
  try {
    const updates = validateCustomerProfileInput(req.body);
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(updates)
      .eq("id", req.user.id)
      .select("id, full_name, phone")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, message: "Customer profile not found." });
    }

    return res.json({
      success: true,
      profile: { ...data, email: req.user.email },
    });
  } catch (error) {
    return next(error);
  }
}
