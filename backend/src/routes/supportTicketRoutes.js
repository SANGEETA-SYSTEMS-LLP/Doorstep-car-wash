import express from "express";
import { createMyTicket, listMyTickets, listSupportTickets, updateSupportTicket } from "../controllers/supportTicketController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(requireAuth);
router.get("/my", listMyTickets);
router.post("/my", createMyTicket);

router.get(
  "/",
  allowRoles("support", "supervisor", "sub_admin", "super_admin"),
  listSupportTickets,
);
router.patch(
  "/:ticketId",
  allowRoles("support", "supervisor", "sub_admin", "super_admin"),
  updateSupportTicket,
);

export default router;
