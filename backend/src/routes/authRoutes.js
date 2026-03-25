const express = require("express");
const {
  signup,
  login,
  me,
  updateMe,
  changePassword,
  logout,
  requestPasswordResetOtp,
  requestSignupOtp,
  resetPasswordWithOtp,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/signup/request-otp", requestSignupOtp);
router.post("/forgot-password/request-otp", requestPasswordResetOtp);
router.post("/forgot-password/reset", resetPasswordWithOtp);
router.get("/me", protect, me);
router.put("/me", protect, updateMe);
router.put("/change-password", protect, changePassword);
router.post("/logout", logout);

module.exports = router;
