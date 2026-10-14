import express from "express";
import { getMyCustomerProfile, updateMyCustomerProfile } from "../controllers/customerProfileController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(requireAuth, allowRoles("customer"));
router.get("/profile", getMyCustomerProfile);
router.patch("/profile", updateMyCustomerProfile);

export default router;
