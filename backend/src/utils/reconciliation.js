const RECONCILIATION_RESULT_CODES = Object.freeze({
  ALREADY_RECONCILED: "ALREADY_RECONCILED",
  PAYMENT_CAPTURED_ORDER_CONFIRMED: "PAYMENT_CAPTURED_ORDER_CONFIRMED",
  PAYMENT_FAILED_RESERVATION_RELEASED: "PAYMENT_FAILED_RESERVATION_RELEASED",
  PAYMENT_AMOUNT_MISMATCH: "PAYMENT_AMOUNT_MISMATCH",
  PAYMENT_CURRENCY_MISMATCH: "PAYMENT_CURRENCY_MISMATCH",
  NO_PROVIDER_PAYMENT: "NO_PROVIDER_PAYMENT",
  PROVIDER_UNAVAILABLE: "PROVIDER_UNAVAILABLE",
  MANUAL_REVIEW_REQUIRED: "MANUAL_REVIEW_REQUIRED",
  RECONCILIATION_ALREADY_RUNNING: "RECONCILIATION_ALREADY_RUNNING",
});

const RECONCILIATION_LOCK_WINDOW_MS = 5 * 60 * 1000;
const STUCK_INITIATED_MS = 20 * 60 * 1000;

function isReconciliationLockExpired(order, now = Date.now()) {
  return Boolean(
    order?.paymentReconciliationStartedAt &&
      now - new Date(order.paymentReconciliationStartedAt).getTime() >
        RECONCILIATION_LOCK_WINDOW_MS
  );
}

function classifyOrderForReview(order, now = Date.now()) {
  const reasons = [];
  const resultCode = order.paymentReconciliationResultCode || "";
  const createdAt = order.createdAt ? new Date(order.createdAt).getTime() : now;
  const reservationExpiresAt = order.inventoryReservationExpiresAt
    ? new Date(order.inventoryReservationExpiresAt).getTime()
    : null;

  if (order.paymentStatus === "initiated" && now - createdAt > STUCK_INITIATED_MS) {
    reasons.push("initiated-stale");
  }

  if (
    order.paymentStatus === "pending" &&
    reservationExpiresAt &&
    reservationExpiresAt < now
  ) {
    reasons.push("pending-after-reservation-expiry");
  }

  if (isReconciliationLockExpired(order, now)) {
    reasons.push("reconciliation-lock-stuck");
  }

  if (order.paymentStatus === "paid" && order.inventoryReservationStatus === "reserved") {
    reasons.push("paid-with-uncommitted-inventory");
  }

  if (order.orderStatus === "Confirmed" && order.paymentStatus !== "paid") {
    reasons.push("confirmed-unpaid");
  }

  if (order.paymentStatus === "failed" && order.inventoryReservationStatus === "reserved") {
    reasons.push("failed-with-active-reservation");
  }

  if (
    [
      RECONCILIATION_RESULT_CODES.PROVIDER_UNAVAILABLE,
      RECONCILIATION_RESULT_CODES.PAYMENT_AMOUNT_MISMATCH,
      RECONCILIATION_RESULT_CODES.PAYMENT_CURRENCY_MISMATCH,
      RECONCILIATION_RESULT_CODES.MANUAL_REVIEW_REQUIRED,
      RECONCILIATION_RESULT_CODES.RECONCILIATION_ALREADY_RUNNING,
    ].includes(resultCode)
  ) {
    reasons.push(`result:${resultCode}`);
  }

  return {
    reviewRequired: reasons.length > 0,
    reasons,
  };
}

function buildReconciliationSummary(orders = [], now = Date.now()) {
  const summary = {
    totalReviewRequired: 0,
    capturedUnconfirmed: 0,
    providerUnavailable: 0,
    amountMismatch: 0,
    currencyMismatch: 0,
    manualReview: 0,
  };

  orders.forEach((order) => {
    const classification = classifyOrderForReview(order, now);
    if (!classification.reviewRequired) {
      return;
    }
    summary.totalReviewRequired += 1;
    if (classification.reasons.includes("paid-with-uncommitted-inventory")) {
      summary.capturedUnconfirmed += 1;
    }
    if (order.paymentReconciliationResultCode === RECONCILIATION_RESULT_CODES.PROVIDER_UNAVAILABLE) {
      summary.providerUnavailable += 1;
    }
    if (order.paymentReconciliationResultCode === RECONCILIATION_RESULT_CODES.PAYMENT_AMOUNT_MISMATCH) {
      summary.amountMismatch += 1;
    }
    if (order.paymentReconciliationResultCode === RECONCILIATION_RESULT_CODES.PAYMENT_CURRENCY_MISMATCH) {
      summary.currencyMismatch += 1;
    }
    if (
      order.paymentReconciliationResultCode === RECONCILIATION_RESULT_CODES.MANUAL_REVIEW_REQUIRED ||
      classification.reasons.some((reason) => !reason.startsWith("result:"))
    ) {
      summary.manualReview += 1;
    }
  });

  return summary;
}

module.exports = {
  RECONCILIATION_LOCK_WINDOW_MS,
  RECONCILIATION_RESULT_CODES,
  STUCK_INITIATED_MS,
  buildReconciliationSummary,
  classifyOrderForReview,
  isReconciliationLockExpired,
};
