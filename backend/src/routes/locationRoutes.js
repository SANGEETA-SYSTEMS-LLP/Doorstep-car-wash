import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { getCoverage } from "../services/coverageService.js";

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
    console.error("Service coverage:", error);
    return res.status(500).json({ message: "Unable to check service coverage." });
  }
});
export default router;
