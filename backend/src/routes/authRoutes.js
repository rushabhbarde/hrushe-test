const express = require("express");
const {
  signup,
  login,
  adminLogin,
  me,
  updateMe,
  changePassword,
  logout,
  requestPasswordResetOtp,
  requestSignupOtp,
  resetPasswordWithOtp,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { requireCsrf } = require("../middleware/csrfMiddleware");
const { createRateLimiter } = require("../middleware/rateLimitMiddleware");

const router = express.Router();

router.post(
  "/signup",
  createRateLimiter({ name: "signup", max: 10, windowMs: 60 * 60 * 1000 }),
  signup
);
router.post(
  "/login",
  createRateLimiter({ name: "login", max: 15, windowMs: 15 * 60 * 1000 }),
  login
);
router.post(
  "/admin-login",
  createRateLimiter({ name: "admin-login", max: 8, windowMs: 15 * 60 * 1000 }),
  adminLogin
);
router.post(
  "/signup/request-otp",
  createRateLimiter({ name: "signup-otp", max: 5, windowMs: 60 * 60 * 1000 }),
  requestSignupOtp
);
router.post(
  "/forgot-password/request-otp",
  createRateLimiter({ name: "password-otp", max: 5, windowMs: 60 * 60 * 1000 }),
  requestPasswordResetOtp
);
router.post(
  "/forgot-password/reset",
  createRateLimiter({ name: "password-reset", max: 8, windowMs: 60 * 60 * 1000 }),
  resetPasswordWithOtp
);
router.get("/me", protect, me);
router.put("/me", protect, requireCsrf, updateMe);
router.put("/change-password", protect, requireCsrf, changePassword);
router.post("/logout", requireCsrf, logout);

module.exports = router;
