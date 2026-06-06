const express = require("express");
const {
  createSupportTicket,
  getSupportRequests,
  getSupportRequestById,
  updateSupportRequest,
} = require("../controllers/supportController");
const {
  attachUserIfAuthenticated,
  protect,
  adminOnly,
  requireAdminPermission,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/tickets", attachUserIfAuthenticated, createSupportTicket);

router.use(protect, adminOnly);

router.get("/requests", requireAdminPermission("support.manage"), getSupportRequests);
router.get("/requests/:id", requireAdminPermission("support.manage"), getSupportRequestById);
router.put("/requests/:id", requireAdminPermission("support.manage"), updateSupportRequest);

module.exports = router;
