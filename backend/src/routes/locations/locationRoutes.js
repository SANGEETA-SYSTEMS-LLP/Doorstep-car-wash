import { searchPlaces, reversePlace, drivingRoute } from "../../services/maps/openMapService.js";
import express from "express";
import { requireAuth } from "../../middleware/authMiddleware.js";
import { getCoverage } from "../../services/coverage/coverageService.js";
import { publicLookupRateLimit } from "../../middleware/rateLimitMiddleware.js";

const router = express.Router();
router.get("/coverage", requireAuth, async (req, res) => {
  const { latitude, longitude } = req.query;
  if (typeof latitude !== "string" || typeof longitude !== "string" || !latitude.trim() || !longitude.trim() ||
      !Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude)) ||
      Math.abs(Number(latitude)) > 90 || Math.abs(Number(longitude)) > 180) {
    return res.status(400).json({ message: "Valid latitude and longitude are required." });
  }
  try {
    const coverage = await getCoverage(Number(latitude), Number(longitude));
    return res.json({ success: true, ...coverage });
  } catch (error) {
    console.error("Service coverage unavailable:", {
      name: typeof error.name === "string" ? error.name : "Error",
      code: typeof error.code === "string" ? error.code : undefined,
    });
    return res.status(500).json({ message: "Unable to check service coverage." });
  }
});
function coordinate(value,max) { return typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)) && Math.abs(Number(value))<=max; }
router.get("/search",publicLookupRateLimit,async(req,res)=>{
 if(typeof req.query.q!=="string" || req.query.q.trim().length<3 || req.query.q.length>250)return res.status(400).json({message:"Enter a street or area (3–250 characters)."});
 try { res.json(await searchPlaces(req.query.q.trim())); }catch(error){res.status(error.status||502).json({message:error.message});}
});
router.get("/reverse",publicLookupRateLimit,async(req,res)=>{
 const {lat,lon}=req.query;
 if(!coordinate(lat,90)||!coordinate(lon,180))return res.status(400).json({message:"Valid coordinates are required."});
 try {res.json(await reversePlace(lat,lon));}catch(error){res.status(error.status||502).json({message:error.message});}
});
router.get("/route",requireAuth,async(req,res)=>{
 const {fromLat,fromLon,toLat,toLon}=req.query;
 if(!coordinate(fromLat,90)||!coordinate(fromLon,180)||!coordinate(toLat,90)||!coordinate(toLon,180))return res.status(400).json({message:"Valid route coordinates are required."});
 try {res.json(await drivingRoute(fromLat,fromLon,toLat,toLon));}catch(error){res.status(error.status||502).json({message:error.message});}
});
export default router;
