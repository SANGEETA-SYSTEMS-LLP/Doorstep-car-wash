import financeRoutes from "./routes/financeRoutes.js";
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

app.use(
  cors({
    origin:
      process.env.FRONTEND_URL,

    credentials: true,
  })
);

app.post(
  "/api/payments/webhook",
  express.raw({
    type: "application/json",
  }),
  razorpayWebhook
);

app.use(
  express.json()
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