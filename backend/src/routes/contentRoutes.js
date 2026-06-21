const express = require("express");
const {
  getHomepageBanner,
  getPublicWebsiteSettings,
  updateHomepageBanner,
  getAdminWorkspace,
  updateAdminWorkspace,
} = require("../controllers/contentController");
const {
  protect,
  adminOnly,
  requireAdminPermission,
} = require("../middleware/authMiddleware");
const { requireCsrf } = require("../middleware/csrfMiddleware");

const router = express.Router();

router.get("/homepage", getHomepageBanner);
router.get("/settings", getPublicWebsiteSettings);
router.put("/homepage", protect, requireCsrf, requireAdminPermission("home.manage"), updateHomepageBanner);
router.get("/admin-workspace", protect, adminOnly, getAdminWorkspace);
router.put("/admin-workspace", protect, requireCsrf, adminOnly, updateAdminWorkspace);

module.exports = router;
