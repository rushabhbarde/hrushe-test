const jwt = require("jsonwebtoken");
const User = require("../models/User");
const env = require("../config/env");
const AppError = require("../utils/AppError");
const { hasAdminPermission } = require("../config/adminRoles");

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  const cookieHeader = req.headers.cookie || "";
  const tokenCookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("token="));

  return tokenCookie ? decodeURIComponent(tokenCookie.split("=")[1]) : null;
};

const protect = async (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return next(new AppError("Not authorized", 401));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return next(new AppError("User not found", 401));
    }

    if (user.role !== "admin" && user.isVerified === false) {
      return next(new AppError("Please verify your email before accessing your account", 403));
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(new AppError("Invalid token", 401));
  }
};

const attachUserIfAuthenticated = async (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (user && (user.role === "admin" || user.isVerified !== false)) {
      req.user = user;
    }
  } catch {
    // Public support ticket creation should still work with a stale token.
  }

  return next();
};

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return next(new AppError("Admin access required", 403));
  }

  return next();
};

const requireAdminPermission = (permission) => (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return next(new AppError("Admin access required", 403));
  }

  if (!hasAdminPermission(req.user, permission)) {
    return next(new AppError("You do not have permission to perform this action", 403));
  }

  return next();
};

module.exports = { protect, attachUserIfAuthenticated, adminOnly, requireAdminPermission };
