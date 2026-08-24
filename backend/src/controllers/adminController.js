const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const User = require("../models/User");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const SiteContent = require("../models/SiteContent");
const SupportRequest = require("../models/SupportRequest");
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
const { toUserConflictError } = require("../utils/userDuplicateKey");

const PASSWORD_HASH_ROUNDS = 12;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OPERATIONS_SUMMARY_CACHE_MS = 15 * 1000;
const BUSINESS_TIMEZONE = "Asia/Kolkata";
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const LOW_STOCK_THRESHOLD = 3;
let operationsSummaryCache = {
  expiresAt: 0,
  value: null,
};

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function toPaiseFromRupees(value) {
  return Math.round((Number(value) || 0) * 100);
}

function getBusinessDateParts(date = new Date()) {
  const shifted = new Date(date.getTime() + IST_OFFSET_MS);

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
  };
}

function businessDateToUtc({ year, month, day }) {
  return new Date(Date.UTC(year, month, day) - IST_OFFSET_MS);
}

function getBusinessDayStart(date = new Date()) {
  return businessDateToUtc(getBusinessDateParts(date));
}

function addDays(date, days) {
  return new Date(date.getTime() + days * DAY_MS);
}

function getBusinessMonthStart(date = new Date(), offsetMonths = 0) {
  const parts = getBusinessDateParts(date);
  return businessDateToUtc({
    year: parts.year,
    month: parts.month + offsetMonths,
    day: 1,
  });
}

function parseCustomDate(value, { endOfDay = false } = {}) {
  const raw = String(value || "").trim();
  if (!raw) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [year, month, day] = raw.split("-").map(Number);
    const start = businessDateToUtc({ year, month: month - 1, day });
    return endOfDay ? addDays(start, 1) : start;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildDashboardDateRange(query = {}, now = new Date()) {
  const preset = String(query.range || "last7").trim();
  const todayStart = getBusinessDayStart(now);
  const tomorrowStart = addDays(todayStart, 1);
  const thisMonthStart = getBusinessMonthStart(now);
  const nextMonthStart = getBusinessMonthStart(now, 1);
  const previousMonthStart = getBusinessMonthStart(now, -1);

  const presets = {
    today: {
      label: "Today",
      from: todayStart,
      to: tomorrowStart,
    },
    yesterday: {
      label: "Yesterday",
      from: addDays(todayStart, -1),
      to: todayStart,
    },
    last7: {
      label: "Last 7 days",
      from: addDays(todayStart, -6),
      to: tomorrowStart,
    },
    last30: {
      label: "Last 30 days",
      from: addDays(todayStart, -29),
      to: tomorrowStart,
    },
    thisMonth: {
      label: "This month",
      from: thisMonthStart,
      to: nextMonthStart,
    },
    previousMonth: {
      label: "Previous month",
      from: previousMonthStart,
      to: thisMonthStart,
    },
  };

  if (preset === "custom") {
    const from = parseCustomDate(query.from);
    const to = parseCustomDate(query.to, { endOfDay: true });

    if (from && to && to > from) {
      return {
        preset,
        label: "Custom range",
        from,
        to,
        timezone: BUSINESS_TIMEZONE,
      };
    }
  }

  const resolved = presets[preset] || presets.last7;

  return {
    preset: presets[preset] ? preset : "last7",
    label: resolved.label,
    from: resolved.from,
    to: resolved.to,
    timezone: BUSINESS_TIMEZONE,
  };
}

function buildCreatedAtRange(range) {
  return {
    $gte: range.from,
    $lt: range.to,
  };
}

async function getPaidRevenueSummary(range) {
  const match = { paymentStatus: "paid" };
  if (range) {
    match.createdAt = buildCreatedAtRange(range);
  }

  const [summary] = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        orders: { $sum: 1 },
        revenuePaise: {
          $sum: {
            $ifNull: [
              "$totalPaise",
              { $round: [{ $multiply: ["$totalAmount", 100] }, 0] },
            ],
          },
        },
      },
    },
  ]);

  return {
    orders: Number(summary?.orders || 0),
    revenuePaise: Number(summary?.revenuePaise || 0),
  };
}

