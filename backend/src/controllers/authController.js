const bcrypt = require("bcrypt");
const User = require("../models/User");
const Cart = require("../models/Cart");
const env = require("../config/env");
const generateToken = require("../utils/generateToken");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { sendEmail } = require("../utils/mailer");
const { serializeUser } = require("../utils/serializeUser");
const {
  clearCsrfCookie,
  ensureCsrfCookie,
  setCsrfCookie,
} = require("../middleware/csrfMiddleware");
const { recordAuditLog } = require("../utils/auditLog");
const { logEvent } = require("../utils/logger");
const {
  buildOtpEmail,
  buildPasswordChangedEmail,
  buildWelcomeEmail,
} = require("../utils/emailTemplates");
const {
  OTP_EXPIRY_MINUTES,
  createOtpVerification,
  deleteOtpVerifications,
  normalizeEmail,
  verifyOtpCode,
} = require("../utils/otpVerification");
const { isValidIndianPhone, normalizeIndianPhone } = require("../utils/phone");

const PASSWORD_HASH_ROUNDS = 12;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateEmail = (email) => {
  if (!email || !EMAIL_PATTERN.test(email)) {
    throw new AppError("Enter a valid email address", 400);
  }
};

const validateIndianPhone = (phone) => {
  if (!isValidIndianPhone(phone)) {
    throw new AppError("Enter a valid 10-digit Indian phone number", 400);
  }
};

const validatePasswordStrength = (password, label = "Password") => {
  const value = String(password || "");

  if (value.length < 8) {
    throw new AppError(`${label} must be at least 8 characters long`, 400);
  }

  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    throw new AppError(`${label} must include at least one letter and one number`, 400);
  }
};

const logEmailFailure = (label, error) => {
  logEvent("email.delivery.failed", {
    label,
    message: error?.message,
    code: error?.code,
    response: error?.response,
    responseCode: error?.responseCode,
    command: error?.command,
  }, "error");
};

const cookieOptions = {
  sameSite: env.COOKIE_SAME_SITE,
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

const sendAuthResponse = (req, res, user, message, statusCode = 200, recordLogin = true) => {
  const token = generateToken(user);

  res.cookie("token", token, cookieOptions);
  setCsrfCookie(res);

  if (recordLogin && user.role === "admin") {
    req.user = user;
    void recordAuditLog(req, "admin.login", { type: "user", id: user._id });
  }

  return res.status(statusCode).json({
    message,
    user: serializeUser(user),
  });
};

const signup = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address, otp } = req.body;

  if (!name || !email || !phone || !password || !otp) {
    throw new AppError("Name, email, phone, password, and OTP are required", 400);
  }

  const normalizedName = String(name).trim();
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizeIndianPhone(phone);

  if (normalizedName.length < 2) {
    throw new AppError("Full name must be at least 2 characters long", 400);
  }

  validateEmail(normalizedEmail);
  validateIndianPhone(normalizedPhone);

  validatePasswordStrength(password);

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError("User already exists", 409);
  }

  const existingPhoneUser = await User.findOne({ phone: normalizedPhone });
  if (existingPhoneUser) {
    throw new AppError("Phone number is already in use", 409);
  }

  await verifyOtpCode({
    email: normalizedEmail,
    purpose: "signup",
    otp,
  });

  const hashedPassword = await bcrypt.hash(password, PASSWORD_HASH_ROUNDS);
  const user = await User.create({
    name: normalizedName,
    email: normalizedEmail,
    password: hashedPassword,
    phone: normalizedPhone,
    address,
    isVerified: true,
    emailVerifiedAt: new Date(),
    lastLoginAt: new Date(),
  });

  await deleteOtpVerifications({ email: normalizedEmail, purpose: "signup" });
  await Cart.create({ userId: user._id, items: [] });

  try {
    const delivery = await sendEmail({
      to: normalizedEmail,
      subject: "Welcome to HRUSHE",
      html: buildWelcomeEmail({
        name: normalizedName,
      }),
      templateKey: env.ZEPTOMAIL_TEMPLATE_WELCOME || undefined,
      mergeInfo: {
        name: normalizedName,
        email: normalizedEmail,
      },
    });
    if (!delivery.delivered) {
      logEmailFailure("Welcome", new Error(delivery.reason || "Mail delivery failed"));
    }
  } catch (error) {
    logEmailFailure("Welcome", error);
  }

  return sendAuthResponse(req, res, user, "User created successfully", 201);
});

