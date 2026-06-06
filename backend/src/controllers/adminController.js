const bcrypt = require("bcrypt");
const User = require("../models/User");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const {
  ADMIN_ROLE_DEFINITIONS,
  getAdminPermissionsForUser,
  getAdminRoleForUser,
  isAdminRoleId,
  normalizeAdminRoleId,
} = require("../config/adminRoles");

const PASSWORD_HASH_ROUNDS = 12;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateStaffPassword(password) {
  const value = String(password || "");

  if (value.length < 8) {
    throw new AppError("Staff password must be at least 8 characters long", 400);
  }

  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    throw new AppError("Staff password must include at least one letter and one number", 400);
  }
}

function buildCustomerStatus({ createdAt, orderCount, totalSpend, lastOrderDate }) {
  const daysSinceSignup = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
  const daysSinceLastOrder = lastOrderDate
    ? Math.floor((Date.now() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  if (totalSpend >= 10000 || orderCount >= 4) {
    return "VIP";
  }

  if (orderCount === 0 && daysSinceSignup > 14) {
    return "At Risk";
  }

  if (daysSinceLastOrder !== null && daysSinceLastOrder > 120) {
    return "At Risk";
  }

  if (daysSinceSignup <= 14) {
    return "New";
  }

  return "Active";
}

function serializeWishlistItem(item) {
  if (!item) {
    return null;
  }

  const object = typeof item.toObject === "function" ? item.toObject() : item;

  return {
    id: object._id?.toString?.() || object.id,
    name: object.name || "",
    slug: object.slug || "",
    category: object.category || "",
    price: object.price || 0,
    compareAtPrice: object.compareAtPrice || 0,
    accent: object.accent || "#111111",
    images: object.images || [],
  };
}

function serializeCustomer(user, orders = []) {
  const totalSpend = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const averageOrderValue = orders.length > 0 ? totalSpend / orders.length : 0;
  const lastOrderDate = orders[0]?.createdAt || null;
  const status = buildCustomerStatus({
    createdAt: user.createdAt,
    orderCount: orders.length,
    totalSpend,
    lastOrderDate,
  });

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    gender: user.gender || "",
    dateOfBirth: user.dateOfBirth || null,
    role: user.role,
    profilePictureUrl: user.profilePictureUrl || "",
    address: user.address || "",
    addresses: user.addresses || [],
    preferences: user.preferences || {},
    communicationPreferences: user.communicationPreferences || {},
    wishlist: (user.wishlist || []).map(serializeWishlistItem).filter(Boolean),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    orderCount: orders.length,
    totalSpend,
    averageOrderValue,
    lastOrderDate,
    status,
    notes: [],
  };
}

function serializeStaffUser(user) {
  const adminRole = getAdminRoleForUser(user);

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    role: user.role,
    adminRole: adminRole?.id || "",
    adminRoleName: adminRole?.name || "",
    adminPermissions: getAdminPermissionsForUser(user),
    isVerified: user.isVerified !== false,
    lastLoginAt: user.lastLoginAt || null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

const listCustomers = asyncHandler(async (req, res) => {
  const [users, orders] = await Promise.all([
    User.find({ role: { $ne: "admin" } })
      .select("-password -passwordResetOtp -passwordResetOtpExpiresAt")
      .populate("wishlist"),
    Order.find({})
      .sort({ createdAt: -1 })
      .select("userId totalAmount createdAt orderStatus paymentStatus customerEmail"),
  ]);

  const ordersByUser = new Map();

  orders.forEach((order) => {
    const key = order.userId?.toString?.();
    if (!key) {
      return;
    }

    const current = ordersByUser.get(key) || [];
    current.push(order);
    ordersByUser.set(key, current);
  });

  const serialized = users
    .map((user) => serializeCustomer(user, ordersByUser.get(user._id.toString()) || []))
    .sort((a, b) => {
      if (b.totalSpend !== a.totalSpend) {
        return b.totalSpend - a.totalSpend;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  res.json(serialized);
});

const getCustomerById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("-password -passwordResetOtp -passwordResetOtpExpiresAt")
    .populate("wishlist");

  if (!user || user.role === "admin") {
    throw new AppError("Customer not found", 404);
  }

  const orders = await Order.find({ userId: user._id }).sort({ createdAt: -1 });

  res.json({
    ...serializeCustomer(user, orders),
    orders,
  });
});

const listStaffUsers = asyncHandler(async (req, res) => {
  const staff = await User.find({ role: "admin" })
    .select("-password -passwordResetOtp -passwordResetOtpExpiresAt")
    .sort({ createdAt: 1 });

  res.json({
    roles: ADMIN_ROLE_DEFINITIONS,
    staff: staff.map(serializeStaffUser),
  });
});

const createStaffUser = asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const phone = String(req.body.phone || "").trim();
  const password = String(req.body.password || "");
  const adminRole = String(req.body.adminRole || "").trim();

  if (!name || !email || !password) {
    throw new AppError("Name, email, and password are required", 400);
  }

  if (!EMAIL_PATTERN.test(email)) {
    throw new AppError("Enter a valid staff email address", 400);
  }

  validateStaffPassword(password);

  if (!isAdminRoleId(adminRole)) {
    throw new AppError("Choose a valid staff role", 400);
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("A user with this email already exists", 409);
  }

  const staffUser = await User.create({
    name,
    email,
    phone,
    password: await bcrypt.hash(password, PASSWORD_HASH_ROUNDS),
    role: "admin",
    adminRole,
    isVerified: true,
    emailVerifiedAt: new Date(),
  });

  await Cart.create({ userId: staffUser._id, items: [] });

  res.status(201).json(serializeStaffUser(staffUser));
});

const updateStaffUserRole = asyncHandler(async (req, res) => {
  const requestedRole = String(req.body.adminRole || "").trim();
  if (!isAdminRoleId(requestedRole)) {
    throw new AppError("Choose a valid staff role", 400);
  }

  const nextRole = normalizeAdminRoleId(requestedRole);
  const staffUser = await User.findById(req.params.id);

  if (!staffUser || staffUser.role !== "admin") {
    throw new AppError("Staff user not found", 404);
  }

  if (staffUser.adminRole === "super-admin" && nextRole !== "super-admin") {
    const superAdminCount = await User.countDocuments({
      role: "admin",
      adminRole: "super-admin",
    });

    if (superAdminCount <= 1) {
      throw new AppError("At least one Super Admin must remain active", 400);
    }
  }

  staffUser.adminRole = nextRole;
  await staffUser.save();

  res.json(serializeStaffUser(staffUser));
});

module.exports = {
  listCustomers,
  getCustomerById,
  listStaffUsers,
  createStaffUser,
  updateStaffUserRole,
};
