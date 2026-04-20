const express = require("express");
const {
  getSupportRequests,
  getSupportRequestById,
  updateSupportRequest,
} = require("../controllers/supportController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, adminOnly);

router.get("/requests", getSupportRequests);
router.get("/requests/:id", getSupportRequestById);
router.put("/requests/:id", updateSupportRequest);

module.exports = router;
