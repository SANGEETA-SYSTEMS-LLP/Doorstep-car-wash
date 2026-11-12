import { supabaseAdmin as db } from "../../config/supabase.js";
import { getCoverage } from "../../services/coverage/coverageService.js";
import { calculateOfferDiscount } from "../../services/customer/customerOfferService.js";
import { calculateCheckoutAmounts } from "../../services/checkout/checkoutPricing.js";
import { createHash } from "node:crypto";
import { monthlyTiers, monthlyPrices, normalizeVehicleType as normalizePackageType, fields as packageFields, withCanonicalOneTimePrice } from "../packages/packageCatalog.js";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const bad=message=>Object.assign(new Error(message),{status:400});
const virtualMonthlyId=/^monthly-[a-f0-9]{32}$/;
const normalizeVehicleType=value=>String(value||"").trim().toLowerCase().replace(/[_-]+/g," ").replace(/\s+/g," ");
function sameVehicleCategory(left,right){
 const category=value=>{const type=normalizeVehicleType(value);if(type.includes("luxury")||type.includes("large"))return "luxury";if(type.includes("hatch")||type==="compact")return "hatchback";if(type.includes("sedan"))return "sedan";if(["suv","muv","mpv","crossover"].some(token=>type.includes(token)))return "suv";return type;};
 const packageType=normalizeVehicleType(left);
 return category(left)===category(right)||["all","all vehicles","all car types","one time"].includes(packageType);
}
export function validateSchedule(date,time,now=Date.now()) {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date||"")||!/^([01]\d|2[0-3]):[0-5]\d(:00)?$/.test(time||""))throw bad("Choose a valid booking date and time.");
 const instant=Date.parse(date+"T"+time+"+05:30");
 if(!Number.isFinite(instant)||new Date(instant+19800000).toISOString().slice(0,10)!==date||instant<=now||instant>now+90*86400000)throw bad("Choose a future service time within 90 days (India time).");
}
export async function createBooking(req,res,next) {
 try {
  const {requestId,addressId,vehicleId,packageId,date,time,paymentMethod,promoCode}=req.body||{};
  if(!uuid.test(requestId||""))throw bad("This checkout request is invalid. Please refresh and try again.");
  if(!uuid.test(addressId||""))throw bad("Choose a service address before checkout.");
  if(!uuid.test(vehicleId||""))throw bad("Choose a vehicle before checkout.");
  if(!uuid.test(packageId||"")&&!virtualMonthlyId.test(packageId||""))throw bad("Choose a service package before checkout.");
  if(!["cod","upi","card","netbanking","wallet","online"].includes(paymentMethod))throw bad("Choose a supported payment method.");
  const {data:customer,error:ce}=await db.from("customers").select("id").eq("user_id",req.user.id).single();if(ce)throw ce;
  validateSchedule(date,time);
  const results=await Promise.all([
   db.from("customer_addresses").select("*").eq("id",addressId).eq("customer_id",customer.id).single(),
   db.from("vehicles").select("id,vehicle_type").eq("id",vehicleId).eq("customer_id",customer.id).eq("is_active",true).single(),
  ]);
  if(results.some(r=>r.error||!r.data))throw bad("The address or vehicle is unavailable.");
  const [address,vehicle]=results.map(r=>r.data);
  let pack, bookingPackageId=packageId;
  if(uuid.test(packageId)) {
   const result=await db.from("service_packages").select("id,name,price,vehicle_type,is_active").eq("id",packageId).eq("is_active",true).single();
   if(result.error||!result.data)throw bad("The selected service package is unavailable. Please choose it again.");
   pack=withCanonicalOneTimePrice(result.data);
  } else {
   pack=await resolveMonthlyPlan(packageId,vehicle.vehicle_type);
   if(!pack)throw bad("This monthly package is no longer available. Please select it again.");
   bookingPackageId=pack.catalogId;
  }
  const {data:existing,error:ee}=await db.from("bookings").select("*").eq("id",requestId).eq("customer_id",customer.id).maybeSingle();if(ee)throw ee;
  if(existing){if(existing.address_id!==addressId||existing.vehicle_id!==vehicleId||existing.package_id!==bookingPackageId||existing.payment_method!==paymentMethod||existing.scheduled_date!==date||existing.scheduled_start_time.slice(0,5)!==time.slice(0,5)||(existing.promo_code||"")!==(typeof promoCode === "string" ? promoCode.trim().toUpperCase() : ""))throw bad("This booking request already exists with different details.");return res.json({booking:existing});}
  if(!sameVehicleCategory(pack.vehicle_type,vehicle.vehicle_type))throw bad("Choose a package for this vehicle type.");
  if(!(await getCoverage(address.latitude,address.longitude)).available)throw bad("Service is not available at this location because no supervisor and verified washer currently cover this area. Choose another address.");
  const price=Number(pack.price);if(!Number.isFinite(price)||price<=0)throw bad("Invalid package price.");
  let promoDiscount = 0;
  let normalizedPromoCode = null;
  if (promoCode != null && promoCode !== "") {
   if (typeof promoCode !== "string" || promoCode.length > 40) throw bad("Enter a valid offer code.");
   normalizedPromoCode = promoCode.trim().toUpperCase();
   const { data: priorOfferUse, error: priorOfferUseError } = await db.from("bookings")
    .select("id").eq("customer_id", customer.id).eq("promo_code", normalizedPromoCode).limit(1).maybeSingle();
   if (priorOfferUseError) throw priorOfferUseError;
   if (priorOfferUse) throw bad("You have already used this offer on a previous booking.", 409);
   let firstBooking = false;
   if (normalizedPromoCode === "FIRSTWASH") {
    const { count, error: countError } = await db.from("bookings").select("id", { count: "exact", head: true }).eq("customer_id", customer.id);
    if (countError) throw countError;
    firstBooking = (count || 0) === 0;
   }
   promoDiscount = calculateOfferDiscount({ code: normalizedPromoCode, servicePrice: price, packageName: pack.name, scheduledDate: date, firstBooking }).discountAmount;
  }
  const taxInclusive = pack.name === "Essential Exterior Wash" || pack.name === "Plus Exterior Wash" || pack.name === "Premium Exterior Wash";
  const checkoutAmounts = calculateCheckoutAmounts(price, promoDiscount, taxInclusive);
  const serviceAmount = taxInclusive ? Number((price * 100 / (100 + Number(process.env.GST_RATE_PERCENT ?? 18))).toFixed(2)) : price;
  const bookingValues={id:requestId,customer_id:customer.id,address_id:addressId,vehicle_id:vehicleId,package_id:bookingPackageId,service_address:address.address_line,latitude:address.latitude,longitude:address.longitude,tower:address.tower,flat_number:address.flat_number,landmark:address.landmark,scheduled_date:date,scheduled_start_time:time,scheduled_time:time,base_amount:serviceAmount,service_amount:serviceAmount,platform_fee:checkoutAmounts.platformFee,discount_amount:checkoutAmounts.discountAmount,tax_amount:checkoutAmounts.taxAmount,total_amount:checkoutAmounts.totalAmount,payment_method:paymentMethod,status:"pending",requires_supervisor:true};
  if(normalizedPromoCode)bookingValues.promo_code=normalizedPromoCode;
  const {data,error}=await db.from("bookings").insert(bookingValues).select("*").single();
  if(error?.code==="23505")return res.status(409).json({message:normalizedPromoCode?"This offer was already redeemed on another booking.":"This request was already saved. Retry to retrieve it."});if(error)throw error;
  res.status(201).json({booking:data});
 }catch(error){
  if (["PGRST204", "42703"].includes(error.code)) {
   console.error("Booking database schema is incomplete:", error.message);
   return next(Object.assign(new Error("Booking is temporarily unavailable because a database update is required. Please contact support."), {status:503}));
  }
  if (error.code === "22P02" && /enum booking_status/i.test(error.message || "") && /booking_update/i.test(error.message || "")) {
   console.error("Booking status trigger configuration is invalid:", error.message);
   return next(Object.assign(new Error("Booking is temporarily unavailable because the database booking-status trigger needs repair. Please contact support."), {status:503}));
  }
  next(error);
 }
}

