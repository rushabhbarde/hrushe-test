const express = require("express");
const {
  getSupportRequests,
  getSupportRequestById,
  updateSupportRequest,
} = require("../controllers/supportController");
const {
  protect,
  adminOnly,
  requireAdminPermission,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, adminOnly);

router.get("/requests", requireAdminPermission("support.manage"), getSupportRequests);
router.get("/requests/:id", requireAdminPermission("support.manage"), getSupportRequestById);
router.put("/requests/:id", requireAdminPermission("support.manage"), updateSupportRequest);

module.exports = router;
