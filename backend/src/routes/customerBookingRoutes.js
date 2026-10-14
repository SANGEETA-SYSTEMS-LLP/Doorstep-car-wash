import { createBooking } from "../controllers/bookingController.js";
import express from "express";

import {
  requireAuth,
} from "../middleware/authMiddleware.js";

import {
  allowRoles,
} from "../middleware/roleMiddleware.js";

import {
  getServiceOtp,
  getPendingExtraCharges,
  respondExtraCharge,
  getServicePhotos,
  confirmService,
} from "../controllers/customerBookingController.js";

const router =
  express.Router();

router.get(
  "/bookings/:bookingId/service-otp",
  requireAuth,
  allowRoles("customer"),
  getServiceOtp
);

router.get(
  "/bookings/:bookingId/extra-charges",
  requireAuth,
  allowRoles("customer"),
  getPendingExtraCharges
);

router.patch(
  "/bookings/:bookingId/extra-charges/:requestId",
  requireAuth,
  allowRoles("customer"),
  respondExtraCharge
);

router.get(
  "/bookings/:bookingId/service-photos",
  requireAuth,
  allowRoles("customer"),
  getServicePhotos
);

router.post(
  "/bookings/:bookingId/confirm-service",
  requireAuth,
  allowRoles("customer"),
  confirmService
);

router.post("/bookings", requireAuth, allowRoles("customer"), createBooking);
export default router;