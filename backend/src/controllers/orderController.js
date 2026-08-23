const Cart = require("../models/Cart");
const Order = require("../models/Order");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const env = require("../config/env");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { sendEmail } = require("../utils/mailer");
const { buildOrderStatusEmail } = require("../utils/emailTemplates");
const { buildInvoicePdf } = require("../utils/invoicePdf");
const { hasAdminPermission } = require("../config/adminRoles");
const WebhookEvent = require("../models/WebhookEvent");
const { recordAuditLog } = require("../utils/auditLog");
const { captureError } = require("../utils/errorMonitoring");
const { logEvent } = require("../utils/logger");
const { recordMetric } = require("../utils/metrics");
const { markReconciliationScan } = require("../utils/operationsState");
const {
  buildPaginationMeta,
  parsePaginationQuery,
  sendListResponse,
  setPaginationHeaders,
} = require("../utils/pagination");
const {
  calculateOrderTotals,
  getPaiseValue,
  paiseToRupees,
} = require("../utils/money");
const {
  RECONCILIATION_LOCK_WINDOW_MS,
  RECONCILIATION_RESULT_CODES,
  buildReconciliationSummary,
} = require("../utils/reconciliation");
const {
  buildReviewCandidateQuery,
  mapReconciliationOrder,
  scanStuckOrders,
} = require("../services/reconciliationScanner");
const {
  RESERVATION_WINDOW_MS,
  resolveCheckoutItems,
  reserveInventory,
  releaseInventoryItems,
  commitOrderInventory,
  releaseOrderInventory,
} = require("../services/checkoutInventory");

const allowedStatuses = [
  "Pending",
  "Confirmed",
  "Packed",
  "Shipped",
  "Out for delivery",
  "Delivered",
  "Cancelled",
  "Returned",
];

const PAYMENT_CONFIRMATION_LOCK_WINDOW_MS = 2 * 60 * 1000;

const activeFulfillmentStatuses = [
  "Pending",
  "Confirmed",
  "Packed",
  "Shipped",
  "Out for delivery",
  "Delivered",
];

const PUBLIC_TRACKING_LOOKUP_ERROR = "Order not found or lookup details do not match";

const cancellableStatuses = ["Pending", "Confirmed", "Packed"];

const canTransitionOrderStatus = (currentStatus, nextStatus) => {
  if (!nextStatus || currentStatus === nextStatus) {
    return true;
  }

  if (nextStatus === "Cancelled") {
    return cancellableStatuses.includes(currentStatus);
  }

  if (nextStatus === "Returned") {
    return currentStatus === "Delivered";
  }

  if (["Cancelled", "Returned", "Delivered"].includes(currentStatus)) {
    return false;
  }

  const currentIndex = activeFulfillmentStatuses.indexOf(currentStatus);
  const nextIndex = activeFulfillmentStatuses.indexOf(nextStatus);

  return currentIndex >= 0 && nextIndex > currentIndex;
};

const buildTrackingTimeline = (order) => {
  const baseSteps = [
    { key: "placed", label: "Order placed", status: "completed" },
    { key: "confirmed", label: "Confirmed", status: "upcoming" },
    { key: "packed", label: "Packed", status: "upcoming" },
    { key: "shipped", label: "Shipped", status: "upcoming" },
    { key: "out-for-delivery", label: "Out for delivery", status: "upcoming" },
    { key: "delivered", label: "Delivered", status: "upcoming" },
  ];

  const statusIndexMap = {
    Pending: 0,
    Confirmed: 1,
    Packed: 2,
    Shipped: 3,
    "Out for delivery": 4,
    Delivered: 5,
  };

  if (order.orderStatus === "Cancelled") {
    return [
      { key: "placed", label: "Order placed", status: "completed" },
      { key: "cancelled", label: "Cancelled", status: "current" },
    ];
  }

  if (order.orderStatus === "Returned") {
    return [
      { key: "placed", label: "Order placed", status: "completed" },
      { key: "returned", label: "Returned", status: "current" },
    ];
  }

  const activeIndex = statusIndexMap[order.orderStatus] ?? 0;

  return baseSteps.map((step, index) => ({
    ...step,
    status:
      index < activeIndex
        ? "completed"
        : index === activeIndex
          ? "current"
          : "upcoming",
  }));
};

const getCartItemProductId = (item) =>
  item?.productId?._id?.toString?.() || item?.productId?.toString?.() || "";

const buildCustomerOrderProducts = (products = []) =>
  products.map((item) => ({
    productId: item.productId?.toString?.() || String(item.productId || ""),
    quantity: item.quantity,
    size: item.size || "",
    color: item.color || "",
    fit: item.fit || "",
    price: paiseToRupees(getPaiseValue(item, "pricePaise", "price")),
    pricePaise: getPaiseValue(item, "pricePaise", "price"),
    name: item.name,
    image: item.image || "",
  }));

const maskEmail = (value = "") => {
  const [localPart = "", domain = ""] = String(value || "").split("@");
  if (!localPart || !domain) {
    return "";
  }
  return `${localPart.slice(0, 2)}${localPart.length > 2 ? "***" : "*"}@${domain}`;
};

const maskPhone = (value = "") => {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length < 4) {
    return "";
  }
  return `******${digits.slice(-4)}`;
};

const maskName = (value = "") => {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return "";
  }
  return `${normalized.slice(0, 1)}${normalized.length > 1 ? "***" : ""}`;
};

const buildPublicShippingAddress = (order) => {
  const details = order.shippingAddressDetails || {};
  const locality = [details.city, details.state, details.pincode].filter(Boolean).join(", ");

  return locality || "Delivery address verified for this order.";
};

const buildCustomerOrderResponse = (order) => ({
  id: order.id || order._id.toString(),
  orderNumber: order.orderNumber || null,
  customerName: order.customerName,
  customerEmail: order.customerEmail,
  customerPhone: order.customerPhone,
  paymentStatus: order.paymentStatus,
  orderStatus: order.orderStatus,
  shippingAddress: order.shippingAddress,
  shippingAddressDetails: order.shippingAddressDetails,
  paymentMethod: order.paymentMethod,
  courierName: order.courierName,
  trackingId: order.trackingId,
  trackingUrl: order.trackingUrl,
  totalAmount: order.totalAmount,
  totalPaise: getPaiseValue(order, "totalPaise", "totalAmount"),
  products: buildCustomerOrderProducts(order.products),
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  timeline: buildTrackingTimeline(order),
});

const buildPublicTrackingResponse = (order) => {
  const response = buildCustomerOrderResponse(order);
  delete response.shippingAddressDetails;

  return {
    ...response,
    customerName: maskName(order.customerName),
    customerEmail: maskEmail(order.customerEmail),
    customerPhone: maskPhone(order.customerPhone),
    shippingAddress: buildPublicShippingAddress(order),
  };
};

const cleanShippingText = (value, maxLength = 160) =>
  String(value || "").trim().slice(0, maxLength);

const normalizeShippingAddress = (shippingInfo = {}) => {
  if (typeof shippingInfo.address === "string") {
    return {
      shippingAddress: shippingInfo.address.trim(),
      shippingAddressDetails: {
        label: "Home",
        fullName: cleanShippingText(shippingInfo.fullName, 100),
        mobile: cleanShippingText(shippingInfo.phone, 20),
        pincode: "",
        city: "",
        state: "",
        house: cleanShippingText(shippingInfo.address, 240),
        area: "",
        landmark: "",
      },
    };
  }

  const addressDetails = {
    label: ["Home", "Work", "Other"].includes(shippingInfo.address?.label)
      ? shippingInfo.address.label
      : "Home",
    fullName: cleanShippingText(shippingInfo.address?.fullName || shippingInfo.fullName, 100),
    mobile: cleanShippingText(shippingInfo.address?.mobile || shippingInfo.phone, 20),
    pincode: cleanShippingText(shippingInfo.address?.pincode, 6),
    city: cleanShippingText(shippingInfo.address?.city, 100),
    state: cleanShippingText(shippingInfo.address?.state, 100),
    house: cleanShippingText(shippingInfo.address?.house, 240),
    area: cleanShippingText(shippingInfo.address?.area, 160),
    landmark: cleanShippingText(shippingInfo.address?.landmark, 160),
  };

  return {
    shippingAddress: [
      addressDetails.house,
      addressDetails.area,
      addressDetails.landmark,
      addressDetails.city,
      addressDetails.state,
      addressDetails.pincode,
    ]
      .filter(Boolean)
      .join(", "),
    shippingAddressDetails: addressDetails,
  };
};

const buildRedirectUrl = (path, orderId) =>
  `${env.CLIENT_URL}${path}?orderId=${encodeURIComponent(orderId)}`;

const getRazorpayClient = () => {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new AppError("Razorpay is not configured", 500);
  }

  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
};

const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return safelyCompareSignatures(expectedSignature, signature);
};

const safelyCompareSignatures = (expectedSignature, receivedSignature) => {
  const expected = Buffer.from(String(expectedSignature || ""), "utf8");
  const received = Buffer.from(String(receivedSignature || ""), "utf8");

  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
};