async function resolveMonthlyPlan(packageId, vehicleType) {
 const normalized=normalizePackageType(String(vehicleType||""));
 const category=normalized.includes("luxury")||normalized.includes("large")?"luxury":normalized.includes("hatch")||normalized==="compact"?"hatchback":normalized.includes("sedan")?"sedan":["suv","muv","mpv","crossover"].some(token=>normalized.includes(token))?"suv":normalized;
 const prices=monthlyPrices[category];if(!prices)return null;
 const tiers=monthlyTiers.map(tier=>tier.washes);
 // Monthly IDs include the service ID in their digest; find the active wash service first.
 const {data:services,error:serviceError}=await db.from("services").select("id,name").eq("is_active",true).ilike("name","%wash%").order("name");
 if(serviceError)throw serviceError;
 const serviceId=(services||[]).find(service=>normalizePackageType(service.name)==="exterior wash")?.id||services?.[0]?.id;
 if(!serviceId)return null;
 const tierIndex=tiers.findIndex(washes=>packageId===`monthly-${createHash("sha256").update(`${serviceId}:${category}:${washes}`).digest("hex").slice(0,32)}`);
 if(tierIndex<0)return null;
 const {data:catalog,error}=await db.from("service_packages").select(packageFields).eq("service_id",serviceId).eq("is_active",true).order("price",{ascending:true});
 if(error)throw error;
 const template=(catalog||[]).find(item=>monthlyTiers.some(tier=>normalizePackageType(item.name||"").startsWith(normalizePackageType(tier.name))))||(catalog||[])[0];
 if(!template)return null;
 const tier=monthlyTiers[tierIndex];
 return {id:packageId,catalogId:template.id,name:`${tier.name} - ${category}`,price:prices[tierIndex],vehicle_type:vehicleType,plan_washes:tier.washes};
}
