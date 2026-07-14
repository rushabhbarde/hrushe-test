const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
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
const { recordAuditLog } = require("../utils/auditLog");
const {
  RECONCILIATION_RESULT_CODES,
  STUCK_INITIATED_MS,
} = require("../utils/reconciliation");
const { getOperationsState } = require("../utils/operationsState");
const {
  buildPaginationMeta,
  parsePaginationQuery,
  sendListResponse,
} = require("../utils/pagination");
const { isValidIndianPhone, normalizeIndianPhone } = require("../utils/phone");

const PASSWORD_HASH_ROUNDS = 12;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OPERATIONS_SUMMARY_CACHE_MS = 15 * 1000;
let operationsSummaryCache = {
  expiresAt: 0,
  value: null,
};

function validateStaffPassword(password) {
  const value = String(password || "");

  if (value.length < 12) {
    throw new AppError("Staff password must be at least 12 characters long", 400);
  }

  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value) || !/[^A-Za-z0-9]/.test(value)) {
    throw new AppError("Staff password must include upper and lowercase letters, a number, and a symbol", 400);
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
  const paidOrders = orders.filter((order) => order.paymentStatus === "paid");
  const totalSpend = paidOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const averageOrderValue = paidOrders.length > 0 ? totalSpend / paidOrders.length : 0;
  const lastOrderDate = paidOrders[0]?.createdAt || null;
  const status = buildCustomerStatus({
    createdAt: user.createdAt,
    orderCount: paidOrders.length,
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
    orderCount: paidOrders.length,
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
  const filter = { role: { $ne: "admin" } };
  const paginationParams = parsePaginationQuery(req.query, {
    defaultLimit: 50,
    maxLimit: 100,
  });
  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-password -passwordResetOtp -passwordResetOtpExpiresAt")
      .populate("wishlist")
      .sort({ createdAt: -1 })
      .skip(paginationParams.skip)
      .limit(paginationParams.limit),
    User.countDocuments(filter),
  ]);
  const userIds = users.map((user) => user._id);
  const orders = userIds.length
    ? await Order.find({ userId: { $in: userIds } })
      .sort({ createdAt: -1 })
      .select("userId totalAmount createdAt orderStatus paymentStatus customerEmail")
    : [];

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

  const pagination = buildPaginationMeta({
    page: paginationParams.page,
    limit: paginationParams.limit,
    total,
  });

  return sendListResponse(res, req.query, serialized, pagination);
});

