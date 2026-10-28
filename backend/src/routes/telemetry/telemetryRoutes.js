import express from "express";
import { pageViewRateLimit } from "../../middleware/rateLimitMiddleware.js";

const router = express.Router();

function normalizePagePath(value) {
  if (typeof value !== "string" || value.length > 300 || !value.startsWith("/") || value.startsWith("//")) return null;
  if (/[\r\n?#]/.test(value)) return null;
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, ":email")
    .replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ":id")
    .replace(/WSH-[0-9A-Z]{10,}/gi, ":washerId")
    .replace(/\/\d{6,}(?=\/|$)/g, "/:id")
    .replace(/\/[A-Za-z0-9_-]{24,}(?=\/|$)/g, "/:id");
}

router.post("/page-view", pageViewRateLimit, (req, res) => {
  const path = normalizePagePath(req.body?.path);
  if (!path) return res.status(400).json({ success: false, message: "Invalid page path." });

  console.info(JSON.stringify({
    event: "page_view",
    request_id: req.requestId,
    path,
  }));
  return res.status(202).json({ success: true });
});

export default router;
