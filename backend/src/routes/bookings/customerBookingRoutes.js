import { createBooking } from "../../controllers/bookings/bookingController.js";
import express from "express";

import {
  requireAuth,
} from "../../middleware/authMiddleware.js";

import {
  allowRoles,
} from "../../middleware/roleMiddleware.js";

import {
  getCustomerBookingDetails,
  getCustomerBookingByNumber,
  getTrackingWasherLocation,
  getPendingExtraCharges,
  respondExtraCharge,
  getServicePhotos,
  confirmService,
} from "../../controllers/customers/bookings/customerBookingController.js";
import { cancelCustomerBooking } from "../../controllers/customers/bookingCancellationController.js";
import { listCustomerNotifications, markCustomerNotificationRead } from "../../controllers/customers/customerNotificationController.js";

const router =
  express.Router();

router.get("/notifications", requireAuth, allowRoles("customer"), listCustomerNotifications);
router.patch("/notifications/:notificationId/read", requireAuth, allowRoles("customer"), markCustomerNotificationRead);

router.get(
  "/bookings/by-number/:bookingNumber",
  requireAuth,
  allowRoles("customer"),
  getCustomerBookingByNumber
);

router.get(
  "/bookings/:bookingId/details",
  requireAuth,
  allowRoles("customer"),
  getCustomerBookingDetails
);

router.get(
  "/bookings/:bookingId/washer-location",
  requireAuth,
  allowRoles("customer"),
  getTrackingWasherLocation
);

router.post(
  "/bookings/:bookingId/cancel",
  requireAuth,
  allowRoles("customer"),
  cancelCustomerBooking
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
