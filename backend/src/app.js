import financeRoutes from "./routes/financeRoutes.js";
import washerSignupRoutes from "./routes/washerSignupRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import express from "express";
import accountRoutes from "./routes/accountRoutes.js";
import cors from "cors";

import assignmentRoutes from "./routes/assignmentRoutes.js";
import washerJobRoutes from "./routes/washerJobRoutes.js";
import customerBookingRoutes from "./routes/customerBookingRoutes.js";
import customerProfileRoutes from "./routes/customerProfileRoutes.js";
import supervisorRoutes from "./routes/supervisorRoutes.js";
import paymentRoutes
  from "./routes/paymentRoutes.js";
import reviewRoutes
  from "./routes/reviewRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import accountantRoutes from "./routes/accountantRoutes.js";
import supportTicketRoutes from "./routes/supportTicketRoutes.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";
import {
  razorpayWebhook,
} from "./controllers/paymentController.js";
const app =
  express();

function configuredFrontendOrigins() {
  const configured = (process.env.FRONTEND_URL || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

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
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  next();
});

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
    credentials: true,
  })
);

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