async function getInventoryDashboardSummary() {
  const [summary] = await Product.aggregate([
    { $match: { trackInventory: true } },
    { $unwind: "$variants" },
    { $match: { "variants.active": { $ne: false } } },
    {
      $project: {
        stock: { $ifNull: ["$variants.stock", 0] },
        reserved: { $ifNull: ["$variants.reserved", 0] },
      },
    },
    {
      $project: {
        stock: 1,
        reserved: 1,
        available: { $subtract: ["$stock", "$reserved"] },
      },
    },
    {
      $group: {
        _id: null,
        trackedVariants: { $sum: 1 },
        physicalStock: { $sum: "$stock" },
        reservedUnits: { $sum: "$reserved" },
        reservedVariants: {
          $sum: { $cond: [{ $gt: ["$reserved", 0] }, 1, 0] },
        },
        lowStockVariants: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gt: ["$available", 0] },
                  { $lte: ["$available", LOW_STOCK_THRESHOLD] },
                ],
              },
              1,
              0,
            ],
          },
        },
        outOfStockVariants: {
          $sum: { $cond: [{ $lte: ["$available", 0] }, 1, 0] },
        },
      },
    },
  ]);

  return {
    trackedVariants: Number(summary?.trackedVariants || 0),
    physicalStock: Number(summary?.physicalStock || 0),
    reservedUnits: Number(summary?.reservedUnits || 0),
    reservedVariants: Number(summary?.reservedVariants || 0),
    lowStockVariants: Number(summary?.lowStockVariants || 0),
    outOfStockVariants: Number(summary?.outOfStockVariants || 0),
    lowStockThreshold: LOW_STOCK_THRESHOLD,
  };
}

function isFutureDate(value, now = Date.now()) {
  const timestamp = value ? new Date(value).getTime() : null;
  return Number.isFinite(timestamp) && timestamp > now;
}

function isVisibleRecord(record = {}) {
  return record.enabled !== false && record.isVisible !== false;
}

