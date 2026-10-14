import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { getAccount, updateAccount, myEarnings } from "../controllers/accountController.js";
const router = express.Router();
router.use(requireAuth);
router.get("/profile", getAccount);
router.patch("/profile", updateAccount);
router.get("/earnings", myEarnings);
export default router;
