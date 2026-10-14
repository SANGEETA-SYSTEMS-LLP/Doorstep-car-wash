import express from "express";

import {
  requireAuth,
} from "../middleware/authMiddleware.js";

import {
  allowRoles,
} from "../middleware/roleMiddleware.js";

import {
  startAssignment,
  rejectAssignment,
  calculateAcceptedAssignmentEarning,
} from "../controllers/assignmentController.js";

const router =
  express.Router();

router.post(
  "/bookings/:bookingId/assign",
  requireAuth,
  allowRoles("customer"),
  startAssignment
);

router.post(
  "/assignments/:assignmentId/reject",
  requireAuth,
  allowRoles("washer"),
  rejectAssignment
);

router.post(
  "/assignments/:assignmentId/earning",
  requireAuth,
  allowRoles("washer"),
  calculateAcceptedAssignmentEarning
);

export default router;