const createCheckoutStateToken = (order) =>
  crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${order._id.toString()}|${order.checkoutSessionId}`)
    .digest("hex");

const assertCheckoutStateToken = (order, token) => {
  if (!safelyCompareSignatures(createCheckoutStateToken(order), token)) {
    throw new AppError("Checkout state is invalid or expired", 403);
  }
};

const findOrderByReference = async (orderReference) => {
  const normalized = String(orderReference || "").trim();

  if (!normalized) {
    return null;
  }

  if (/^\d+$/.test(normalized)) {
    const orderByNumber = await Order.findOne({ orderNumber: Number(normalized) });

    if (orderByNumber) {
      return orderByNumber;
    }
  }

  return Order.findById(normalized);
};

const recordCheckoutLog = (order, event, source, payload = {}) => {
  order.checkoutLogs.push({
    event,
    source,
    payload,
  });
};

const summarizeRazorpayPayment = (payment = {}) => ({
  id: payment.id || "",
  status: payment.status || "",
  amount: Number(payment.amount) || 0,
  currency: String(payment.currency || "").toUpperCase(),
  method: payment.method || "",
  captured: Boolean(payment.captured),
  createdAt: payment.created_at ? new Date(Number(payment.created_at) * 1000) : null,
  errorCode: payment.error_code || "",
  errorDescription: payment.error_description || "",
});

const selectRazorpayPaymentForOrder = (order, response) => {
  const expectedAmount = getPaiseValue(order, "totalPaise", "totalAmount");
  const expectedCurrency = env.RAZORPAY_CURRENCY;
  const payments = Array.isArray(response?.items)
    ? [...response.items].sort((left, right) => Number(right.created_at || 0) - Number(left.created_at || 0))
    : [];
  const capturedPayments = payments.filter(
    (payment) =>
      payment.status === "captured" &&
      payment.captured === true
  );
  const capturedPayment = capturedPayments.find(
    (payment) =>
      Number(payment.amount) === expectedAmount &&
      String(payment.currency || "").toUpperCase() === expectedCurrency
  );
  const amountMismatchPayment = capturedPayments.find(
    (payment) =>
      Number(payment.amount) !== expectedAmount &&
      String(payment.currency || "").toUpperCase() === expectedCurrency
  );
  const currencyMismatchPayment = capturedPayments.find(
    (payment) =>
      Number(payment.amount) === expectedAmount &&
      String(payment.currency || "").toUpperCase() !== expectedCurrency
  );
  const failedPayment = payments.find((payment) => payment.status === "failed");

  return {
    capturedPayment,
    amountMismatchPayment,
    currencyMismatchPayment,
    failedPayment,
    latestPayment: payments[0] || null,
    paymentCount: payments.length,
  };
};

async function runWithOptionalTransaction(work) {
  let session = null;

  try {
    session = await mongoose.startSession();
    let result;
    try {
      await session.withTransaction(async () => {
        result = await work(session);
      });
    } catch (error) {
      const message = String(error?.message || "");
      const transactionUnsupported =
        /transaction numbers|replica set|sharded cluster|transactions are not supported/i.test(message);
      if (!transactionUnsupported) {
        throw error;
      }
      result = await work(null);
    }
    return result;
  } catch (error) {
    if (session) {
      throw error;
    }
    return work(null);
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}

const hasTrackedInventory = (order) =>
  (order.products || []).some((item) => item.inventoryTracked);

const isReservationExpired = (order) =>
  order.inventoryReservationExpiresAt &&
  order.inventoryReservationExpiresAt.getTime() < Date.now();

const getPaymentConfirmationInventoryBlocker = (order) => {
  if (!hasTrackedInventory(order)) {
    return "";
  }

  if (order.inventoryReservationStatus === "committed") {
    return "";
  }

  if (order.inventoryReservationStatus !== "reserved") {
    return "reservation-missing";
  }

  if (isReservationExpired(order)) {
    return "reservation-expired";
  }

  return "";
};

const markPaymentConfirmationManualReview = (order, source, reason, payload = {}) => {
  const message =
    reason === "reservation-expired"
      ? "Captured payment requires manual review because the inventory reservation has expired."
      : "Captured payment requires manual review because the inventory reservation is unavailable.";
  const error = new AppError(message, 409);

  order.paymentReconciliationResultCode =
    RECONCILIATION_RESULT_CODES.MANUAL_REVIEW_REQUIRED;
  if (payload.paymentId) {
    order.paymentProviderPaymentId = payload.paymentId;
    order.paymentCapturedAt = order.paymentCapturedAt || new Date();
  }
  recordCheckoutLog(order, "payment_confirmation_manual_review", source, {
    reason,
    resultCode: RECONCILIATION_RESULT_CODES.MANUAL_REVIEW_REQUIRED,
    ...payload,
  });
  recordMetric("payment.confirmation.manual_review", {
    orderId: order._id?.toString?.() || "",
    source,
    reason,
  });
  captureError(error, {
    component: "payment",
    operation: "confirm-captured-payment",
    orderId: order._id?.toString?.() || "",
    checkoutSessionId: order.checkoutSessionId || "",
    source,
    reason,
  });

  return error;
};

const createReconciliationLockId = () =>
  typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : crypto.randomBytes(16).toString("hex");

const createPaymentConfirmationLockId = () =>
  typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : crypto.randomBytes(16).toString("hex");

const getReconciliationActorId = (req) =>
  mongoose.Types.ObjectId.isValid(req.user?._id) ? req.user._id : null;

const assertReconciliationLockOwner = (order, lockId) => {
  if (!lockId) {
    return;
  }

  if (String(order.paymentReconciliationLockId || "") !== lockId) {
    throw new AppError("Payment reconciliation lock ownership changed. Please retry.", 409);
  }
};

const setReconciliationResult = (order, resultCode, lockId) => {
  assertReconciliationLockOwner(order, lockId);
  order.paymentReconciliationResultCode = resultCode;
  order.paymentReconciliationStartedAt = null;
  order.paymentReconciliationLockId = "";
  order.paymentReconciliationActorId = null;
};

const buildReconciliationSaveSet = (order) => ({
  paymentStatus: order.paymentStatus,
  orderStatus: order.orderStatus,
  checkoutUrl: order.checkoutUrl,
  inventoryReservationStatus: order.inventoryReservationStatus,
  inventoryReservationExpiresAt: order.inventoryReservationExpiresAt,
  paymentReconciliationResultCode: order.paymentReconciliationResultCode,
  paymentReconciliationStartedAt: order.paymentReconciliationStartedAt,
  paymentReconciliationLockId: order.paymentReconciliationLockId,
  paymentReconciliationActorId: order.paymentReconciliationActorId,
  checkoutLogs: order.checkoutLogs,
});

const buildPaymentConfirmationSaveSet = (order) => ({
  paymentStatus: order.paymentStatus,
  orderStatus: order.orderStatus,
  checkoutUrl: order.checkoutUrl,
  inventoryReservationStatus: order.inventoryReservationStatus,
  inventoryReservationExpiresAt: order.inventoryReservationExpiresAt,
  paymentReconciliationResultCode: order.paymentReconciliationResultCode,
  paymentProviderPaymentId: order.paymentProviderPaymentId || "",
  paymentCapturedAt: order.paymentCapturedAt || null,
  paymentConfirmationStartedAt: null,
  paymentConfirmationLockId: "",
  checkoutLogs: order.checkoutLogs,
});

const acquirePaymentConfirmationLock = async (orderId) => {
  const lockId = createPaymentConfirmationLockId();
  const lockCutoff = new Date(Date.now() - PAYMENT_CONFIRMATION_LOCK_WINDOW_MS);
  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      paymentStatus: { $ne: "paid" },
      $or: [
        { paymentConfirmationStartedAt: null },
        { paymentConfirmationStartedAt: { $exists: false } },
        { paymentConfirmationStartedAt: { $lte: lockCutoff } },
      ],
    },
    {
      $set: {
        paymentConfirmationStartedAt: new Date(),
        paymentConfirmationLockId: lockId,
      },
    },
    { new: true }
  );

  return { order, lockId };
};

const savePaymentConfirmationResult = async (order, lockId, options = {}) => {
  const updatedOrder = await Order.findOneAndUpdate(
    {
      _id: order._id,
      paymentConfirmationLockId: lockId,
    },
    { $set: buildPaymentConfirmationSaveSet(order) },
    {
      new: true,
      runValidators: true,
      ...(options.session ? { session: options.session } : {}),
    }
  );

  if (!updatedOrder) {
    throw new AppError("Payment confirmation lock ownership changed. Please retry.", 409);
  }

  return updatedOrder;
};

const clearPaymentConfirmationLock = async (order, lockId) => {
  if (!lockId) {
    return order;
  }

  const updatedOrder = await Order.findOneAndUpdate(
    {
      _id: order._id,
      paymentConfirmationLockId: lockId,
    },
    {
      $set: {
        paymentConfirmationStartedAt: null,
        paymentConfirmationLockId: "",
      },
    },
    { new: true }
  );

  return updatedOrder || order;
};

const saveReconciledOrder = async (order, lockId, options = {}) => {
  if (order.paymentReconciliationLockId) {
    assertReconciliationLockOwner(order, lockId);
  }

  const updatedOrder = await Order.findOneAndUpdate(
    {
      _id: order._id,
      paymentReconciliationLockId: lockId,
    },
    { $set: buildReconciliationSaveSet(order) },
    {
      new: true,
      runValidators: true,
      ...(options.session ? { session: options.session } : {}),
    }
  );

  if (!updatedOrder) {
    throw new AppError("Payment reconciliation lock ownership changed. Please retry.", 409);
  }

  return updatedOrder;
};

const escapeRegExp = (value) =>
  String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseDateFilter = (from, to) => {
  const createdAt = {};
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;

  if (fromDate && !Number.isNaN(fromDate.getTime())) {
    createdAt.$gte = fromDate;
  }

  if (toDate && !Number.isNaN(toDate.getTime())) {
    createdAt.$lte = toDate;
  }

  return Object.keys(createdAt).length > 0 ? createdAt : null;
};

const adminOrderPaymentStatuses = ["pending", "initiated", "paid", "failed", "cancelled"];

const normalizeAllowedAdminFilter = (value, allowedValues) => {
  const normalized = String(value || "").trim();

  return allowedValues.includes(normalized) ? normalized : "";
};

const buildAdminOrderFilter = (query = {}) => {
  const filter = {};
  const clauses = [];
  const orderStatus = normalizeAllowedAdminFilter(
    query.orderStatus || query.status,
    allowedStatuses
  );
  const paymentStatus = normalizeAllowedAdminFilter(
    query.paymentStatus || query.payment,
    adminOrderPaymentStatuses
  );
  const search = String(query.search || query.query || query.q || "").trim();
  const createdAt = parseDateFilter(query.from, query.to);

  if (orderStatus) {
    filter.orderStatus = orderStatus;
  }

  if (paymentStatus) {
    filter.paymentStatus = paymentStatus;
  }

  if (createdAt) {
    filter.createdAt = createdAt;
  }

  if (search) {
    const searchRegex = new RegExp(escapeRegExp(search.slice(0, 100)), "i");
    const searchClauses = [
      { customerName: searchRegex },
      { customerEmail: searchRegex },
      { customerPhone: searchRegex },
      { courierName: searchRegex },
      { trackingId: searchRegex },
      { paymentProviderPaymentId: searchRegex },
      { checkoutSessionId: searchRegex },
      { "products.name": searchRegex },
      { "products.sku": searchRegex },
    ];

    if (/^\d+$/.test(search)) {
      searchClauses.push({ orderNumber: Number(search) });
    }

    if (mongoose.Types.ObjectId.isValid(search)) {
      searchClauses.push({ _id: search });
    }

    clauses.push({ $or: searchClauses });
  }

  if (clauses.length > 0) {
    filter.$and = clauses;
  }

  return filter;
};

const buildAdminOrderSort = (query = {}) => {
  switch (String(query.sort || "").trim()) {
    case "oldest":
      return { createdAt: 1 };
    case "value-desc":
      return { totalPaise: -1, totalAmount: -1, createdAt: -1 };
    case "value-asc":
      return { totalPaise: 1, totalAmount: 1, createdAt: -1 };
    case "status":
      return { orderStatus: 1, createdAt: -1 };
    default:
      return { createdAt: -1 };
  }
};

const buildReconciliationFilter = (query = {}, now = Date.now()) => {
  const filter = {};
  const clauses = [];

  if (query.resultCode) {
    filter.paymentReconciliationResultCode = String(query.resultCode).trim();
  }

  if (query.paymentStatus) {
    filter.paymentStatus = String(query.paymentStatus).trim();
  }

  if (query.orderStatus) {
    filter.orderStatus = String(query.orderStatus).trim();
  }

  if (query.checkoutProvider) {
    filter.checkoutProvider = String(query.checkoutProvider).trim();
  }

  const createdAt = parseDateFilter(query.from, query.to);
  if (createdAt) {
    filter.createdAt = createdAt;
  }

  const search = String(query.search || "").trim();
  if (search) {
    const searchRegex = new RegExp(escapeRegExp(search), "i");
    const searchClauses = [
      { customerName: searchRegex },
      { customerEmail: searchRegex },
      { customerPhone: searchRegex },
      { checkoutSessionId: searchRegex },
    ];
    if (/^\d+$/.test(search)) {
      searchClauses.push({ orderNumber: Number(search) });
    }
    clauses.push({ $or: searchClauses });
  }

  const includeAll = ["true", "1", "yes"].includes(
    String(query.includeAll || "").trim().toLowerCase()
  );
  if (!includeAll) {
    clauses.push(buildReviewCandidateQuery(now));
  }

  if (clauses.length > 0) {
    filter.$and = clauses;
  }

  return filter;
};

const normalizeOrderIdList = (value) => {
  const rawIds = Array.isArray(value) ? value : [];
  return Array.from(
    new Set(
      rawIds
        .map((id) => String(id || "").trim())
        .filter(Boolean)
    )
  );
};

const sendOrderEmail = async (order, subject, summaryLine) => {
  if (!order.customerEmail) {
    return;
  }

  const delivery = await sendEmail({
    to: order.customerEmail,
    subject,
    text: `${summaryLine}\nOrder #${order.orderNumber || order._id.toString()}\nTotal: Rs. ${order.totalAmount}`,
    html: buildOrderStatusEmail({
      order,
      summaryLine,
    }),
  });

  if (!delivery.delivered) {
    const error = new Error(delivery.reason || "Order email delivery failed");
    error.code = "ORDER_EMAIL_NOT_DELIVERED";
    throw error;
  }
};

