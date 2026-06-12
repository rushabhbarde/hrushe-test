const express = require("express");
const { subscribeToNewsletter } = require("../controllers/newsletterController");
const { createRateLimiter } = require("../middleware/rateLimitMiddleware");

const router = express.Router();

router.post(
  "/subscribe",
  createRateLimiter({ name: "newsletter", max: 8, windowMs: 60 * 60 * 1000 }),
  subscribeToNewsletter
);

module.exports = router;
