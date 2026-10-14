import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { listResource } from "../controllers/adminController.js";
const router = express.Router();
router.use(requireAuth, allowRoles("accountant", "sub_admin", "super_admin"));
router.get("/:resource", (req, res, next) => {
  if (!["payments", "earnings", "settlements"].includes(req.params.resource)) return res.status(404).json({ message: "Financial resource not found." });
  return listResource(req, res, next);
});
export default router;
