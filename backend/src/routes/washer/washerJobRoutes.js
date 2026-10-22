import { getWorkspace, getJob, setAvailability } from "../../controllers/washer/washerWorkspaceController.js";
import express from "express";

import {
  requireAuth,
} from "../../middleware/authMiddleware.js";

import {
  allowRoles,
} from "../../middleware/roleMiddleware.js";

import {
  startJourney,
  updateLocation,
  markArrived,
  verifyServiceOtp,
  startService,
  completeService,
} from "../../controllers/washer/jobs/washerJobController.js";

import { uploadServicePhotos, validateServicePhotoSignatures } from "../../middleware/uploadMiddleware.js";
import { uploadPhotos } from "../../controllers/serviceOperations/servicePhotoController.js";

import { getChecklist, updateChecklistItem } from "../../controllers/bookings/checklistController.js";

import { requestExtraCharge } from "../../controllers/serviceOperations/extraChargeController.js";
import { validateService } from "../../controllers/serviceOperations/serviceValidationController.js";
import { serviceOtpRateLimit } from "../../middleware/rateLimitMiddleware.js";

const router =
  express.Router();

router.use(
  requireAuth,
  allowRoles("washer")
);

router.get("/workspace", getWorkspace);
router.get("/bookings/:bookingId/details", getJob);
router.patch("/availability", setAvailability);

router.post(
  "/bookings/:bookingId/start-journey",
  startJourney
);

router.post(
  "/location",
  updateLocation
);

router.post(
  "/bookings/:bookingId/arrived",
  markArrived
);

router.post(
  "/bookings/:bookingId/verify-otp",
  serviceOtpRateLimit,
  verifyServiceOtp
);

router.post(
  "/bookings/:bookingId/start-service",
  startService
);

router.post(
  "/bookings/:bookingId/photos",
  uploadServicePhotos.array("photos", 5),
  validateServicePhotoSignatures,
  uploadPhotos
);

router.get(
  "/bookings/:bookingId/checklist",
  getChecklist
);

router.patch(
  "/bookings/:bookingId/checklist/:checklistId",
  updateChecklistItem
);

router.post(
  "/bookings/:bookingId/extra-charge",
  requestExtraCharge
);

router.post(
  "/bookings/:bookingId/complete-service",
  completeService
);

router.post(
  "/bookings/:bookingId/validate-service",
  validateService
);

export default router;
