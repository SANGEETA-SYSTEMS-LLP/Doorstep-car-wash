import express from "express";
import { getCustomerPaymentOptions } from "../controllers/customerPaymentOptionsController.js";

import {
  requireAuth,
} from "../middleware/authMiddleware.js";

import {
  allowRoles,
} from "../middleware/roleMiddleware.js";

import {
  createPaymentOrder,
  verifyPayment,
  recordCodPayment,
} from "../controllers/paymentController.js";

const router =
  express.Router();
router.get("/bookings/:bookingId/options", requireAuth, allowRoles("customer"), getCustomerPaymentOptions);

router.post(
  "/bookings/:bookingId/order",
  requireAuth,
  allowRoles("customer"),
  createPaymentOrder
);

router.post(
  "/verify",
  requireAuth,
  allowRoles("customer"),
  verifyPayment
);

router.post(
  "/bookings/:bookingId/cod",
  requireAuth,
  allowRoles("washer"),
  recordCodPayment
);

export default router;
