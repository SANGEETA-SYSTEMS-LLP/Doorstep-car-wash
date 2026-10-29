import { supabaseAdmin } from "../../config/supabase.js";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function customerForUser(userId) {
  const { data, error } = await supabaseAdmin.from("customers").select("id").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function listCustomerNotifications(req, res, next) {
  try {
    const customer = await customerForUser(req.user.id);
    if (!customer) return res.json({ notifications: [] });
    const { data, error } = await supabaseAdmin.from("customer_notifications")
      .select("id,booking_id,booking_number,event_type,title,message,created_at,read_at")
      .eq("customer_id", customer.id).order("created_at", { ascending: false }).limit(30);
    if (error) throw error;
    return res.json({ notifications: data || [] });
  } catch (error) { return next(error); }
}

export async function markCustomerNotificationRead(req, res, next) {
  try {
    if (!uuid.test(req.params.notificationId || "")) return res.status(400).json({ message: "Invalid notification ID." });
    const customer = await customerForUser(req.user.id);
    if (!customer) return res.status(404).json({ message: "Notification not found." });
    const { data, error } = await supabaseAdmin.from("customer_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", req.params.notificationId).eq("customer_id", customer.id).is("read_at", null)
      .select("id,read_at").maybeSingle();
    if (error) throw error;
    return res.json({ success: true, notification: data || null });
  } catch (error) { return next(error); }
}
