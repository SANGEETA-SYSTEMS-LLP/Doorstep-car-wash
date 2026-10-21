import express from "express";

import {
  requireAuth,
} from "../../middleware/authMiddleware.js";

import {
  allowRoles,
} from "../../middleware/roleMiddleware.js";

import {
  createReview,
  skipReview,
} from "../../controllers/reviews/reviewController.js";

const router =
  express.Router();

router.use(
  requireAuth,
  allowRoles("customer")
);

router.post(
  "/bookings/:bookingId",
  createReview
);

router.post(
  "/bookings/:bookingId/skip",
  skipReview
);

export default router;
