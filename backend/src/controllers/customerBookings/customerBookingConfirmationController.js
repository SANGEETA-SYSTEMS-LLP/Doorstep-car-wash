import { supabaseAdmin } from "../../config/supabase.js";
import { getCustomerBooking, uuidPattern } from "./customerBookingAccess.js";

import { createWasherEarning } from "../../services/earningService.js";
import { getSignedServicePhotos } from "../servicePhotoController.js";

export async function confirmService(req, res) {
  if (!uuidPattern.test(req.params.bookingId || "")) return res.status(400).json({message:"Invalid booking ID."});
  try {
    const {data, error} = await supabaseAdmin.rpc("confirm_customer_service", {p_booking_id:req.params.bookingId,p_user_id:req.user.id});
    if (error) throw error;
    await createWasherEarning(req.params.bookingId);
    return res.json({success:true,booking:data});
  } catch(error) { return res.status(409).json({message:error.message || "Unable to confirm service."}); }
}
