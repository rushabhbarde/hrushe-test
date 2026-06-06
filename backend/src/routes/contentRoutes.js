const express = require("express");
const {
  getHomepageBanner,
  updateHomepageBanner,
  getAdminWorkspace,
  updateAdminWorkspace,
} = require("../controllers/contentController");
const {
  protect,
  adminOnly,
  requireAdminPermission,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/homepage", getHomepageBanner);
router.put("/homepage", protect, requireAdminPermission("home.manage"), updateHomepageBanner);
router.get("/admin-workspace", protect, adminOnly, getAdminWorkspace);
router.put("/admin-workspace", protect, adminOnly, updateAdminWorkspace);

module.exports = router;
