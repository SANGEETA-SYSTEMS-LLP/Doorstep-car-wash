import financeRoutes from "./routes/finance/financeRoutes.js";
import washerSignupRoutes from "./routes/washer/washerSignupRoutes.js";
import locationRoutes from "./routes/locations/locationRoutes.js";
import express from "express";
import accountRoutes from "./routes/accounts/accountRoutes.js";
import cors from "cors";
import helmet from "helmet";
import { apiRateLimit } from "./middleware/rateLimitMiddleware.js";
import { requestLogger } from "./middleware/requestLogger.js";
import telemetryRoutes from "./routes/telemetry/telemetryRoutes.js";

import assignmentRoutes from "./routes/assignments/assignmentRoutes.js";
import washerJobRoutes from "./routes/washer/washerJobRoutes.js";
import customerBookingRoutes from "./routes/bookings/customerBookingRoutes.js";
import customerProfileRoutes from "./routes/customers/customerProfileRoutes.js";
import supervisorRoutes from "./routes/supervisor/supervisorRoutes.js";
import paymentRoutes
  from "./routes/payments/paymentRoutes.js";
import reviewRoutes
  from "./routes/reviews/reviewRoutes.js";
import adminRoutes from "./routes/admin/adminRoutes.js";
import accountantRoutes from "./routes/accounts/accountantRoutes.js";
import supportTicketRoutes from "./routes/support/supportTicketRoutes.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";
import {
  razorpayWebhook,
} from "./controllers/payments/paymentController.js";
const app =
  express();

const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS || 0);
if (!Number.isSafeInteger(trustProxyHops) || trustProxyHops < 0 || trustProxyHops > 10) {
  throw new Error("TRUST_PROXY_HOPS must be an integer from 0 to 10.");
}
app.set("trust proxy", trustProxyHops);

function configuredFrontendOrigins() {
  const configured = (process.env.FRONTEND_URL || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  // Vercel provides the deployment hostname at runtime. FRONTEND_URL can add
  // custom domains when the deployment uses one.
  if (process.env.VERCEL_URL) {
    configured.push(`https://${process.env.VERCEL_URL}`);
  }

  // Local development remains convenient, while production only trusts explicitly
  // configured origins. Never interpret an absent setting as "allow every site".
  if (process.env.NODE_ENV !== "production") {
    configured.push("http://localhost:5173", "http://127.0.0.1:5173");
  }

  return new Set(configured.map((value) => {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
      throw new Error("FRONTEND_URL must contain trusted http(s) origins.");
    }
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
      throw new Error("Production FRONTEND_URL entries must use HTTPS.");
    }
    if (url.pathname !== "/" || url.search || url.hash) {
      throw new Error("FRONTEND_URL entries must be origins without a path, query, or fragment.");
    }
    return url.origin;
  }));
}

const allowedFrontendOrigins = configuredFrontendOrigins();
if (process.env.NODE_ENV === "production" && allowedFrontendOrigins.size === 0) {
  throw new Error("Set FRONTEND_URL to the trusted production frontend origin before starting the API.");
}

app.disable("x-powered-by");
app.use(requestLogger);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'", "https://api.razorpay.com"],
      scriptSrc: ["'self'", "https://checkout.razorpay.com", "https://maps.googleapis.com", "https://maps.gstatic.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://*.supabase.co", "https://*.googleapis.com", "https://*.gstatic.com", "https://tile.openstreetmap.org", "https://*.tile.openstreetmap.org", "https://*.razorpay.com"],
      connectSrc: ["'self'", "https://*.supabase.co", "wss://*.supabase.co", "https://api.razorpay.com", "https://checkout.razorpay.com", "https://maps.googleapis.com", "https://maps.gstatic.com", "https://nominatim.openstreetmap.org", "https://*.tile.openstreetmap.org", "https://*.openstreetmap.org"],
      frameSrc: ["https://api.razorpay.com", "https://checkout.razorpay.com"],
      upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
    },
  },
  frameguard: { action: "deny" },
  hsts: process.env.NODE_ENV === "production"
    ? { maxAge: 31536000, includeSubDomains: true, preload: false }
    : false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "same-site" },
}));

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, false);
      let normalized;
      try {
        const parsed = new URL(origin);
        if (parsed.origin !== origin || parsed.username || parsed.password) return callback(null, false);
        normalized = parsed.origin;
      } catch { return callback(null, false); }
      return callback(null, allowedFrontendOrigins.has(normalized));
    },
  })
);

app.use("/api", apiRateLimit);

app.use("/api/telemetry", express.json({ limit: "2kb" }), telemetryRoutes);

app.post(
  "/api/payments/webhook",
  express.raw({
    type: "application/json",
    limit: "1mb",
  }),
  razorpayWebhook
);

app.use(
  express.json({ limit: "100kb" })
);

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      success: true,
      message:
        "Car Wash API is running",
    });
  }
);

app.use("/api/locations", locationRoutes);
app.use("/api/auth", washerSignupRoutes);
app.use( "/api", assignmentRoutes);
app.use("/api/washer", washerJobRoutes);
app.use("/api/customer", customerBookingRoutes);
app.use("/api/customer", customerProfileRoutes);
app.use("/api/supervisor", supervisorRoutes);
app.use(
  "/api/payments",
  paymentRoutes
);
app.use(
  "/api/reviews",
  reviewRoutes
);
app.use("/api/account", accountRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/accountant", accountantRoutes);
app.use("/api/support", supportTicketRoutes);
app.use("/api/finance", financeRoutes);
app.use(errorMiddleware);

export default app;