const login = asyncHandler(async (req, res) => {
  const { email, phone, identifier, password, username } = req.body;
  const loginIdentifier = (identifier || email || phone || username || "").trim();

  if (!loginIdentifier || !password) {
    throw new AppError("Email or phone and password are required", 400);
  }

  const isEmailLogin = loginIdentifier.includes("@");
  const user = await User.findOne(
    isEmailLogin
      ? { email: loginIdentifier.toLowerCase() }
      : { phone: normalizeIndianPhone(loginIdentifier) }
  );
  if (!user || user.role === "admin") {
    throw new AppError("Invalid credentials", 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError("Invalid credentials", 401);
  }

  if (user.isVerified === false) {
    // Older customer accounts were created before email verification became mandatory.
    // If the password matches for an existing stored account, upgrade it so real users
    // are not locked out after the auth hardening rollout.
    user.isVerified = true;
    user.emailVerifiedAt = user.emailVerifiedAt || new Date();
  }

  user.lastLoginAt = new Date();
  await user.save();

  return sendAuthResponse(req, res, user, "Login successful");
});

const adminLogin = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email || req.body.identifier);
  const password = String(req.body.password || "");

  if (!email || !password) {
    throw new AppError("Admin email and password are required", 400);
  }

  validateEmail(email);
  const user = await User.findOne({ email, role: "admin" });
  const isMatch = user ? await bcrypt.compare(password, user.password) : false;

  if (!user || !isMatch || user.isVerified === false) {
    throw new AppError("Invalid admin credentials", 401);
  }

  user.lastLoginAt = new Date();
  await user.save();
  return sendAuthResponse(req, res, user, "Admin login successful");
});

const me = asyncHandler(async (req, res) => {
  ensureCsrfCookie(req, res);
  return res.json({ user: serializeUser(req.user) });
});

const updateMe = asyncHandler(async (req, res) => {
  const { name, email, phone, address } = req.body;

  if (!name || !email || !phone) {
    throw new AppError("Name, email, and phone are required", 400);
  }

  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizeIndianPhone(phone);

  validateEmail(normalizedEmail);
  validateIndianPhone(normalizedPhone);

  if (normalizedEmail !== normalizeEmail(req.user.email)) {
    throw new AppError("Email changes require OTP verification.", 400);
  }

  const existingPhoneUser = await User.findOne({
    phone: normalizedPhone,
    _id: { $ne: req.user._id },
  });

  if (existingPhoneUser) {
    throw new AppError("Phone number is already in use", 409);
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      name: name.trim(),
      phone: normalizedPhone,
      address: (address || "").trim(),
    },
    {
      new: true,
      runValidators: true,
    }
  ).select("-password");

  return res.json({
    message: "Profile updated successfully",
    user: serializeUser(updatedUser),
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const currentPassword = String(req.body.currentPassword || "");
  const newPassword = String(req.body.newPassword || "");

  if (!currentPassword || !newPassword) {
    throw new AppError("Current password and new password are required", 400);
  }

  validatePasswordStrength(newPassword, "New password");

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);

  if (!isMatch) {
    throw new AppError("Current password is incorrect", 400);
  }

  user.password = await bcrypt.hash(newPassword, PASSWORD_HASH_ROUNDS);
  user.tokenVersion = Number(user.tokenVersion || 0) + 1;
  await user.save();

  try {
    const delivery = await sendEmail({
      to: user.email,
      subject: "Your HRUSHE password was changed",
      html: buildPasswordChangedEmail({
        name: user.name,
        email: user.email,
      }),
      templateKey: env.ZEPTOMAIL_TEMPLATE_PASSWORD_CHANGED || undefined,
      mergeInfo: {
        name: user.name,
        email: user.email,
      },
    });
    if (!delivery.delivered) {
      logEmailFailure(
        "Password change",
        new Error(delivery.reason || "Mail delivery failed")
      );
    }
  } catch (error) {
    logEmailFailure("Password change", error);
  }

  return sendAuthResponse(req, res, user, "Password changed successfully", 200, false);
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token", cookieOptions);
  clearCsrfCookie(res);
  return res.json({ message: "Logged out" });
});