function isSafeDashboardLink(value) {
  const url = String(value || "").trim();
  if (!url) return true;
  if (url.startsWith("/") && !url.startsWith("//")) return true;

  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

function collectStorefrontLinks(homeManagement = {}) {
  const links = [];
  const banners = Array.isArray(homeManagement.banners) ? homeManagement.banners : [];
  const sections = Array.isArray(homeManagement.sections) ? homeManagement.sections : [];

  banners.forEach((banner) => {
    links.push(banner?.ctaLink);
  });

  sections.forEach((section) => {
    links.push(section?.ctaLink, section?.secondaryCtaLink);
    if (Array.isArray(section?.cards)) {
      section.cards.forEach((card) => {
        links.push(card?.ctaLink);
      });
    }
  });

  return links.filter((link) => String(link || "").trim());
}

function buildStorefrontSummary(siteContent) {
  const workspace = siteContent?.adminWorkspace || {};
  const homeManagement = workspace.homeManagement || {};
  const banners = Array.isArray(homeManagement.banners) ? homeManagement.banners : [];
  const sections = Array.isArray(homeManagement.sections) ? homeManagement.sections : [];
  const now = Date.now();
  let scheduledCampaigns = 0;
  let missingMobileMedia = 0;

  banners.forEach((banner = {}) => {
    if (isVisibleRecord(banner) && isFutureDate(banner.scheduleStart, now)) {
      scheduledCampaigns += 1;
    }
    if (isVisibleRecord(banner) && String(banner.mediaUrl || banner.desktopImage || "").trim() && !String(banner.mobileImage || "").trim()) {
      missingMobileMedia += 1;
    }
  });

  sections.forEach((section = {}) => {
    if (isVisibleRecord(section) && isFutureDate(section.publishStart, now)) {
      scheduledCampaigns += 1;
    }
    if (isVisibleRecord(section) && String(section.image || "").trim() && !String(section.mobileImage || "").trim()) {
      missingMobileMedia += 1;
    }
    if (Array.isArray(section.cards)) {
      section.cards.forEach((card = {}) => {
        if (isVisibleRecord(card) && String(card.image || "").trim() && !String(card.mobileImage || "").trim()) {
          missingMobileMedia += 1;
        }
      });
    }
  });

  const brokenLinks = collectStorefrontLinks(homeManagement).filter(
    (link) => !isSafeDashboardLink(link)
  ).length;

  return {
    scheduledCampaigns,
    missingMobileMedia,
    brokenLinks,
    draftStorefrontChanges: 0,
    recentPublishedAt: homeManagement.lastPublishedAt || null,
    version: siteContent?.adminWorkspaceVersion || 1,
  };
}

function actionCard({
  id,
  title,
  description,
  count,
  href,
  tone = "default",
  severity = "normal",
  available = true,
}) {
  return {
    id,
    title,
    description,
    count: Number(count || 0),
    href,
    tone,
    severity,
    available,
  };
}

async function getTopSellingProducts(range) {
  return Order.aggregate([
    {
      $match: {
        paymentStatus: "paid",
        createdAt: buildCreatedAtRange(range),
      },
    },
    { $unwind: "$products" },
    {
      $group: {
        _id: {
          productId: "$products.productId",
          name: "$products.name",
        },
        quantity: { $sum: "$products.quantity" },
        revenuePaise: {
          $sum: {
            $multiply: [
              { $ifNull: ["$products.pricePaise", { $round: [{ $multiply: ["$products.price", 100] }, 0] }] },
              "$products.quantity",
            ],
          },
        },
      },
    },
    { $sort: { quantity: -1, revenuePaise: -1 } },
    { $limit: 5 },
    {
      $project: {
        _id: 0,
        productId: { $toString: "$_id.productId" },
        name: "$_id.name",
        quantity: 1,
        revenuePaise: 1,
      },
    },
  ]);
}

function mapRecentOrder(order) {
  return {
    id: order._id?.toString?.() || order.id,
    orderNumber: order.orderNumber || null,
    customerName: order.customerName || "",
    customerEmail: order.customerEmail || "",
    paymentStatus: order.paymentStatus || "",
    orderStatus: order.orderStatus || "",
    totalAmount: Number(order.totalAmount || 0),
    totalPaise:
      Number.isInteger(order.totalPaise) ? order.totalPaise : toPaiseFromRupees(order.totalAmount),
    createdAt: order.createdAt,
  };
}

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

function buildCustomerListFilter(query = {}) {
  const filter = { role: { $ne: "admin" } };
  const search = String(query.search || query.query || query.q || "").trim();

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search.slice(0, 100)), "i");
    filter.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
    ];
  }

  return filter;
}