const getOperationsSummary = asyncHandler(async (req, res) => {
  const now = Date.now();

  if (operationsSummaryCache.value && operationsSummaryCache.expiresAt > now) {
    return res.json({
      ...operationsSummaryCache.value,
      cached: true,
    });
  }

  const nowDate = new Date(now);
  const initiatedCutoff = new Date(now - STUCK_INITIATED_MS);
  const [
    manualReview,
    providerUnavailable,
    capturedUnconfirmed,
    amountMismatch,
    currencyMismatch,
    activeReservations,
    expiredReservations,
    paidReserved,
    failedWithReservation,
    confirmedButUnpaid,
    initiatedOlderThan20Minutes,
  ] = await Promise.all([
    Order.countDocuments({
      paymentReconciliationResultCode:
        RECONCILIATION_RESULT_CODES.MANUAL_REVIEW_REQUIRED,
    }),
    Order.countDocuments({
      paymentReconciliationResultCode:
        RECONCILIATION_RESULT_CODES.PROVIDER_UNAVAILABLE,
    }),
    Order.countDocuments({
      paymentStatus: "paid",
      inventoryReservationStatus: "reserved",
    }),
    Order.countDocuments({
      paymentReconciliationResultCode:
        RECONCILIATION_RESULT_CODES.PAYMENT_AMOUNT_MISMATCH,
    }),
    Order.countDocuments({
      paymentReconciliationResultCode:
        RECONCILIATION_RESULT_CODES.PAYMENT_CURRENCY_MISMATCH,
    }),
    Order.countDocuments({ inventoryReservationStatus: "reserved" }),
    Order.countDocuments({
      inventoryReservationStatus: "reserved",
      inventoryReservationExpiresAt: { $lte: nowDate },
    }),
    Order.countDocuments({
      paymentStatus: "paid",
      inventoryReservationStatus: "reserved",
    }),
    Order.countDocuments({
      paymentStatus: "failed",
      inventoryReservationStatus: "reserved",
    }),
    Order.countDocuments({
      orderStatus: "Confirmed",
      paymentStatus: { $ne: "paid" },
    }),
    Order.countDocuments({
      paymentStatus: "initiated",
      createdAt: { $lte: initiatedCutoff },
    }),
  ]);
  const state = getOperationsState();
  const summary = {
    payments: {
      manualReview,
      providerUnavailable,
      capturedUnconfirmed,
      amountMismatch,
      currencyMismatch,
    },
    inventory: {
      activeReservations,
      expiredReservations,
      consistencyWarnings:
        paidReserved + failedWithReservation + confirmedButUnpaid + expiredReservations,
    },
    orders: {
      initiatedOlderThan20Minutes,
      failedWithReservation,
      confirmedButUnpaid,
    },
    system: {
      mongoReady: mongoose.connection.readyState === 1,
      lastReconciliationScanAt: state.lastReconciliationScanAt,
      lastCriticalErrorAt: state.lastCriticalErrorAt,
    },
    cached: false,
    generatedAt: new Date(now),
  };

  operationsSummaryCache = {
    expiresAt: now + OPERATIONS_SUMMARY_CACHE_MS,
    value: summary,
  };

  return res.json(summary);
});

const getCustomerById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("-password -passwordResetOtp -passwordResetOtpExpiresAt")
    .populate("wishlist");

  if (!user || user.role === "admin") {
    throw new AppError("Customer not found", 404);
  }

  const paginationParams = parsePaginationQuery(req.query, {
    defaultLimit: 100,
    maxLimit: 100,
  });
  const [orders, totalOrders] = await Promise.all([
    Order.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .skip(paginationParams.skip)
      .limit(paginationParams.limit),
    Order.countDocuments({ userId: user._id }),
  ]);

  res.json({
    ...serializeCustomer(user, orders),
    orders,
    ordersPagination: buildPaginationMeta({
      page: paginationParams.page,
      limit: paginationParams.limit,
      total: totalOrders,
    }),
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
  const phone = normalizeIndianPhone(req.body.phone);
  const password = String(req.body.password || "");
  const adminRole = String(req.body.adminRole || "").trim();

  if (!name || !email || !password) {
    throw new AppError("Name, email, and password are required", 400);
  }

  if (!EMAIL_PATTERN.test(email)) {
    throw new AppError("Enter a valid staff email address", 400);
  }

  if (req.body.phone && !isValidIndianPhone(req.body.phone)) {
    throw new AppError("Enter a valid 10-digit Indian phone number", 400);
  }

  validateStaffPassword(password);

  if (!isAdminRoleId(adminRole)) {
    throw new AppError("Choose a valid staff role", 400);
  }

  const [existingUser, existingPhoneUser] = await Promise.all([
    User.findOne({ email }),
    phone ? User.findOne({ phone }) : null,
  ]);
  if (existingUser) {
    throw new AppError("A user with this email already exists", 409);
  }
  if (existingPhoneUser) {
    throw new AppError("Phone number is already in use", 409);
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
  staffUser.tokenVersion = Number(staffUser.tokenVersion || 0) + 1;
  await staffUser.save();

  await recordAuditLog(req, "staff.role-change", { type: "user", id: staffUser._id }, {
    adminRole: nextRole,
  });

  res.json(serializeStaffUser(staffUser));
});

module.exports = {
  getOperationsSummary,
  listCustomers,
  getCustomerById,
  listStaffUsers,
  createStaffUser,
  updateStaffUserRole,
};
