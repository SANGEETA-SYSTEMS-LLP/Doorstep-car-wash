import { getOperations } from "../controllers/operationsController.js";
import express from "express";

import {
  requireAuth,
} from "../middleware/authMiddleware.js";

import {
  allowRoles,
} from "../middleware/roleMiddleware.js";

import {
  getSupervisorDashboard,
  getActiveJobs,
  getEscalations,
  getPendingExtraCharges,
  reviewExtraCharge,
  getSupervisorJobDetails,
  assignSupervisorWasher,
} from "../controllers/supervisorController.js";
import { validateService } from "../controllers/serviceValidationController.js";

const router =
  express.Router();

router.use(
  requireAuth,
  allowRoles(
    "supervisor",
    "sub_admin",
    "super_admin"
  )
);

router.get(
  "/dashboard",
  getSupervisorDashboard
);

router.get(
  "/active-jobs",
  getActiveJobs
);

router.get(
  "/jobs",
  getActiveJobs
);

router.get(
  "/jobs/:bookingId",
  getSupervisorJobDetails
);

router.get(
  "/escalations",
  getEscalations
);

router.post(
  "/escalations/:bookingId/assign",
  assignSupervisorWasher
);

router.post(
  "/jobs/:bookingId/assign",
  assignSupervisorWasher
);

router.post(
  "/jobs/:bookingId/validate",
  validateService
);

router.get(
  "/extra-charges",
  getPendingExtraCharges
);

router.patch(
  "/extra-charges/:requestId",
  reviewExtraCharge
);

router.get("/operations", getOperations);
export default router;