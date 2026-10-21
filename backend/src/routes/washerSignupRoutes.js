import express from "express";
import { syncWasherSignup } from "../controllers/washerSignupController.js";

const router = express.Router();
router.post("/washer-signup", syncWasherSignup);
export default router;