const safelySendOrderEmail = async (order, subject, summaryLine) => {
  try {
    await sendOrderEmail(order, subject, summaryLine);
  } catch (error) {
    logEvent("order.email.failed", {
      orderId: order?._id?.toString?.(),
      orderNumber: order?.orderNumber,
      message: error?.message,
      code: error?.code,
      responseCode: error?.responseCode,
    }, "error");
  }
};

const getMyOrders = asyncHandler(async (req, res) => {
  const paginationParams = parsePaginationQuery(req.query, {
    defaultLimit: 50,
    maxLimit: 100,
  });
  const filter = { userId: req.user._id };
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(paginationParams.skip)
      .limit(paginationParams.limit),
    Order.countDocuments(filter),
  ]);
  const pagination = buildPaginationMeta({
    page: paginationParams.page,
    limit: paginationParams.limit,
    total,
  });

  return sendListResponse(
    res,
    req.query,
    orders.map(buildCustomerOrderResponse),
    pagination
  );
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .select("-checkoutLogs")
    .populate("userId", "name email phone address");

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  const isOwner = order.userId?._id?.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (isAdmin && !hasAdminPermission(req.user, "orders.view")) {
    throw new AppError("You do not have permission to view this order", 403);
  }

  if (!isOwner && !isAdmin) {
    throw new AppError("Not authorized to view this order", 403);
  }

  return res.json(isAdmin ? order : buildCustomerOrderResponse(order));
});

const downloadInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    "userId",
    "name email phone address"
  );

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  const isOwner = order.userId?._id?.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (isAdmin && !hasAdminPermission(req.user, "orders.view")) {
    throw new AppError("You do not have permission to download this invoice", 403);
  }

  if (!isOwner && !isAdmin) {
    throw new AppError("Not authorized to download this invoice", 403);
  }

  const invoiceRef = order.orderNumber || order._id.toString();
  const pdfBuffer = buildInvoicePdf(order);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="hrushe-invoice-${invoiceRef}.pdf"`
  );

  return res.send(pdfBuffer);
});

const trackOrder = asyncHandler(async (req, res) => {
  const { orderId, email, phone } = req.body;

  if (!orderId) {
    throw new AppError("Order id is required", 400);
  }

  if (!email && !phone) {
    throw new AppError("Email or phone is required", 400);
  }

  const order = await findOrderByReference(orderId);

  if (!order) {
    throw new AppError(PUBLIC_TRACKING_LOOKUP_ERROR, 404);
  }

  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  const normalizedPhone = String(phone || "")
    .trim();

  const matchesEmail =
    normalizedEmail && order.customerEmail.toLowerCase() === normalizedEmail;
  const matchesPhone =
    normalizedPhone && String(order.customerPhone || "").trim() === normalizedPhone;

  if (!matchesEmail && !matchesPhone) {
    throw new AppError(PUBLIC_TRACKING_LOOKUP_ERROR, 404);
  }

  return res.json(buildPublicTrackingResponse(order));
});

const getAllOrders = asyncHandler(async (req, res) => {
  const paginationParams = parsePaginationQuery(req.query, {
    defaultLimit: 100,
    maxLimit: 100,
  });
  const filter = buildAdminOrderFilter(req.query);
  const sort = buildAdminOrderSort(req.query);
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .select("-checkoutLogs -checkoutUrl")
      .populate("userId", "name email phone address")
      .sort(sort)
      .skip(paginationParams.skip)
      .limit(paginationParams.limit),
    Order.countDocuments(filter),
  ]);
  const pagination = buildPaginationMeta({
    page: paginationParams.page,
    limit: paginationParams.limit,
    total,
  });

  return sendListResponse(res, req.query, orders, pagination);
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus, trackingId, courierName, trackingUrl } = req.body;

  const update = {};

  if (orderStatus !== undefined && !allowedStatuses.includes(orderStatus)) {
    throw new AppError("Invalid order status", 400);
  }

  if (orderStatus !== undefined) {
    update.orderStatus = orderStatus;
  }

  if (trackingId !== undefined) {
    update.trackingId = String(trackingId || "").trim().slice(0, 120);
  }

  if (courierName !== undefined) {
    update.courierName = String(courierName || "").trim().slice(0, 100);
  }

  if (trackingUrl !== undefined) {
    const normalizedTrackingUrl = String(trackingUrl || "").trim();
    if (normalizedTrackingUrl) {
      let parsedTrackingUrl;
      try {
        parsedTrackingUrl = new URL(normalizedTrackingUrl);
      } catch {
        throw new AppError("Tracking URL must be a valid HTTPS URL", 400);
      }
      if (parsedTrackingUrl.protocol !== "https:") {
        throw new AppError("Tracking URL must use HTTPS", 400);
      }
    }
    update.trackingUrl = normalizedTrackingUrl.slice(0, 500);
  }

  const existingOrder = await Order.findById(req.params.id);
  if (!existingOrder) {
    throw new AppError("Order not found", 404);
  }

  if (orderStatus !== undefined && !canTransitionOrderStatus(existingOrder.orderStatus, orderStatus)) {
    throw new AppError(
      `Invalid order status transition from ${existingOrder.orderStatus} to ${orderStatus}`,
      409
    );
  }

  const paidFulfillmentStatuses = ["Confirmed", "Packed", "Shipped", "Out for delivery", "Delivered"];
  if (
    orderStatus &&
    paidFulfillmentStatuses.includes(orderStatus) &&
    existingOrder.paymentStatus !== "paid"
  ) {
    throw new AppError("Unpaid orders cannot enter fulfillment", 409);
  }

  const updateFilter = { _id: req.params.id };
  if (orderStatus !== undefined) {
    updateFilter.orderStatus = existingOrder.orderStatus;
  }
  if (orderStatus && paidFulfillmentStatuses.includes(orderStatus)) {
    updateFilter.paymentStatus = "paid";
  }

  const order = await Order.findOneAndUpdate(updateFilter, update, {
    new: true,
    runValidators: true,
  });

  if (!order) {
    if (orderStatus !== undefined) {
      throw new AppError("Order status changed while this update was being processed. Please refresh and retry.", 409);
    }
    throw new AppError("Order not found", 404);
  }

  await recordAuditLog(req, "order.status-change", { type: "order", id: order._id }, {
    orderStatus: order.orderStatus,
    trackingId: order.trackingId,
    courierName: order.courierName,
  });

  if (
    orderStatus !== undefined ||
    trackingId !== undefined ||
    courierName !== undefined ||
    trackingUrl !== undefined
  ) {
    await safelySendOrderEmail(
      order,
      `Your HRUSHE order is now ${order.orderStatus}`,
      `Your order status has been updated to ${order.orderStatus}.`
    );
  }

  return res.json(order);
});

const createCheckout = asyncHandler(async (req, res) => {
  const { shippingInfo, items } = req.body;

  if (!shippingInfo) {
    throw new AppError("Shipping information is required", 400);
  }

  const fullName = String(shippingInfo.fullName || "").trim();
  const email = String(shippingInfo.email || "").trim().toLowerCase();
  const phone = String(shippingInfo.phone || "").replace(/\D/g, "").slice(-10);
  const paymentMethod = "Razorpay";
  const { shippingAddress, shippingAddressDetails } = normalizeShippingAddress(shippingInfo);

  if (!fullName || !email || !phone || !shippingAddress) {
    throw new AppError("Full name, email, phone, and address are required", 400);
  }

  if (fullName.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError("Enter a valid name and email address", 400);
  }

  if (!/^[6-9]\d{9}$/.test(phone)) {
    throw new AppError("Enter a valid 10-digit Indian phone number", 400);
  }

  if (!/^\d{6}$/.test(shippingAddressDetails.pincode)) {
    throw new AppError("Enter a valid 6-digit Indian pincode", 400);
  }

  if (
    !shippingAddressDetails.house ||
    !shippingAddressDetails.area ||
    !shippingAddressDetails.city ||
    !shippingAddressDetails.state
  ) {
    throw new AppError("House, area, city, and state are required", 400);
  }

  shippingAddressDetails.fullName = fullName;
  shippingAddressDetails.mobile = phone;

  if (shippingAddress.length > 600) {
    throw new AppError("Shipping address is too long", 400);
  }

  const normalizedItems = await resolveCheckoutItems(items);

  const totals = calculateOrderTotals({ items: normalizedItems });
  const totalAmount = paiseToRupees(totals.totalPaise);

  const hasInventoryReservation = await reserveInventory(normalizedItems);

  const razorpay = getRazorpayClient();
  let razorpayOrder;

  try {
    razorpayOrder = await razorpay.orders.create({
      amount: totals.totalPaise,
      currency: env.RAZORPAY_CURRENCY,
      receipt: `hrushe_${Date.now().toString(36)}`,
      notes: {
        customerName: fullName,
        customerEmail: email,
        customerPhone: phone,
      },
    });
  } catch (error) {
    if (hasInventoryReservation) {
      await releaseInventoryItems(normalizedItems);
    }
    logEvent("payment.razorpay_order.creation_failed", {
      message:
        error?.error?.description ||
        error?.description ||
        error?.message ||
        "Unknown Razorpay error",
      code: error?.error?.code || error?.code,
      field: error?.error?.field,
      source: error?.error?.source,
      step: error?.error?.step,
      reason: error?.error?.reason,
      statusCode: error?.statusCode || error?.error?.statusCode,
      metadata: error?.error?.metadata,
    }, "error");
    captureError(error, {
      component: "razorpay",
      operation: "orders.create",
      amountPaise: totals.totalPaise,
    });

    throw new AppError(
      error?.error?.description ||
        error?.description ||
        "Could not create Razorpay order. Please verify Razorpay keys and account setup.",
      502
    );
  }

  let order;

  try {
    order = await Order.create({
      userId: req.user?._id || null,
      products: normalizedItems,
      totalAmount,
      subtotalPaise: totals.subtotalPaise,
      discountPaise: totals.discountPaise,
      shippingPaise: totals.shippingPaise,
      taxPaise: totals.taxPaise,
      totalPaise: totals.totalPaise,
      shippingAddress,
      shippingAddressDetails,
      customerName: fullName,
      customerEmail: email,
      customerPhone: phone,
      paymentMethod,
      paymentStatus: "initiated",
      checkoutProvider: "razorpay",
      checkoutSessionId: razorpayOrder.id,
      checkoutUrl: "",
      inventoryReservationStatus: hasInventoryReservation ? "reserved" : "none",
      inventoryReservationExpiresAt: hasInventoryReservation
        ? new Date(Date.now() + RESERVATION_WINDOW_MS)
        : null,
      checkoutLogs: [
        {
          event: "checkout_created",
          source: "backend",
          payload: {
            shippingInfo: { ...shippingInfo, shippingAddress, shippingAddressDetails },
            items: normalizedItems,
            razorpayOrderId: razorpayOrder.id,
          },
        },
      ],
    });
  } catch (error) {
    if (hasInventoryReservation) {
      await releaseInventoryItems(normalizedItems);
    }
    throw error;
  }

  recordMetric("checkout.created", {
    orderId: order._id.toString(),
    checkoutProvider: order.checkoutProvider,
    amountPaise: totals.totalPaise,
    inventoryReserved: hasInventoryReservation,
  });
  logEvent("checkout.created", {
    orderId: order._id.toString(),
    orderNumber: order.orderNumber || null,
    checkoutProvider: order.checkoutProvider,
    checkoutSessionId: order.checkoutSessionId,
    amountPaise: totals.totalPaise,
  });

  return res.status(201).json({
    appOrderId: order.id,
    orderId: order.orderNumber || order.id,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    key: env.RAZORPAY_KEY_ID,
    customer: {
      name: fullName,
      email,
      phone,
    },
    paymentStatus: order.paymentStatus,
    mode: "provider",
    checkoutState: createCheckoutStateToken(order),
  });
});

const getCheckoutPaymentConfig = asyncHandler(async (req, res) => {
  const keyId = String(env.RAZORPAY_KEY_ID || "");
  const keyPrefix = keyId.startsWith("rzp_test_")
    ? "rzp_test_"
    : keyId.startsWith("rzp_live_")
      ? "rzp_live_"
      : keyId
        ? "unknown"
        : "";
  const mode = keyPrefix === "rzp_test_"
    ? "test"
    : keyPrefix === "rzp_live_"
      ? "live"
      : "unknown";

  return res.json({
    provider: "razorpay",
    configured: Boolean(keyId && env.RAZORPAY_KEY_SECRET),
    keyPrefix,
    mode,
    currency: env.RAZORPAY_CURRENCY,
  });
});

const verifyCheckout = asyncHandler(async (req, res) => {
  const {
    appOrderId,
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature,
  } = req.body;

  if (!appOrderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new AppError("Razorpay verification details are required", 400);
  }

  const order = await Order.findById(appOrderId);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.checkoutSessionId !== razorpayOrderId) {
    throw new AppError("Checkout session mismatch", 400);
  }

  if (order.paymentStatus === "paid") {
    return res.json({
      success: true,
      redirectUrl: buildRedirectUrl(
        "/checkout/success",
        String(order.orderNumber || order._id.toString())
      ),
    });
  }

  const isValidSignature = verifyRazorpaySignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });

  if (!isValidSignature) {
    throw new AppError("Invalid Razorpay payment signature", 400);
  }

  const { order: lockedOrder, lockId } = await acquirePaymentConfirmationLock(order._id);
  if (!lockedOrder) {
    const latestOrder = await Order.findById(order._id);
    if (latestOrder?.paymentStatus === "paid") {
      return res.json({
        success: true,
        redirectUrl: buildRedirectUrl(
          "/checkout/success",
          String(latestOrder.orderNumber || latestOrder._id.toString())
        ),
      });
    }
    throw new AppError("Payment confirmation is already in progress. Please retry shortly.", 409);
  }

  const inventoryBlocker = getPaymentConfirmationInventoryBlocker(lockedOrder);
  if (inventoryBlocker) {
    const error = markPaymentConfirmationManualReview(lockedOrder, "backend", inventoryBlocker, {
      razorpayOrderId,
      razorpayPaymentId,
      paymentId: razorpayPaymentId,
    });
    await savePaymentConfirmationResult(lockedOrder, lockId);
    throw error;
  }

  let confirmedOrder = lockedOrder;
  try {
    await runWithOptionalTransaction(async (session) => {
      await commitOrderInventory(lockedOrder, { session });
      lockedOrder.paymentStatus = "paid";
      lockedOrder.orderStatus = "Confirmed";
      lockedOrder.checkoutUrl = "";
      lockedOrder.paymentProviderPaymentId = razorpayPaymentId;
      lockedOrder.paymentCapturedAt = lockedOrder.paymentCapturedAt || new Date();
      recordCheckoutLog(lockedOrder, "razorpay_payment_verified", "backend", {
        razorpayOrderId,
        razorpayPaymentId,
      });
      confirmedOrder = await savePaymentConfirmationResult(lockedOrder, lockId, { session });
    });
  } catch (error) {
    if (lockedOrder.paymentStatus === "paid") {
      lockedOrder.paymentStatus = "initiated";
    }
    if (lockedOrder.orderStatus === "Confirmed") {
      lockedOrder.orderStatus = "Pending";
    }
    const reviewError = markPaymentConfirmationManualReview(
      lockedOrder,
      "backend",
      "inventory-commit-failed",
      {
        razorpayOrderId,
        razorpayPaymentId,
        paymentId: razorpayPaymentId,
        message: error?.message || "Inventory commit failed",
      }
    );
    await savePaymentConfirmationResult(lockedOrder, lockId).catch(() =>
      clearPaymentConfirmationLock(lockedOrder, lockId)
    );
    throw reviewError;
  }

  if (confirmedOrder.userId) {
    await Cart.findOneAndUpdate({ userId: confirmedOrder.userId }, { items: [] });
  }
  await safelySendOrderEmail(
    confirmedOrder,
    "Your HRUSHE order is confirmed",
    "Thank you for shopping with HRUSHE. Your order has been confirmed."
  );
  recordMetric("payment.verified", {
    orderId: confirmedOrder._id.toString(),
    checkoutProvider: confirmedOrder.checkoutProvider,
    amountPaise: getPaiseValue(confirmedOrder, "totalPaise", "totalAmount"),
  });
  logEvent("payment.verified", {
    orderId: confirmedOrder._id.toString(),
    orderNumber: confirmedOrder.orderNumber || null,
    checkoutProvider: confirmedOrder.checkoutProvider,
    checkoutSessionId: confirmedOrder.checkoutSessionId,
  });

  return res.json({
    success: true,
    redirectUrl: buildRedirectUrl(
      "/checkout/success",
      String(confirmedOrder.orderNumber || confirmedOrder._id.toString())
    ),
  });
});

const failCheckout = asyncHandler(async (req, res) => {
  const orderId = req.body?.appOrderId || req.query.orderId;
  const checkoutState = req.body?.checkoutState || req.query.checkoutState;

  if (!orderId) {
    throw new AppError("Order id is required", 400);
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  assertCheckoutStateToken(order, checkoutState);

  if (order.paymentStatus !== "paid") {
    // Browser failure callbacks are not authoritative; Razorpay can still send
    // a captured webhook after a customer closes or fails the checkout window.
    // Keep the reservation until provider failure or expiry so late captures can
    // still safely commit inventory.
    order.paymentStatus = req.method === "POST" ? "cancelled" : "failed";
  }
  recordCheckoutLog(order, "checkout_failure_return", "redirect", req.query);
  await order.save();

  if (req.method === "POST") {
    return res.json({ success: true });
  }

  return res.redirect(
    buildRedirectUrl("/checkout/failure", String(order.orderNumber || order._id.toString()))
  );
});

const cancelCheckout = asyncHandler(async (req, res) => {
  const { orderId, checkoutState } = req.query;

  if (!orderId) {
    throw new AppError("Order id is required", 400);
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  assertCheckoutStateToken(order, checkoutState);

  if (order.paymentStatus !== "paid") {
    order.paymentStatus = "cancelled";
    order.orderStatus = "Cancelled";
  }
  recordCheckoutLog(order, "checkout_cancel_return", "redirect", req.query);
  await order.save();

  return res.redirect(
    buildRedirectUrl("/checkout/failure", String(order.orderNumber || order._id.toString()))
  );
});

const razorpayWebhook = asyncHandler(async (req, res) => {
  const signature = String(req.headers["x-razorpay-signature"] || "").trim();

  if (!env.RAZORPAY_WEBHOOK_SECRET) {
    throw new AppError("Razorpay webhook is not configured", 503);
  }

  if (!signature) {
    recordMetric("payment.webhook.invalid_signature", {
      reason: "missing-signature",
    });
    throw new AppError("Missing webhook signature", 401);
  }

  if (!req.rawBody) {
    throw new AppError("Webhook payload unavailable for signature verification", 400);
  }

  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(req.rawBody)
    .digest("hex");

  if (!safelyCompareSignatures(expectedSignature, signature)) {
    recordMetric("payment.webhook.invalid_signature", {
      reason: "signature-mismatch",
    });
    throw new AppError("Invalid webhook signature", 401);
  }

  const event = String(req.body.event || "");
  const paymentEntity = req.body.payload?.payment?.entity;
  const razorpayOrderId = paymentEntity?.order_id;
  const providerEventId = String(
    req.headers["x-razorpay-event-id"] ||
      `${event}:${paymentEntity?.id || razorpayOrderId || "unknown"}:${paymentEntity?.status || ""}`
  );

  let webhookEvent;
  try {
    webhookEvent = await WebhookEvent.create({
      provider: "razorpay",
      eventId: providerEventId,
      eventType: event,
      providerOrderId: razorpayOrderId || "",
      providerPaymentId: paymentEntity?.id || "",
      status: "processing",
    });
  } catch (error) {
    if (error?.code === 11000) {
      const existingEvent = await WebhookEvent.findOne({
        provider: "razorpay",
        eventId: providerEventId,
      });
      if (existingEvent?.status === "completed") {
        return res.json({ received: true, duplicate: true });
      }
      const isRecentlyProcessing =
        existingEvent?.status === "processing" &&
        Date.now() - new Date(existingEvent.updatedAt).getTime() < 5 * 60 * 1000;
      if (isRecentlyProcessing) {
        return res.status(409).json({ received: false, retry: true });
      }
      existingEvent.status = "processing";
      existingEvent.error = "";
      existingEvent.providerOrderId = razorpayOrderId || existingEvent.providerOrderId || "";
      existingEvent.providerPaymentId = paymentEntity?.id || existingEvent.providerPaymentId || "";
      await existingEvent.save();
      webhookEvent = existingEvent;
    } else {
      throw error;
    }
  }

  if (!razorpayOrderId) {
    webhookEvent.status = "completed";
    webhookEvent.processedAt = new Date();
    await webhookEvent.save();
    return res.json({ received: true });
  }

  const order = await Order.findOne({ checkoutSessionId: razorpayOrderId });

  if (!order) {
    webhookEvent.resultCode = "UNKNOWN_RAZORPAY_ORDER";
    webhookEvent.error = "No local order matched the Razorpay order id.";
    webhookEvent.status = "completed";
    webhookEvent.processedAt = new Date();
    await webhookEvent.save();
    recordMetric("payment.webhook.unknown_order", {
      event,
      providerEventId,
      providerOrderId: razorpayOrderId,
      providerPaymentId: paymentEntity?.id || "",
    });
    return res.json({ received: true });
  }

  try {
    if (event === "payment.captured") {
      const expectedAmount = getPaiseValue(order, "totalPaise", "totalAmount");
      const receivedAmount = Number(paymentEntity?.amount);
      const receivedCurrency = String(paymentEntity?.currency || "").toUpperCase();
      const mismatchResultCode =
        receivedCurrency !== env.RAZORPAY_CURRENCY
          ? RECONCILIATION_RESULT_CODES.PAYMENT_CURRENCY_MISMATCH
          : receivedAmount !== expectedAmount
            ? RECONCILIATION_RESULT_CODES.PAYMENT_AMOUNT_MISMATCH
            : "";

      if (mismatchResultCode) {
        order.paymentProviderPaymentId = paymentEntity?.id || "";
        order.paymentCapturedAt = order.paymentCapturedAt || new Date();
        order.paymentReconciliationResultCode = mismatchResultCode;
        recordCheckoutLog(order, "razorpay_webhook_mismatch", "webhook", {
          event,
          providerEventId,
          paymentId: paymentEntity?.id || "",
          expectedAmount,
          receivedAmount,
          expectedCurrency: env.RAZORPAY_CURRENCY,
          receivedCurrency,
          resultCode: mismatchResultCode,
        });
        await order.save();
        webhookEvent.status = "completed";
        webhookEvent.resultCode = mismatchResultCode;
        webhookEvent.processedAt = new Date();
        await webhookEvent.save();
        recordMetric("payment.webhook.manual_review", {
          event,
          orderId: order._id.toString(),
          checkoutProvider: order.checkoutProvider,
          reason: mismatchResultCode,
        });
        logEvent("payment.webhook.manual_review", {
          event,
          providerEventId,
          orderId: order._id.toString(),
          reason: mismatchResultCode,
        }, "warn");
        return res.status(202).json({
          received: true,
          manualReview: true,
          reason: mismatchResultCode,
        });
      }

      if (order.paymentStatus === "paid") {
        recordCheckoutLog(order, "razorpay_webhook_received", "webhook", {
          event,
          providerEventId,
          paymentId: paymentEntity?.id || "",
          paymentStatus: paymentEntity?.status || "",
          duplicatePaidConfirmation: true,
        });
        await order.save();
        webhookEvent.status = "completed";
        webhookEvent.resultCode = RECONCILIATION_RESULT_CODES.ALREADY_RECONCILED;
        webhookEvent.processedAt = new Date();
        await webhookEvent.save();
        recordMetric("payment.webhook.processed", {
          event,
          status: "completed",
          orderId: order._id.toString(),
          checkoutProvider: order.checkoutProvider,
          duplicatePaidConfirmation: true,
        });
        return res.json({ received: true, duplicatePaidConfirmation: true });
      }

      const { order: lockedOrder, lockId } = await acquirePaymentConfirmationLock(order._id);
      if (!lockedOrder) {
        throw new AppError("Payment confirmation is already in progress. Please retry shortly.", 409);
      }

      const inventoryBlocker = getPaymentConfirmationInventoryBlocker(lockedOrder);
      if (inventoryBlocker) {
        markPaymentConfirmationManualReview(lockedOrder, "webhook", inventoryBlocker, {
          event,
          providerEventId,
          paymentId: paymentEntity?.id || "",
        });
        await savePaymentConfirmationResult(lockedOrder, lockId);
        webhookEvent.status = "completed";
        webhookEvent.resultCode = RECONCILIATION_RESULT_CODES.MANUAL_REVIEW_REQUIRED;
        webhookEvent.processedAt = new Date();
        await webhookEvent.save();
        recordMetric("payment.webhook.manual_review", {
          event,
          orderId: lockedOrder._id.toString(),
          checkoutProvider: lockedOrder.checkoutProvider,
          reason: inventoryBlocker,
        });
        logEvent("payment.webhook.manual_review", {
          event,
          providerEventId,
          orderId: lockedOrder._id.toString(),
          reason: inventoryBlocker,
        }, "warn");
        return res.status(202).json({
          received: true,
          manualReview: true,
          reason: inventoryBlocker,
        });
      }

      let confirmedOrder = lockedOrder;
      try {
        await runWithOptionalTransaction(async (session) => {
          await commitOrderInventory(lockedOrder, { session });
          lockedOrder.paymentStatus = "paid";
          lockedOrder.orderStatus = "Confirmed";
          lockedOrder.checkoutUrl = "";
          lockedOrder.paymentProviderPaymentId = paymentEntity?.id || "";
          lockedOrder.paymentCapturedAt = lockedOrder.paymentCapturedAt || new Date();
          recordCheckoutLog(lockedOrder, "razorpay_webhook_received", "webhook", {
            event,
            providerEventId,
            paymentId: paymentEntity?.id || "",
            paymentStatus: paymentEntity?.status || "",
          });
          confirmedOrder = await savePaymentConfirmationResult(lockedOrder, lockId, { session });
        });
      } catch (error) {
        if (lockedOrder.paymentStatus === "paid") {
          lockedOrder.paymentStatus = "initiated";
        }
        if (lockedOrder.orderStatus === "Confirmed") {
          lockedOrder.orderStatus = "Pending";
        }
        markPaymentConfirmationManualReview(
          lockedOrder,
          "webhook",
          "inventory-commit-failed",
          {
            event,
            providerEventId,
            paymentId: paymentEntity?.id || "",
            message: error?.message || "Inventory commit failed",
          }
        );
        await savePaymentConfirmationResult(lockedOrder, lockId).catch(() =>
          clearPaymentConfirmationLock(lockedOrder, lockId)
        );
        webhookEvent.status = "completed";
        webhookEvent.resultCode = RECONCILIATION_RESULT_CODES.MANUAL_REVIEW_REQUIRED;
        webhookEvent.processedAt = new Date();
        await webhookEvent.save();
        recordMetric("payment.webhook.manual_review", {
          event,
          orderId: lockedOrder._id.toString(),
          checkoutProvider: lockedOrder.checkoutProvider,
          reason: "inventory-commit-failed",
        });
        return res.status(202).json({
          received: true,
          manualReview: true,
          reason: "inventory-commit-failed",
        });
      }

      if (confirmedOrder.userId) {
        await Cart.findOneAndUpdate({ userId: confirmedOrder.userId }, { items: [] });
      }

      webhookEvent.status = "completed";
      webhookEvent.resultCode = RECONCILIATION_RESULT_CODES.PAYMENT_CAPTURED_ORDER_CONFIRMED;
      webhookEvent.processedAt = new Date();
      await webhookEvent.save();
      recordMetric("payment.webhook.processed", {
        event,
        status: "completed",
        orderId: confirmedOrder._id.toString(),
        checkoutProvider: confirmedOrder.checkoutProvider,
      });
      logEvent("payment.webhook.processed", {
        event,
        providerEventId,
        orderId: confirmedOrder._id.toString(),
        paymentStatus: confirmedOrder.paymentStatus,
        orderStatus: confirmedOrder.orderStatus,
      });
      return res.json({ received: true });
    } else if (event === "payment.failed" && order.paymentStatus !== "paid") {
      await releaseOrderInventory(order);
      order.paymentStatus = "failed";
    }

    recordCheckoutLog(order, "razorpay_webhook_received", "webhook", {
      event,
      providerEventId,
      paymentId: paymentEntity?.id || "",
      paymentStatus: paymentEntity?.status || "",
    });
    await order.save();
    webhookEvent.status = "completed";
    webhookEvent.resultCode = event === "payment.failed"
      ? RECONCILIATION_RESULT_CODES.PAYMENT_FAILED_RESERVATION_RELEASED
      : "";
    webhookEvent.processedAt = new Date();
    await webhookEvent.save();
    recordMetric("payment.webhook.processed", {
      event,
      status: "completed",
      orderId: order._id.toString(),
      checkoutProvider: order.checkoutProvider,
    });
    logEvent("payment.webhook.processed", {
      event,
      providerEventId,
      orderId: order._id.toString(),
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
    });
  } catch (error) {
    webhookEvent.status = "failed";
    webhookEvent.error = String(error?.message || "Webhook processing failed").slice(0, 500);
    await webhookEvent.save().catch(() => undefined);
    recordMetric("payment.webhook.failed", {
      event,
      orderId: order._id.toString(),
      checkoutProvider: order.checkoutProvider,
    });
    throw error;
  }

  return res.json({ received: true });
});

const reconcileOrderForAdmin = async (req, orderId) => {
  let order = await Order.findById(orderId);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.checkoutProvider !== "razorpay" || !order.checkoutSessionId) {
    await recordAuditLog(req, "payment.reconcile", { type: "order", id: order._id }, {
      resultCode: RECONCILIATION_RESULT_CODES.MANUAL_REVIEW_REQUIRED,
      reason: "missing-razorpay-order-id",
    });
    return {
      statusCode: 400,
      body: {
        resultCode: RECONCILIATION_RESULT_CODES.MANUAL_REVIEW_REQUIRED,
        message: "This order does not have a Razorpay checkout session.",
        action: "manual-review",
        order,
      },
    };
  }

  if (order.paymentStatus === "paid") {
    await recordAuditLog(req, "payment.reconcile", { type: "order", id: order._id }, {
      resultCode: RECONCILIATION_RESULT_CODES.ALREADY_RECONCILED,
      checkoutSessionId: order.checkoutSessionId,
    });
    recordCheckoutLog(order, "razorpay_reconciliation_already_paid", "admin", {
      resultCode: RECONCILIATION_RESULT_CODES.ALREADY_RECONCILED,
    });
    await order.save();
    return {
      statusCode: 200,
      body: {
        resultCode: RECONCILIATION_RESULT_CODES.ALREADY_RECONCILED,
        message: "Order is already reconciled as paid.",
        action: "no-change",
        order,
      },
    };
  }

  const lockId = createReconciliationLockId();
  const lockCutoff = new Date(Date.now() - RECONCILIATION_LOCK_WINDOW_MS);
  const lockedOrder = await Order.findOneAndUpdate(
    {
      _id: order._id,
      paymentStatus: { $ne: "paid" },
      $or: [
        { paymentReconciliationStartedAt: null },
        { paymentReconciliationStartedAt: { $exists: false } },
        { paymentReconciliationStartedAt: { $lte: lockCutoff } },
      ],
    },
    {
      $set: {
        paymentReconciliationStartedAt: new Date(),
        paymentReconciliationLockId: lockId,
        paymentReconciliationActorId: getReconciliationActorId(req),
      },
    },
    { new: true }
  );

  if (!lockedOrder) {
    await recordAuditLog(req, "payment.reconcile", { type: "order", id: order._id }, {
      resultCode: RECONCILIATION_RESULT_CODES.RECONCILIATION_ALREADY_RUNNING,
      reason: "reconciliation-in-progress",
      checkoutSessionId: order.checkoutSessionId,
    });
    return {
      statusCode: 409,
      body: {
        resultCode: RECONCILIATION_RESULT_CODES.RECONCILIATION_ALREADY_RUNNING,
        message: "This order is already being reconciled. Please retry shortly.",
        action: "retry-later",
        order,
      },
    };
  }

  order = lockedOrder;

  let paymentsResponse;

  try {
    const razorpay = getRazorpayClient();
    paymentsResponse = await razorpay.orders.fetchPayments(order.checkoutSessionId);
  } catch (error) {
    logEvent("payment.reconciliation.provider_fetch_failed", {
      orderId: order._id.toString(),
      checkoutSessionId: order.checkoutSessionId,
      message:
        error?.error?.description ||
        error?.description ||
        error?.message ||
        "Unknown Razorpay error",
      code: error?.error?.code || error?.code,
      statusCode: error?.statusCode || error?.error?.statusCode,
    }, "error");
    captureError(error, {
      component: "razorpay",
      operation: "orders.fetchPayments",
      orderId: order._id.toString(),
      checkoutSessionId: order.checkoutSessionId,
    });
    await recordAuditLog(req, "payment.reconcile", { type: "order", id: order._id }, {
      resultCode: RECONCILIATION_RESULT_CODES.PROVIDER_UNAVAILABLE,
      checkoutSessionId: order.checkoutSessionId,
    });
    setReconciliationResult(order, RECONCILIATION_RESULT_CODES.PROVIDER_UNAVAILABLE, lockId);
    order = await saveReconciledOrder(order, lockId);
    return {
      statusCode: 502,
      body: {
        resultCode: RECONCILIATION_RESULT_CODES.PROVIDER_UNAVAILABLE,
        message: "Could not fetch Razorpay payment status. Please try again.",
        action: "no-change",
        order,
      },
    };
  }

  const {
    capturedPayment,
    amountMismatchPayment,
    currencyMismatchPayment,
    failedPayment,
    latestPayment,
    paymentCount,
  } = selectRazorpayPaymentForOrder(order, paymentsResponse);

  if (currencyMismatchPayment && !capturedPayment) {
    await recordAuditLog(req, "payment.reconcile-mismatch", { type: "order", id: order._id }, {
      checkoutSessionId: order.checkoutSessionId,
      resultCode: RECONCILIATION_RESULT_CODES.PAYMENT_CURRENCY_MISMATCH,
      providerPayment: summarizeRazorpayPayment(currencyMismatchPayment),
    });
    setReconciliationResult(
      order,
      RECONCILIATION_RESULT_CODES.PAYMENT_CURRENCY_MISMATCH,
      lockId
    );
    order = await saveReconciledOrder(order, lockId);
    return {
      statusCode: 409,
      body: {
        resultCode: RECONCILIATION_RESULT_CODES.PAYMENT_CURRENCY_MISMATCH,
        message: "Captured Razorpay payment currency does not match this order.",
        action: "manual-review",
        order,
        providerPayment: summarizeRazorpayPayment(currencyMismatchPayment),
      },
    };
  }

  if (amountMismatchPayment && !capturedPayment) {
    await recordAuditLog(req, "payment.reconcile-mismatch", { type: "order", id: order._id }, {
      checkoutSessionId: order.checkoutSessionId,
      resultCode: RECONCILIATION_RESULT_CODES.PAYMENT_AMOUNT_MISMATCH,
      providerPayment: summarizeRazorpayPayment(amountMismatchPayment),
    });
    setReconciliationResult(
      order,
      RECONCILIATION_RESULT_CODES.PAYMENT_AMOUNT_MISMATCH,
      lockId
    );
    order = await saveReconciledOrder(order, lockId);
    return {
      statusCode: 409,
      body: {
        resultCode: RECONCILIATION_RESULT_CODES.PAYMENT_AMOUNT_MISMATCH,
        message: "Captured Razorpay payment amount does not match this order.",
        action: "manual-review",
        order,
        providerPayment: summarizeRazorpayPayment(amountMismatchPayment),
      },
    };
  }

  if (capturedPayment) {
    if (
      hasTrackedInventory(order) &&
      !["reserved", "committed"].includes(order.inventoryReservationStatus)
    ) {
      await recordAuditLog(req, "payment.reconcile", { type: "order", id: order._id }, {
        resultCode: RECONCILIATION_RESULT_CODES.MANUAL_REVIEW_REQUIRED,
        reason: "reservation-missing",
        checkoutSessionId: order.checkoutSessionId,
        paymentId: capturedPayment.id,
      });
      setReconciliationResult(
        order,
        RECONCILIATION_RESULT_CODES.MANUAL_REVIEW_REQUIRED,
        lockId
      );
      order = await saveReconciledOrder(order, lockId);
      return {
        statusCode: 409,
        body: {
          resultCode: RECONCILIATION_RESULT_CODES.MANUAL_REVIEW_REQUIRED,
          message: "Captured payment found, but the inventory reservation is missing.",
          action: "manual-review",
          order,
          providerPayment: summarizeRazorpayPayment(capturedPayment),
        },
      };
    }

    if (hasTrackedInventory(order) && isReservationExpired(order)) {
      await recordAuditLog(req, "payment.reconcile", { type: "order", id: order._id }, {
        resultCode: RECONCILIATION_RESULT_CODES.MANUAL_REVIEW_REQUIRED,
        reason: "reservation-expired",
        checkoutSessionId: order.checkoutSessionId,
        paymentId: capturedPayment.id,
      });
      setReconciliationResult(
        order,
        RECONCILIATION_RESULT_CODES.MANUAL_REVIEW_REQUIRED,
        lockId
      );
      order = await saveReconciledOrder(order, lockId);
      return {
        statusCode: 409,
        body: {
          resultCode: RECONCILIATION_RESULT_CODES.MANUAL_REVIEW_REQUIRED,
          message: "Captured payment found, but the inventory reservation has expired.",
          action: "manual-review",
          order,
          providerPayment: summarizeRazorpayPayment(capturedPayment),
        },
      };
    }

    await runWithOptionalTransaction(async (session) => {
      assertReconciliationLockOwner(order, lockId);
      if (order.inventoryReservationStatus === "reserved") {
        await commitOrderInventory(order, { session });
      }
      order.paymentStatus = "paid";
      if (["Pending", "Cancelled"].includes(order.orderStatus)) {
        order.orderStatus = "Confirmed";
      }
      order.checkoutUrl = "";
      setReconciliationResult(
        order,
        RECONCILIATION_RESULT_CODES.PAYMENT_CAPTURED_ORDER_CONFIRMED,
        lockId
      );
      recordCheckoutLog(order, "razorpay_reconciliation_paid", "admin", {
        resultCode: RECONCILIATION_RESULT_CODES.PAYMENT_CAPTURED_ORDER_CONFIRMED,
        payment: summarizeRazorpayPayment(capturedPayment),
        paymentCount,
      });
      order = await saveReconciledOrder(order, lockId, { session });
      if (order.userId) {
        await Cart.findOneAndUpdate(
          { userId: order.userId },
          { items: [] },
          session ? { session } : undefined
        );
      }
    });

    await recordAuditLog(req, "payment.reconcile", { type: "order", id: order._id }, {
      resultCode: RECONCILIATION_RESULT_CODES.PAYMENT_CAPTURED_ORDER_CONFIRMED,
      checkoutSessionId: order.checkoutSessionId,
      paymentId: capturedPayment.id,
    });

    return {
      statusCode: 200,
      body: {
        resultCode: RECONCILIATION_RESULT_CODES.PAYMENT_CAPTURED_ORDER_CONFIRMED,
        message: "Payment reconciled as paid.",
        action: "marked-paid",
        order,
        providerPayment: summarizeRazorpayPayment(capturedPayment),
      },
    };
  }

  if (failedPayment && order.paymentStatus !== "paid") {
    await runWithOptionalTransaction(async (session) => {
      assertReconciliationLockOwner(order, lockId);
      if (order.inventoryReservationStatus === "reserved") {
        await releaseOrderInventory(order, { session });
      }
      order.paymentStatus = "failed";
      if (order.orderStatus === "Pending") {
        order.orderStatus = "Cancelled";
      }
      setReconciliationResult(
        order,
        RECONCILIATION_RESULT_CODES.PAYMENT_FAILED_RESERVATION_RELEASED,
        lockId
      );
      recordCheckoutLog(order, "razorpay_reconciliation_failed", "admin", {
        resultCode: RECONCILIATION_RESULT_CODES.PAYMENT_FAILED_RESERVATION_RELEASED,
        payment: summarizeRazorpayPayment(failedPayment),
        paymentCount,
      });
      order = await saveReconciledOrder(order, lockId, { session });
    });

    await recordAuditLog(req, "payment.reconcile", { type: "order", id: order._id }, {
      resultCode: RECONCILIATION_RESULT_CODES.PAYMENT_FAILED_RESERVATION_RELEASED,
      checkoutSessionId: order.checkoutSessionId,
      paymentId: failedPayment.id,
    });

    return {
      statusCode: 200,
      body: {
        resultCode: RECONCILIATION_RESULT_CODES.PAYMENT_FAILED_RESERVATION_RELEASED,
        message: "Payment reconciled as failed.",
        action: "marked-failed",
        order,
        providerPayment: summarizeRazorpayPayment(failedPayment),
      },
    };
  }

  await recordAuditLog(req, "payment.reconcile", { type: "order", id: order._id }, {
    resultCode: RECONCILIATION_RESULT_CODES.NO_PROVIDER_PAYMENT,
    checkoutSessionId: order.checkoutSessionId,
    providerPayment: latestPayment ? summarizeRazorpayPayment(latestPayment) : null,
    paymentCount,
  });
  setReconciliationResult(order, RECONCILIATION_RESULT_CODES.NO_PROVIDER_PAYMENT, lockId);
  order = await saveReconciledOrder(order, lockId);

  return {
    statusCode: 200,
    body: {
      resultCode: RECONCILIATION_RESULT_CODES.NO_PROVIDER_PAYMENT,
      message: "No captured or failed Razorpay payment was found for this order.",
      action: "no-change",
      order,
      providerPayment: latestPayment ? summarizeRazorpayPayment(latestPayment) : null,
      paymentCount,
    },
  };
};

const getPaymentReconciliation = asyncHandler(async (req, res) => {
  const now = Date.now();
  const paginationParams = parsePaginationQuery(req.query, {
    defaultLimit: 50,
    maxLimit: 100,
  });
  const filter = buildReconciliationFilter(req.query, now);

  const [orders, total, summaryOrders] = await Promise.all([
    Order.find(filter)
      .select("-checkoutLogs -checkoutUrl")
      .sort({ createdAt: -1 })
      .skip(paginationParams.skip)
      .limit(paginationParams.limit),
    Order.countDocuments(filter),
    Order.find(filter)
      .select(
        "paymentStatus orderStatus inventoryReservationStatus inventoryReservationExpiresAt paymentReconciliationStartedAt paymentReconciliationResultCode createdAt"
      )
      .sort({ createdAt: -1 })
      .limit(1000),
  ]);
  const pagination = buildPaginationMeta({
    page: paginationParams.page,
    limit: paginationParams.limit,
    total,
  });
  const summary = {
    totalMatching: total,
    summaryWindow: summaryOrders.length,
    ...buildReconciliationSummary(summaryOrders, now),
  };

  setPaginationHeaders(res, pagination);
  return res.json({
    data: orders.map((order) => mapReconciliationOrder(order, now)),
    pagination,
    summary,
  });
});

const reconcileOrderPayment = asyncHandler(async (req, res) => {
  const result = await reconcileOrderForAdmin(req, req.params.id);
  if (
    [
      RECONCILIATION_RESULT_CODES.MANUAL_REVIEW_REQUIRED,
      RECONCILIATION_RESULT_CODES.PAYMENT_AMOUNT_MISMATCH,
      RECONCILIATION_RESULT_CODES.PAYMENT_CURRENCY_MISMATCH,
    ].includes(result.body.resultCode)
  ) {
    captureError(
      new AppError(`Payment reconciliation requires operator review: ${result.body.resultCode}`, result.statusCode),
      {
        component: "reconciliation",
        orderId: req.params.id,
        resultCode: result.body.resultCode,
        action: result.body.action,
      }
    );
  }
  recordMetric("payment.reconciliation.result", {
    orderId: req.params.id,
    resultCode: result.body.resultCode,
    action: result.body.action,
    statusCode: result.statusCode,
  });
  logEvent("payment.reconciliation.result", {
    orderId: req.params.id,
    resultCode: result.body.resultCode,
    action: result.body.action,
    statusCode: result.statusCode,
  });
  return res.status(result.statusCode).json(result.body);
});

const bulkReconcileOrders = asyncHandler(async (req, res) => {
  if (req.body?.confirmation !== "RECONCILE_SELECTED_ORDERS") {
    throw new AppError("Bulk reconciliation requires confirmation.", 400);
  }

  const orderIds = normalizeOrderIdList(req.body?.orderIds || req.body?.ids);
  if (orderIds.length === 0) {
    throw new AppError("Select at least one order to reconcile.", 400);
  }

  if (orderIds.length > 25) {
    throw new AppError("Bulk reconciliation is limited to 25 orders at a time.", 400);
  }

  const results = [];
  for (const orderId of orderIds) {
    try {
      const result = await reconcileOrderForAdmin(req, orderId);
      results.push({
        orderId,
        ok: result.statusCode < 400,
        statusCode: result.statusCode,
        resultCode: result.body.resultCode,
        action: result.body.action,
        message: result.body.message,
        order: result.body.order,
        providerPayment: result.body.providerPayment,
        paymentCount: result.body.paymentCount,
      });
    } catch (error) {
      results.push({
        orderId,
        ok: false,
        statusCode: error.statusCode || 500,
        resultCode: RECONCILIATION_RESULT_CODES.MANUAL_REVIEW_REQUIRED,
        action: "manual-review",
        message: error.message || "Order reconciliation failed.",
      });
    }
  }

  recordMetric("payment.reconciliation.bulk", {
    requested: orderIds.length,
    succeeded: results.filter((result) => result.ok).length,
    failed: results.filter((result) => !result.ok).length,
  });

  return res.json({
    requested: orderIds.length,
    succeeded: results.filter((result) => result.ok).length,
    failed: results.filter((result) => !result.ok).length,
    results,
  });
});

const scanPaymentReconciliation = asyncHandler(async (req, res) => {
  if (req.body?.confirmation !== "SCAN_PAYMENT_RECONCILIATION") {
    throw new AppError("Payment reconciliation scan requires confirmation.", 400);
  }

  const limit = Math.min(Math.max(Number(req.body?.limit) || 50, 1), 100);
  const markManualReview = req.body?.markManualReview === true;
  const result = await scanStuckOrders({ limit, markManualReview });
  markReconciliationScan(new Date());

  await recordAuditLog(req, "payment.reconciliation-scan", { type: "order" }, {
    limit,
    markManualReview,
    scanned: result.scanned,
    flagged: result.flagged,
    markedManualReview: result.markedManualReview,
  });
  recordMetric("payment.reconciliation.scan", {
    scanned: result.scanned,
    flagged: result.flagged,
    markedManualReview: result.markedManualReview,
  });

  return res.json(result);
});

const reorderOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.userId.toString() !== req.user._id.toString()) {
    throw new AppError("Not authorized to reorder this order", 403);
  }

  let cart = await Cart.findOne({ userId: req.user._id }).populate("items.productId");

  if (!cart) {
    cart = await Cart.create({ userId: req.user._id, items: [] });
  }

  const currentItems = cart.items
    .filter((item) => item.productId)
    .map((item) => ({
      productId: getCartItemProductId(item),
      quantity: item.quantity,
      size: item.size || "",
      color: item.color || "",
      fit: item.fit || "",
    }));
  // Reorders must use current catalog and inventory state, not stale order snapshots.
  const reorderItems = order.products.map((product) => ({
    productId: product.productId?.toString?.() || String(product.productId || ""),
    quantity: product.quantity,
    size: product.size || "",
    color: product.color || "",
    fit: product.fit || "",
  }));
  const resolvedItems = await resolveCheckoutItems([...currentItems, ...reorderItems]);

  cart.items = resolvedItems.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    size: item.size,
    color: item.color,
    fit: item.fit,
  }));

  await cart.save();
  await cart.populate("items.productId");

  return res.json({
    message: "Items added to cart",
    cart: cart.items.map((item) => ({
      productId: item.productId._id.toString(),
      name: item.productId.name,
      price: item.productId.price,
      size: item.size || "",
      color: item.color || "",
      fit: item.fit || "",
      quantity: item.quantity,
      image: item.productId.images?.[0] || "",
      accent: "#111111",
    })),
  });
});

module.exports = {
  getMyOrders,
  getOrderById,
  downloadInvoice,
  trackOrder,
  getAllOrders,
  updateOrderStatus,
  createCheckout,
  getCheckoutPaymentConfig,
  verifyCheckout,
  failCheckout,
  cancelCheckout,
  razorpayWebhook,
  getPaymentReconciliation,
  reconcileOrderPayment,
  bulkReconcileOrders,
  scanPaymentReconciliation,
  reorderOrder,
  __private: {
    RECONCILIATION_RESULT_CODES,
    assertReconciliationLockOwner,
    buildReconciliationFilter,
    buildPaymentConfirmationSaveSet,
    buildAdminOrderFilter,
    buildAdminOrderSort,
    buildReconciliationSaveSet,
    buildPublicTrackingResponse,
    canTransitionOrderStatus,
    clearPaymentConfirmationLock,
    getPaymentConfirmationInventoryBlocker,
    reconcileOrderForAdmin,
    saveReconciledOrder,
    savePaymentConfirmationResult,
    selectRazorpayPaymentForOrder,
    setReconciliationResult,
    summarizeRazorpayPayment,
  },
};
