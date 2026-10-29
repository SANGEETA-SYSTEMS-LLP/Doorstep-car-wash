import { supabaseAdmin } from "../../config/supabase.js";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function acceptAssignment(req, res) {
  const { assignmentId } = req.params;
  if (!uuid.test(assignmentId || "")) return res.status(400).json({ message: "Invalid assignment ID." });
  try {
    const { data: washer, error: washerError } = await supabaseAdmin.from("washers")
      .select("id,is_active,is_verified,status")
      .eq("user_id", req.user.id).maybeSingle();
    if (washerError) throw washerError;
    if (!washer?.is_active || !washer.is_verified) return res.status(403).json({ message: "An active, verified washer account is required." });

    const { data, error } = await supabaseAdmin.rpc("accept_booking_assignment_for_washer", {
      p_assignment_id: assignmentId,
      p_washer_id: washer.id,
    });
    if (error) {
      const known = error.code === "42501" ? 403 : ["40001", "P0002"].includes(error.code) ? 409 : 500;
      return res.status(known).json({ message: known === 500 ? "Unable to accept this assignment." : error.message });
    }
    return res.json({ success: true, assignment: data?.assignment || data });
  } catch (error) {
    console.error("Accept washer assignment failed", {
      name: typeof error?.name === "string" ? error.name : "Error",
      code: typeof error?.code === "string" ? error.code : undefined,
    });
    return res.status(500).json({ message: "Unable to accept this assignment." });
  }
}
