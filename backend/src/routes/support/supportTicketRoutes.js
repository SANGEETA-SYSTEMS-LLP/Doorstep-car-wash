import express from "express";
import { createMyTicket, listMyTickets, listSupportTickets, updateSupportTicket } from "../../controllers/support/supportTicketController.js";
import { requireAuth } from "../../middleware/authMiddleware.js";
import { allowRoles } from "../../middleware/roleMiddleware.js";
import { adminMutationRateLimit } from "../../middleware/rateLimitMiddleware.js";

const router = express.Router();

router.use(requireAuth);
router.get("/my", listMyTickets);
router.post("/my", adminMutationRateLimit, createMyTicket);

router.get(
  "/",
  allowRoles("support", "supervisor", "sub_admin", "super_admin"),
  listSupportTickets,
);
router.patch(
  "/:ticketId",
  adminMutationRateLimit,
  allowRoles("support", "supervisor", "sub_admin", "super_admin"),
  updateSupportTicket,
);

export default router;