const listCustomers = asyncHandler(async (req, res) => {
  const filter = buildCustomerListFilter(req.query);
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

const getDashboardOverview = asyncHandler(async (req, res) => {
  const now = new Date();
  const selectedRange = buildDashboardDateRange(req.query, now);
  const todayRange = buildDashboardDateRange({ range: "today" }, now);
  const weekRange = buildDashboardDateRange({ range: "last7" }, now);
  const monthRange = buildDashboardDateRange({ range: "thisMonth" }, now);
  const initiatedCutoff = new Date(now.getTime() - STUCK_INITIATED_MS);
  const manualReviewQuery = {
    paymentReconciliationResultCode:
      RECONCILIATION_RESULT_CODES.MANUAL_REVIEW_REQUIRED,
  };
  const reconciliationMismatchQuery = {
    paymentReconciliationResultCode: {
      $in: [
        RECONCILIATION_RESULT_CODES.PROVIDER_UNAVAILABLE,
        RECONCILIATION_RESULT_CODES.PAYMENT_AMOUNT_MISMATCH,
        RECONCILIATION_RESULT_CODES.PAYMENT_CURRENCY_MISMATCH,
      ],
    },
  };
  const awaitingFulfillmentQuery = {
    paymentStatus: "paid",
    orderStatus: "Confirmed",
  };
  const awaitingShipmentQuery = {
    paymentStatus: "paid",
    orderStatus: "Packed",
  };

  const [
    revenueToday,
    revenueWeek,
    revenueMonth,
    revenueSelected,
    ordersToday,
    selectedOrdersTotal,
    awaitingPayment,
    awaitingFulfillment,
    awaitingShipment,
    failedPayments,
    manualReviewPayments,
    reconciliationIssues,
    expiredReservations,
    activeReservations,
    initiatedOlderThan20Minutes,
    supportAttention,
    inventory,
    siteContent,
    recentOrders,
    topProducts,
  ] = await Promise.all([
    getPaidRevenueSummary(todayRange),
    getPaidRevenueSummary(weekRange),
    getPaidRevenueSummary(monthRange),
    getPaidRevenueSummary(selectedRange),
    Order.countDocuments({ createdAt: buildCreatedAtRange(todayRange) }),
    Order.countDocuments({ createdAt: buildCreatedAtRange(selectedRange) }),
    Order.countDocuments({
      paymentStatus: { $in: ["pending", "initiated"] },
      orderStatus: { $nin: ["Cancelled", "Returned"] },
    }),
    Order.countDocuments(awaitingFulfillmentQuery),
    Order.countDocuments(awaitingShipmentQuery),
    Order.countDocuments({ paymentStatus: "failed" }),
    Order.countDocuments(manualReviewQuery),
    Order.countDocuments(reconciliationMismatchQuery),
    Order.countDocuments({
      inventoryReservationStatus: "reserved",
      inventoryReservationExpiresAt: { $lte: now },
    }),
    Order.countDocuments({ inventoryReservationStatus: "reserved" }),
    Order.countDocuments({
      paymentStatus: "initiated",
      createdAt: { $lte: initiatedCutoff },
    }),
    SupportRequest.countDocuments({
      status: { $in: ["open", "in-progress", "waiting-customer"] },
    }),
    getInventoryDashboardSummary(),
    SiteContent.findOne({ key: "main" }).lean(),
    Order.find()
      .select("-checkoutLogs -checkoutUrl")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
    getTopSellingProducts(selectedRange),
  ]);

  const storefront = buildStorefrontSummary(siteContent);
  const averageOrderValuePaise =
    revenueSelected.orders > 0
      ? Math.round(revenueSelected.revenuePaise / revenueSelected.orders)
      : 0;
  const paymentWarningTotal =
    manualReviewPayments + reconciliationIssues + expiredReservations + initiatedOlderThan20Minutes;
  const actionCards = [
    actionCard({
      id: "orders-needing-fulfillment",
      title: "Orders needing fulfilment",
      description: "Paid orders that have not moved into packing or dispatch.",
      count: awaitingFulfillment,
      href: "/admin/orders?status=Confirmed&payment=paid",
      tone: awaitingFulfillment > 0 ? "warning" : "success",
      severity: awaitingFulfillment > 0 ? "high" : "normal",
    }),
    actionCard({
      id: "manual-review-payments",
      title: "Payments requiring manual review",
      description: "Captured or mismatched payments held away from automatic confirmation.",
      count: manualReviewPayments,
      href: "/admin/reports/orders",
      tone: manualReviewPayments > 0 ? "warning" : "success",
      severity: manualReviewPayments > 0 ? "critical" : "normal",
    }),
    actionCard({
      id: "reconciliation-mismatches",
      title: "Reconciliation mismatches",
      description: "Provider unavailable, amount mismatch, or currency mismatch results.",
      count: reconciliationIssues,
      href: "/admin/reports/orders",
      tone: reconciliationIssues > 0 ? "warning" : "success",
      severity: reconciliationIssues > 0 ? "high" : "normal",
    }),
    actionCard({
      id: "low-stock-products",
      title: "Low-stock products",
      description: `Active variants at or below ${LOW_STOCK_THRESHOLD} available units.`,
      count: inventory.lowStockVariants,
      href: "/admin/inventory?stock=low",
      tone: inventory.lowStockVariants > 0 ? "warning" : "success",
      severity: inventory.lowStockVariants > 0 ? "medium" : "normal",
    }),
    actionCard({
      id: "pending-support",
      title: "Support items requiring attention",
      description: "Open, in-progress, or customer-waiting support tickets.",
      count: supportAttention,
      href: "/admin/support?status=open",
      tone: supportAttention > 0 ? "accent" : "success",
      severity: supportAttention > 0 ? "medium" : "normal",
    }),
    actionCard({
      id: "scheduled-campaigns",
      title: "Scheduled campaigns starting soon",
      description: "Homepage banners or sections with a future start date.",
      count: storefront.scheduledCampaigns,
      href: "/admin/homepage",
      tone: storefront.scheduledCampaigns > 0 ? "accent" : "default",
    }),
    actionCard({
      id: "broken-storefront-links",
      title: "Broken storefront links",
      description: "Stored campaign links that fail basic URL validation.",
      count: storefront.brokenLinks,
      href: "/admin/homepage",
      tone: storefront.brokenLinks > 0 ? "warning" : "success",
      severity: storefront.brokenLinks > 0 ? "high" : "normal",
    }),
    actionCard({
      id: "missing-mobile-media",
      title: "Missing mobile campaign media",
      description: "Visible desktop campaign media without an independent mobile asset.",
      count: storefront.missingMobileMedia,
      href: "/admin/homepage",
      tone: storefront.missingMobileMedia > 0 ? "warning" : "success",
      severity: storefront.missingMobileMedia > 0 ? "medium" : "normal",
    }),
  ];

  return res.json({
    dateRange: {
      preset: selectedRange.preset,
      label: selectedRange.label,
      from: selectedRange.from,
      to: selectedRange.to,
      timezone: selectedRange.timezone,
    },
    revenue: {
      todayPaise: revenueToday.revenuePaise,
      weekPaise: revenueWeek.revenuePaise,
      monthPaise: revenueMonth.revenuePaise,
      selectedPaise: revenueSelected.revenuePaise,
      selectedPaidOrders: revenueSelected.orders,
      averageOrderValuePaise,
    },
    orders: {
      today: ordersToday,
      selectedTotal: selectedOrdersTotal,
      awaitingPayment,
      awaitingFulfillment,
      awaitingShipment,
      initiatedOlderThan20Minutes,
    },
    payments: {
      failed: failedPayments,
      manualReview: manualReviewPayments,
      reconciliationIssues,
      expiredReservations,
      warningTotal: paymentWarningTotal,
    },
    inventory: {
      ...inventory,
      activeReservations,
    },
    fulfilment: {
      delayedShipments: 0,
      failedShipments: 0,
      providerConfigured: false,
    },
    returns: {
      pending: 0,
      exchangesPending: 0,
      modelConfigured: false,
    },
    storefront,
    support: {
      attention: supportAttention,
    },
    actionCards,
    recentOrders: recentOrders.map(mapRecentOrder),
    topProducts,
    unsupportedMetrics: [
      {
        key: "returns.pending",
        label: "Returns pending",
        reason: "No persisted return/exchange model exists yet.",
      },
      {
        key: "fulfilment.delayedShipments",
        label: "Delayed shipments",
        reason: "No shipping-provider event feed exists in this repository.",
      },
      {
        key: "campaign.revenueAttribution",
        label: "Campaign revenue attribution",
        reason: "Campaign impression/click/order attribution is not tracked yet.",
      },
    ],
    generatedAt: now,
    cached: false,
  });
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

  let staffUser;
  try {
    staffUser = await User.create({
      name,
      email,
      phone,
      password: await bcrypt.hash(password, PASSWORD_HASH_ROUNDS),
      role: "admin",
      adminRole,
      isVerified: true,
      emailVerifiedAt: new Date(),
    });
  } catch (error) {
    throw toUserConflictError(error, "A user with this email already exists") || error;
  }

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
  getDashboardOverview,
  getOperationsSummary,
  listCustomers,
  getCustomerById,
  listStaffUsers,
  createStaffUser,
  updateStaffUserRole,
  __private: {
    buildDashboardDateRange,
    buildCustomerListFilter,
    buildStorefrontSummary,
  },
};
