import { supabaseAdmin as db } from "../config/supabase.js";
import { getCoverage } from "../services/coverageService.js";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const bad=message=>Object.assign(new Error(message),{status:400});
export function validateSchedule(date,time,now=Date.now()) {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date||"")||!/^([01]\d|2[0-3]):[0-5]\d(:00)?$/.test(time||""))throw bad("Choose a valid booking date and time.");
 const instant=Date.parse(date+"T"+time+"+05:30");
 if(!Number.isFinite(instant)||new Date(instant+19800000).toISOString().slice(0,10)!==date||instant<=now||instant>now+90*86400000)throw bad("Choose a future service time within 90 days (India time).");
}
export async function createBooking(req,res,next) {
 try {
  const {requestId,addressId,vehicleId,packageId,date,time,paymentMethod}=req.body||{};
  if(![requestId,addressId,vehicleId,packageId].every(id=>uuid.test(id||"")))throw bad("Choose a saved address, vehicle and service package before checkout.");
  if(!["cod","upi","card","netbanking","wallet","online"].includes(paymentMethod))throw bad("Choose a supported payment method.");
  const {data:customer,error:ce}=await db.from("customers").select("id").eq("user_id",req.user.id).single();if(ce)throw ce;
  const {data:existing,error:ee}=await db.from("bookings").select("*").eq("id",requestId).eq("customer_id",customer.id).maybeSingle();if(ee)throw ee;
  if(existing){if(existing.address_id!==addressId||existing.vehicle_id!==vehicleId||existing.package_id!==packageId||existing.payment_method!==paymentMethod||existing.scheduled_date!==date||existing.scheduled_start_time.slice(0,5)!==time.slice(0,5))throw bad("This booking request already exists with different details.");return res.json({booking:existing});}
  validateSchedule(date,time);
  const results=await Promise.all([
   db.from("customer_addresses").select("*").eq("id",addressId).eq("customer_id",customer.id).single(),
   db.from("vehicles").select("id,vehicle_type").eq("id",vehicleId).eq("customer_id",customer.id).eq("is_active",true).single(),
   db.from("service_packages").select("id,price,vehicle_type,is_active").eq("id",packageId).eq("is_active",true).single(),
  ]);
  if(results.some(r=>r.error||!r.data))throw bad("The address, vehicle or package is unavailable.");
  const [address,vehicle,pack]=results.map(r=>r.data);
  if(pack.vehicle_type!==vehicle.vehicle_type)throw bad("Choose a package for this vehicle type.");
  if(!(await getCoverage(address.latitude,address.longitude)).available)throw bad("The selected address needs valid map coordinates.");
  const price=Number(pack.price);if(!Number.isFinite(price)||price<=0)throw bad("Invalid package price.");
  const {data,error}=await db.from("bookings").insert({id:requestId,customer_id:customer.id,address_id:addressId,vehicle_id:vehicleId,package_id:packageId,service_address:address.address_line,latitude:address.latitude,longitude:address.longitude,tower:address.tower,flat_number:address.flat_number,landmark:address.landmark,scheduled_date:date,scheduled_start_time:time,scheduled_time:time,base_amount:price,service_amount:price,platform_fee:20,discount_amount:20,tax_amount:0,total_amount:price,payment_method:paymentMethod,status:"pending"}).select("*").single();
  if(error?.code==="23505")return res.status(409).json({message:"This request was already saved. Retry to retrieve it."});if(error)throw error;
  res.status(201).json({booking:data});
 }catch(error){next(error);}
}
