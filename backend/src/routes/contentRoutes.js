const express = require("express");
const {
  getHomepageBanner,
  updateHomepageBanner,
} = require("../controllers/contentController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/homepage", getHomepageBanner);
router.put("/homepage", protect, adminOnly, updateHomepageBanner);

module.exports = router;