const requestPasswordResetOtp = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);

  if (!email) {
    throw new AppError("Email is required", 400);
  }

  validateEmail(email);

  const user = await User.findOne({ email });

  if (!user) {
    return res.json({
      message: "If an account exists, a password reset OTP has been sent.",
      expiresInMinutes: OTP_EXPIRY_MINUTES,
    });
  }

  const { otp, expiresInMinutes } = await createOtpVerification({
    email,
    purpose: "password-reset",
    userId: user._id,
  });

  let delivery;
  try {
    delivery = await sendEmail({
      to: email,
      subject: "Your HRUSHE password reset OTP",
      html: buildOtpEmail({
        purpose: "password-reset",
        otp,
        expiryMinutes: expiresInMinutes,
        email,
      }),
      templateKey: env.ZEPTOMAIL_TEMPLATE_PASSWORD_RESET_OTP || undefined,
      mergeInfo: {
        otp,
        email,
        expiry_minutes: expiresInMinutes,
        expiryMinutes: expiresInMinutes,
      },
    });
  } catch (error) {
    logEmailFailure("Password reset OTP", error);
    await deleteOtpVerifications({ email, purpose: "password-reset", userId: user._id });
    throw new AppError(
      "OTP email could not be sent. Please check mail settings and try again.",
      502
    );
  }

  if (!delivery.delivered) {
    logEmailFailure(
      "Password reset OTP",
      new Error(delivery.reason || "Mail delivery failed")
    );
    await deleteOtpVerifications({ email, purpose: "password-reset", userId: user._id });
    throw new AppError(
      "OTP email could not be sent. Please check mail settings and try again.",
      502
    );
  }

  const response = {
    message: "If an account exists, a password reset OTP has been sent.",
    expiresInMinutes: expiresInMinutes,
    deliveryMethod: delivery.delivered ? "email" : "dev",
  };

  if (env.OTP_DEV_MODE) {
    response.devOtp = otp;
  }

  return res.json(response);
});

const requestSignupOtp = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);

  if (!email) {
    throw new AppError("Email is required", 400);
  }

  validateEmail(email);

  const existingEmailUser = await User.findOne({ email });

  if (existingEmailUser) {
    throw new AppError("Email is already in use", 409);
  }

  const { otp, expiresInMinutes } = await createOtpVerification({
    email,
    purpose: "signup",
  });

  let delivery;
  try {
    delivery = await sendEmail({
      to: email,
      subject: "Your HRUSHE signup OTP",
      html: buildOtpEmail({
        purpose: "signup",
        otp,
        expiryMinutes: expiresInMinutes,
        email,
      }),
      templateKey: env.ZEPTOMAIL_TEMPLATE_SIGNUP_OTP || undefined,
      mergeInfo: {
        otp,
        email,
        expiry_minutes: expiresInMinutes,
        expiryMinutes: expiresInMinutes,
      },
    });
  } catch (error) {
    logEmailFailure("Signup OTP", error);
    await deleteOtpVerifications({ email, purpose: "signup" });
    throw new AppError(
      "OTP email could not be sent. Please check mail settings and try again.",
      502
    );
  }

  if (!delivery.delivered) {
    logEmailFailure("Signup OTP", new Error(delivery.reason || "Mail delivery failed"));
    await deleteOtpVerifications({ email, purpose: "signup" });
    throw new AppError(
      "OTP email could not be sent. Please check mail settings and try again.",
      502
    );
  }

  const response = {
    message: "Signup OTP sent successfully",
    expiresInMinutes: expiresInMinutes,
    deliveryMethod: delivery.delivered ? "email" : "dev",
  };

  if (env.OTP_DEV_MODE) {
    response.devOtp = otp;
  }

  return res.json(response);
});

const resetPasswordWithOtp = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const otp = String(req.body.otp || "").trim();
  const newPassword = String(req.body.newPassword || "");

  if (!email || !otp || !newPassword) {
    throw new AppError("Email, OTP, and new password are required", 400);
  }

  validateEmail(email);
  validatePasswordStrength(newPassword);

  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError("OTP is invalid or expired. Please request a new one.", 400);
  }

  await verifyOtpCode({
    email,
    purpose: "password-reset",
    userId: user._id,
    otp,
  });

  user.password = await bcrypt.hash(newPassword, PASSWORD_HASH_ROUNDS);
  user.tokenVersion = Number(user.tokenVersion || 0) + 1;
  await user.save();
  await deleteOtpVerifications({ email, purpose: "password-reset", userId: user._id });

  return res.json({ message: "Password reset successful" });
});

module.exports = {
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
};
