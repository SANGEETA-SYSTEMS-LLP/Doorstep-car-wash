import { supabaseAdmin as db } from "../../config/supabase.js";
import { validWasherLocation, nearbyWasherCards } from "../../services/washer/washerLocationService.js";
import { calculateDistanceKm } from "../../utils/distance.js";
async function owner(req) {
  if (req.profile.role !== "washer") throw Object.assign(new Error("Washer access required."), {status:403});
  const {data,error} = await db.from("washers").select("id,current_address,is_active").eq("user_id",req.user.id).maybeSingle();
  if(error) throw error;
  if(!data?.is_active) throw Object.assign(new Error("Active washer profile required."),{status:403});
  return data;
}
export async function getProfileLocation(req,res,next) {
  try {
    const washer=await owner(req);
    const {data,error}=await db.from("washer_locations").select("latitude,longitude,service_latitude,service_longitude,updated_at").eq("washer_id",washer.id).maybeSingle();
    if(error) throw error;
    res.json({location:{address:washer.current_address || "",...data,latitude:data?.service_latitude ?? data?.latitude,longitude:data?.service_longitude ?? data?.longitude}});
  }catch(error){next(error);}
}
export async function saveProfileLocation(req,res,next) {
  try {
    const washer=await owner(req);
    if(!validWasherLocation(req.body)) return res.status(400).json({message:"Select a map location and enter a complete address (10–500 characters)."});
    const {latitude,longitude,address}=req.body;
    const result=await db.from("washer_locations").upsert({washer_id:washer.id,latitude,longitude,service_latitude:latitude,service_longitude:longitude,updated_at:new Date().toISOString()},{onConflict:"washer_id"});
    if(result.error) throw result.error;
    const update=await db.from("washers").update({current_address:address.trim()}).eq("id",washer.id);
    if(update.error) throw update.error;
    res.json({success:true,location:{latitude,longitude,address:address.trim()}});
  }catch(error){next(error);}
}
export async function getNearbyWashers(req,res,next) {
  try {
    const {latitude,longitude}=req.query;
    if(typeof latitude!=="string" || typeof longitude!=="string" || calculateDistanceKm(latitude,longitude,latitude,longitude)===null) return res.status(400).json({message:"Select a valid booking location."});
    const rows=[];
    for(let offset=0;;offset+=1000){
      const {data,error}=await db.from("washers").select("id,user_id,rating,jobs_completed,status,is_active,is_verified,service_radius_km,location:washer_locations(latitude,longitude,updated_at)")
        .eq("is_active",true).eq("is_verified",true).order("id").range(offset,offset+999);
      if(error) throw error; rows.push(...(data||[]));if(!data || data.length<1000)break;
    }
    const cards=nearbyWasherCards(rows,Number(latitude),Number(longitude));
    if(!cards.length)return res.json({washers:[]});
    const profiles=await db.from("profiles").select("id,full_name").in("id",cards.map(card=>card.userId)).eq("is_active",true);
    if(profiles.error) throw profiles.error;
    const names=new Map((profiles.data||[]).map(p=>[p.id,p.full_name]));
    res.json({washers:cards.filter(card=>names.has(card.userId)).map(({userId,...card})=>({...card,name:names.get(userId)||"Washer"}))});
  }catch(error){next(error);}
}
