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
const { requireCsrf, requireCsrfIfAuthenticated } = require("../middleware/csrfMiddleware");
const { createRateLimiter } = require("../middleware/rateLimitMiddleware");

const router = express.Router();

router.post(
  "/tickets",
  createRateLimiter({ name: "support-tickets", max: 10, windowMs: 60 * 60 * 1000 }),
  attachUserIfAuthenticated,
  requireCsrfIfAuthenticated,
  createSupportTicket
);

router.use(protect, adminOnly);

router.get("/requests", requireAdminPermission("support.manage"), getSupportRequests);
router.get("/requests/:id", requireAdminPermission("support.manage"), getSupportRequestById);
router.put("/requests/:id", requireCsrf, requireAdminPermission("support.manage"), updateSupportRequest);

module.exports = router;
