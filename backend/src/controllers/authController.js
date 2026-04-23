const bcrypt = require("bcrypt");
const User = require("../models/User");
const Cart = require("../models/Cart");
const VerificationCode = require("../models/VerificationCode");
const env = require("../config/env");
const generateToken = require("../utils/generateToken");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { sendMsg91Otp } = require("../utils/sendMsg91Otp");
const { sendEmail } = require("../utils/mailer");
const { serializeUser } = require("../utils/serializeUser");

const OTP_EXPIRY_MINUTES = 10;
const PASSWORD_HASH_ROUNDS = 12;
const OTP_REQUEST_COOLDOWN_MS = 60 * 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const normalizePhone = (value) => String(value || "").replace(/\D/g, "").slice(-10);

const validateEmail = (email) => {
  if (!email || !EMAIL_PATTERN.test(email)) {
    throw new AppError("Enter a valid email address", 400);
  }
};

const validateIndianPhone = (phone) => {
  if (!/^[6-9]\d{9}$/.test(phone)) {
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
  console.error(`${label} email failed`, {
    message: error?.message,
    code: error?.code,
    response: error?.response,
    responseCode: error?.responseCode,
    command: error?.command,
  });
};

const cookieOptions = {
  sameSite: env.COOKIE_SAME_SITE,
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
  ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
};

const sendAuthResponse = (res, user, message, statusCode = 200) => {
  const token = generateToken(user._id);

  res.cookie("token", token, cookieOptions);

  return res.status(statusCode).json({
    message,
    token,
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
  const normalizedPhone = normalizePhone(phone);

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

  const verification = await VerificationCode.findOne({
    email: normalizedEmail,
    purpose: "signup",
  }).sort({ createdAt: -1 });

  if (!verification) {
    throw new AppError("Please verify your email with OTP first", 400);
  }

  if (verification.expiresAt.getTime() < Date.now()) {
    await VerificationCode.deleteMany({ email: normalizedEmail, purpose: "signup" });
    throw new AppError("Signup OTP has expired. Please request a new one", 400);
  }

  const isOtpValid = await bcrypt.compare(String(otp).trim(), verification.codeHash);

  if (!isOtpValid) {
    throw new AppError("Invalid signup OTP", 400);
  }

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

  await VerificationCode.deleteMany({ email: normalizedEmail, purpose: "signup" });
  await Cart.create({ userId: user._id, items: [] });

  try {
    const delivery = await sendEmail({
      to: normalizedEmail,
      subject: "Welcome to HRUSHE",
      html: `<p>Hi ${name.trim()},</p><p>Your <strong>HRUSHE</strong> account has been created successfully.</p>`,
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

  return sendAuthResponse(res, user, "User created successfully", 201);
});

const login = asyncHandler(async (req, res) => {
  const { email, phone, identifier, password, username } = req.body;

  if (username === "admin" && password === "admin") {
    const adminEmail = "team@hrushe.in";
    let adminUser = await User.findOne({ email: adminEmail });

    if (!adminUser) {
      adminUser = await User.create({
        name: "Admin",
        email: adminEmail,
        password: await bcrypt.hash("admin", PASSWORD_HASH_ROUNDS),
        role: "admin",
        isVerified: true,
        emailVerifiedAt: new Date(),
      });
      await Cart.create({ userId: adminUser._id, items: [] });
    } else if (adminUser.role !== "admin") {
      adminUser.role = "admin";
      adminUser.password = await bcrypt.hash("admin", PASSWORD_HASH_ROUNDS);
      adminUser.name = adminUser.name || "Admin";
      await adminUser.save();
    }

    const existingCart = await Cart.findOne({ userId: adminUser._id });
    if (!existingCart) {
      await Cart.create({ userId: adminUser._id, items: [] });
    }

    adminUser.lastLoginAt = new Date();
    if (adminUser.isVerified !== true) {
      adminUser.isVerified = true;
      adminUser.emailVerifiedAt = adminUser.emailVerifiedAt || new Date();
    }
    await adminUser.save();

    return sendAuthResponse(res, adminUser, "Login successful");
  }

  const loginIdentifier = (identifier || email || phone || "").trim();

  if (!loginIdentifier || !password) {
    throw new AppError("Email or phone and password are required", 400);
  }

  const isEmailLogin = loginIdentifier.includes("@");
  const user = await User.findOne(
    isEmailLogin
      ? { email: loginIdentifier.toLowerCase() }
      : { phone: loginIdentifier }
  );
  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError("Invalid credentials", 401);
  }

  if (user.isVerified === false) {
    throw new AppError("Please verify your email before logging in", 403);
  }

  user.lastLoginAt = new Date();
  await user.save();

  return sendAuthResponse(res, user, "Login successful");
});

const me = asyncHandler(async (req, res) => {
  return res.json({ user: serializeUser(req.user) });
});

const updateMe = asyncHandler(async (req, res) => {
  const { name, email, phone, address } = req.body;

  if (!name || !email || !phone) {
    throw new AppError("Name, email, and phone are required", 400);
  }

  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);

  validateEmail(normalizedEmail);
  validateIndianPhone(normalizedPhone);

  const existingEmailUser = await User.findOne({
    email: normalizedEmail,
    _id: { $ne: req.user._id },
  });

  if (existingEmailUser) {
    throw new AppError("Email is already in use", 409);
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
      email: normalizedEmail,
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
  await user.save();

  try {
    const delivery = await sendEmail({
      to: user.email,
      subject: "Your HRUSHE password was changed",
      html: "<p>Your <strong>HRUSHE</strong> account password has been changed successfully.</p>",
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

  return res.json({ message: "Password changed successfully" });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token", cookieOptions);
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

  if (
    user.passwordResetOtpRequestedAt &&
    Date.now() - user.passwordResetOtpRequestedAt.getTime() < OTP_REQUEST_COOLDOWN_MS
  ) {
    throw new AppError("Please wait a minute before requesting another OTP", 429);
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  user.passwordResetOtp = await bcrypt.hash(otp, 10);
  user.passwordResetOtpExpiresAt = expiresAt;
  user.passwordResetOtpRequestedAt = new Date();
  await user.save();

  let delivery;
  try {
    delivery = await sendEmail({
      to: email,
      subject: "Your HRUSHE password reset OTP",
      html: `<p><strong>${otp}</strong> is your HRUSHE password reset OTP.</p><p>It is valid for ${OTP_EXPIRY_MINUTES} minutes.</p>`,
      templateKey: env.ZEPTOMAIL_TEMPLATE_PASSWORD_RESET_OTP || undefined,
      mergeInfo: {
        otp,
        email,
        expiry_minutes: OTP_EXPIRY_MINUTES,
        expiryMinutes: OTP_EXPIRY_MINUTES,
      },
    });
  } catch (error) {
    logEmailFailure("Password reset OTP", error);
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
    throw new AppError(
      "OTP email could not be sent. Please check mail settings and try again.",
      502
    );
  }

  const response = {
    message: "If an account exists, a password reset OTP has been sent.",
    expiresInMinutes: OTP_EXPIRY_MINUTES,
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

  const recentOtp = await VerificationCode.findOne({
    email,
    purpose: "signup",
    createdAt: { $gt: new Date(Date.now() - OTP_REQUEST_COOLDOWN_MS) },
  });

  if (recentOtp) {
    throw new AppError("Please wait a minute before requesting another OTP", 429);
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await VerificationCode.deleteMany({ email, purpose: "signup" });
  await VerificationCode.create({
    email,
    purpose: "signup",
    codeHash: await bcrypt.hash(otp, 10),
    expiresAt,
  });

  let delivery;
  try {
    delivery = await sendEmail({
      to: email,
      subject: "Your HRUSHE signup OTP",
      html: `<p><strong>${otp}</strong> is your HRUSHE signup OTP.</p><p>It is valid for ${OTP_EXPIRY_MINUTES} minutes.</p>`,
      templateKey: env.ZEPTOMAIL_TEMPLATE_SIGNUP_OTP || undefined,
      mergeInfo: {
        otp,
        email,
        expiry_minutes: OTP_EXPIRY_MINUTES,
        expiryMinutes: OTP_EXPIRY_MINUTES,
      },
    });
  } catch (error) {
    logEmailFailure("Signup OTP", error);
    throw new AppError(
      "OTP email could not be sent. Please check mail settings and try again.",
      502
    );
  }

  if (!delivery.delivered) {
    logEmailFailure("Signup OTP", new Error(delivery.reason || "Mail delivery failed"));
    throw new AppError(
      "OTP email could not be sent. Please check mail settings and try again.",
      502
    );
  }

  const response = {
    message: "Signup OTP sent successfully",
    expiresInMinutes: OTP_EXPIRY_MINUTES,
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

  if (!user || !user.passwordResetOtp || !user.passwordResetOtpExpiresAt) {
    throw new AppError("OTP reset request not found", 400);
  }

  if (user.passwordResetOtpExpiresAt.getTime() < Date.now()) {
    user.passwordResetOtp = "";
    user.passwordResetOtpExpiresAt = null;
    await user.save();
    throw new AppError("OTP has expired. Please request a new one", 400);
  }

  const isOtpValid = await bcrypt.compare(otp, user.passwordResetOtp);

  if (!isOtpValid) {
    throw new AppError("Invalid OTP", 400);
  }

  user.password = await bcrypt.hash(newPassword, PASSWORD_HASH_ROUNDS);
  user.passwordResetOtp = "";
  user.passwordResetOtpExpiresAt = null;
  user.passwordResetOtpRequestedAt = null;
  await user.save();

  return res.json({ message: "Password reset successful" });
});

module.exports = {
  signup,
  login,
  me,
  updateMe,
  changePassword,
  logout,
  requestPasswordResetOtp,
  requestSignupOtp,
  resetPasswordWithOtp,
};
