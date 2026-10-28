import { addSupervisorWasher, linkSupervisorWasher } from "../../controllers/supervisor/supervisorWasherController.js";
import { listWasherReviews, verifyWasher } from "../../controllers/supervisor/supervisorWasherReviewController.js";
import { getSupervisorWasherRoster } from "../../controllers/supervisor/supervisorWasherRosterController.js";
import { acceptSupervisorBooking } from "../../controllers/supervisor/supervisorController.js";
import { getOperations } from "../../controllers/operations/operationsController.js";
import express from "express";

import {
  requireAuth,
} from "../../middleware/authMiddleware.js";

import {
  allowRoles,
} from "../../middleware/roleMiddleware.js";

import {
  getSupervisorDashboard,
  getActiveJobs,
  getEscalations,
  getPendingExtraCharges,
  reviewExtraCharge,
  getSupervisorJobDetails,
  assignSupervisorWasher,
} from "../../controllers/supervisor/supervisorController.js";
import { validateService } from "../../controllers/serviceOperations/serviceValidationController.js";
import { getSupervisorServiceArea, saveSupervisorServiceArea } from "../../controllers/supervisor/supervisorServiceAreaController.js";
import { requireSupervisorServiceArea } from "../../services/supervisor/supervisorServiceArea.js";

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

router.get("/service-area", getSupervisorServiceArea);
router.put("/service-area", saveSupervisorServiceArea);
router.use(requireSupervisorServiceArea);

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

router.post("/jobs/:bookingId/accept", acceptSupervisorBooking);
router.get("/operations", getOperations);
router.get("/washer-roster", getSupervisorWasherRoster);
router.post("/washers", addSupervisorWasher);
router.post("/washers/link", linkSupervisorWasher);
router.get("/washers/review", listWasherReviews);
router.patch("/washers/:washerId/verify", verifyWasher);
export default router;
