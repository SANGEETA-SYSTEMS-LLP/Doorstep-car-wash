import { supabaseAdmin as db } from "../../config/supabase.js";

const SETTINGS_ID = true;

export async function loadInvoiceSellerSettings() {
  const { data, error } = await db.from("invoice_seller_settings")
    .select("business_name,business_address").eq("id", SETTINGS_ID).maybeSingle();
  if (error) throw error;
  return {
    // Finance-entered values must take precedence so a deployment can be
    // configured without changing/restarting backend environment variables.
    businessName: data?.business_name || process.env.INVOICE_BUSINESS_NAME || "doorstep car wash",
    businessAddress: data?.business_address || process.env.INVOICE_BUSINESS_ADDRESS || "",
    environmentManaged: false,
  };
}

export async function getInvoiceSettings(req, res, next) {
  try { res.json({ settings: await loadInvoiceSellerSettings() }); }
  catch (error) { next(error); }
}

export async function saveInvoiceSettings(req, res, next) {
  try {
    const businessName = typeof req.body?.businessName === "string" ? req.body.businessName.trim() : "";
    const businessAddress = typeof req.body?.businessAddress === "string" ? req.body.businessAddress.trim() : "";
    if (Object.keys(req.body || {}).some(key => !["businessName", "businessAddress"].includes(key))
      || businessName.length < 2 || businessName.length > 120
      || businessAddress.length < 10 || businessAddress.length > 500) {
      return res.status(400).json({ message: "Enter the seller's business name and a complete business address (10 to 500 characters)." });
    }
    const { error } = await db.from("invoice_seller_settings").upsert({
      id: SETTINGS_ID,
      business_name: businessName,
      business_address: businessAddress,
      updated_by: req.user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
    if (error) throw error;
    res.json({ success: true, settings: { businessName, businessAddress, environmentManaged: false } });
  } catch (error) { next(error); }
}
