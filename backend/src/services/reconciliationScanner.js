const Order = require("../models/Order");
const {
  RECONCILIATION_LOCK_WINDOW_MS,
  RECONCILIATION_RESULT_CODES,
  STUCK_INITIATED_MS,
  classifyOrderForReview,
} = require("../utils/reconciliation");
const { getPaiseValue } = require("../utils/money");

const RISKY_RECONCILIATION_CODES = Object.freeze([
  RECONCILIATION_RESULT_CODES.PROVIDER_UNAVAILABLE,
  RECONCILIATION_RESULT_CODES.PAYMENT_AMOUNT_MISMATCH,
  RECONCILIATION_RESULT_CODES.PAYMENT_CURRENCY_MISMATCH,
  RECONCILIATION_RESULT_CODES.MANUAL_REVIEW_REQUIRED,
  RECONCILIATION_RESULT_CODES.RECONCILIATION_ALREADY_RUNNING,
]);

function buildReviewCandidateQuery(now = Date.now()) {
  const initiatedCutoff = new Date(now - STUCK_INITIATED_MS);
  const lockCutoff = new Date(now - RECONCILIATION_LOCK_WINDOW_MS);

  return {
    $or: [
      { paymentStatus: "initiated", createdAt: { $lte: initiatedCutoff } },
      {
        paymentStatus: "pending",
        inventoryReservationStatus: "reserved",
        inventoryReservationExpiresAt: { $lte: new Date(now) },
      },
      { paymentReconciliationStartedAt: { $lte: lockCutoff } },
      { paymentStatus: "paid", inventoryReservationStatus: "reserved" },
      { orderStatus: "Confirmed", paymentStatus: { $ne: "paid" } },
      { paymentStatus: "failed", inventoryReservationStatus: "reserved" },
      { paymentReconciliationResultCode: { $in: RISKY_RECONCILIATION_CODES } },
    ],
  };
}

function mapReconciliationOrder(order, now = Date.now()) {
  const classification = classifyOrderForReview(order, now);

  return {
    id: order._id?.toString?.() || order.id || "",
    orderNumber: order.orderNumber || null,
    customerName: order.customerName || "",
    customerEmail: order.customerEmail || "",
    customerPhone: order.customerPhone || "",
    paymentStatus: order.paymentStatus || "",
    orderStatus: order.orderStatus || "",
    checkoutProvider: order.checkoutProvider || "",
    checkoutSessionId: order.checkoutSessionId || "",
    totalAmount: order.totalAmount,
    totalPaise: getPaiseValue(order, "totalPaise", "totalAmount"),
    inventoryReservationStatus: order.inventoryReservationStatus || "none",
    inventoryReservationExpiresAt: order.inventoryReservationExpiresAt || null,
    paymentReconciliationStartedAt: order.paymentReconciliationStartedAt || null,
    paymentReconciliationResultCode: order.paymentReconciliationResultCode || "",
    paymentReconciliationLockId: order.paymentReconciliationLockId || "",
    reviewRequired: classification.reviewRequired,
    reviewReasons: classification.reasons,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

async function findStuckOrders(options = {}) {
  const now = Number(options.now) || Date.now();
  const limit = Math.min(Math.max(Number(options.limit) || 50, 1), 100);
  const extraFilter = options.filter || {};
  const filter = {
    $and: [buildReviewCandidateQuery(now), extraFilter],
  };

  const orders = await Order.find(filter)
    .select("-checkoutLogs -checkoutUrl")
    .sort({ createdAt: -1 })
    .limit(limit);

  return orders.map((order) => mapReconciliationOrder(order, now));
}

async function scanStuckOrders(options = {}) {
  const now = Number(options.now) || Date.now();
  const limit = Math.min(Math.max(Number(options.limit) || 50, 1), 100);
  const markManualReview = options.markManualReview === true;
  const orders = await Order.find(buildReviewCandidateQuery(now))
    .sort({ createdAt: -1 })
    .limit(limit);
  const mappedOrders = orders.map((order) => mapReconciliationOrder(order, now));
  let markedManualReview = 0;

  if (markManualReview) {
    const orderIds = mappedOrders
      .filter((order) => order.reviewRequired)
      .map((order) => order.id);

    if (orderIds.length > 0) {
      const result = await Order.updateMany(
        {
          _id: { $in: orderIds },
          paymentReconciliationResultCode: { $in: ["", null] },
        },
        {
          $set: {
            paymentReconciliationResultCode:
              RECONCILIATION_RESULT_CODES.MANUAL_REVIEW_REQUIRED,
          },
        }
      );
      markedManualReview = result.modifiedCount || 0;
    }
  }

  return {
    scanned: orders.length,
    flagged: mappedOrders.filter((order) => order.reviewRequired).length,
    markedManualReview,
    orders: mappedOrders,
  };
}

module.exports = {
  RISKY_RECONCILIATION_CODES,
  buildReviewCandidateQuery,
  findStuckOrders,
  mapReconciliationOrder,
  scanStuckOrders,
};
