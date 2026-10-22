import express from "express";
import { syncWasherSignup } from "../../controllers/washer/washerSignupController.js";
import { paymentActionRateLimit } from "../../middleware/rateLimitMiddleware.js";

const router = express.Router();
router.post("/washer-signup", paymentActionRateLimit, syncWasherSignup);
export default router;
