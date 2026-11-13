import express from "express";
import { getCustomerPaymentOptions } from "../../controllers/customers/customerPaymentOptionsController.js";

import {
  requireAuth,
} from "../../middleware/authMiddleware.js";

import {
  allowRoles,
} from "../../middleware/roleMiddleware.js";

import {
  createPaymentOrder,
  verifyPayment,
} from "../../controllers/payments/paymentController.js";

import { paymentActionRateLimit } from "../../middleware/rateLimitMiddleware.js";

const router =
  express.Router();
router.get("/bookings/:bookingId/options", requireAuth, allowRoles("customer"), getCustomerPaymentOptions);

router.post(
  "/bookings/:bookingId/order",
  requireAuth,
  allowRoles("customer"),
  paymentActionRateLimit,
  createPaymentOrder
);

router.post(
  "/verify",
  requireAuth,
  allowRoles("customer"),
  paymentActionRateLimit,
  verifyPayment
);

export default router;
