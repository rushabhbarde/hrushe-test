const crypto = require("crypto");
const env = require("../config/env");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { logEvent } = require("../utils/logger");
const { recordMetric } = require("../utils/metrics");
const { markReconciliationScan } = require("../utils/operationsState");
const { scanStuckOrders } = require("../services/reconciliationScanner");
const {
  cleanupExpiredInventoryReservations,
} = require("../services/checkoutInventory");

const SCHEDULER_REPLAY_WINDOW_MS = 5 * 60 * 1000;

function safeCompareStrings(expectedValue, receivedValue) {
  const expected = Buffer.from(String(expectedValue || ""), "utf8");
  const received = Buffer.from(String(receivedValue || ""), "utf8");

  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

function getRawRequestBody(req) {
  if (Buffer.isBuffer(req.rawBody)) {
    return req.rawBody.toString("utf8");
  }

  return JSON.stringify(req.body || {});
}

function buildSchedulerSignature({ secret, timestamp, rawBody }) {
  return crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
}

function verifySchedulerRequest(req, now = Date.now()) {
  const secret = String(env.INTERNAL_SCHEDULER_SECRET || "").trim();
  if (!secret) {
    throw new AppError("Internal scheduler is not configured", 503);
  }

  const timestamp = String(req.headers["x-hrushe-scheduler-timestamp"] || "").trim();
  const signature = String(req.headers["x-hrushe-scheduler-signature"] || "").trim();
  const parsedTimestamp = Number(timestamp);

  if (!timestamp || !signature || !Number.isFinite(parsedTimestamp)) {
    throw new AppError("Invalid scheduler signature", 401);
  }

  if (Math.abs(now - parsedTimestamp) > SCHEDULER_REPLAY_WINDOW_MS) {
    throw new AppError("Scheduler request timestamp is outside the replay window", 401);
  }

  const expectedSignature = buildSchedulerSignature({
    secret,
    timestamp,
    rawBody: getRawRequestBody(req),
  });

  if (!safeCompareStrings(expectedSignature, signature)) {
    throw new AppError("Invalid scheduler signature", 401);
  }
}

const runInternalReconciliationScan = asyncHandler(async (req, res) => {
  logEvent("internal.reconciliation_scan.requested", {});
  try {
    verifySchedulerRequest(req);
  } catch (error) {
    logEvent("internal.reconciliation_scan.authentication_rejected", {
      message: error?.message,
      statusCode: error?.statusCode || 500,
    }, "warn");
    throw error;
  }

  const startedAt = Date.now();
  const limit = Math.min(Math.max(Number(req.body?.limit) || 50, 1), 100);

  logEvent("internal.reconciliation_scan.started", { limit });
  const result = await scanStuckOrders({
    limit,
    markManualReview: true,
  });
  markReconciliationScan(new Date());
  const durationMs = Date.now() - startedAt;

  recordMetric("internal.reconciliation_scan.completed", {
    scanned: result.scanned,
    flagged: result.flagged,
    markedManualReview: result.markedManualReview,
    durationMs,
  });
  logEvent("internal.reconciliation_scan.completed", {
    scanned: result.scanned,
    flagged: result.flagged,
    markedManualReview: result.markedManualReview,
    durationMs,
  });

  return res.json({
    ...result,
    durationMs,
  });
});

const runInternalInventoryCleanup = asyncHandler(async (req, res) => {
  logEvent("internal.inventory_cleanup.scan_requested", {});
  try {
    verifySchedulerRequest(req);
  } catch (error) {
    logEvent("internal.inventory_cleanup.authentication_rejected", {
      message: error?.message,
      statusCode: error?.statusCode || 500,
    }, "warn");
    throw error;
  }

  const startedAt = Date.now();
  const limit = Math.min(Math.max(Number(req.body?.limit) || 50, 1), 100);
  logEvent("internal.inventory_cleanup.scan_started", { limit });

  try {
    const result = await cleanupExpiredInventoryReservations({
      limit,
      source: "internal-scheduler",
    });
    const durationMs = Date.now() - startedAt;

    if (result.lockContended) {
      logEvent("internal.inventory_cleanup.lock_contention", { limit }, "warn");
    }

    recordMetric("internal.inventory_cleanup.completed", {
      ordersInspected: result.ordersInspected,
      reservationsReleased: result.reservationsReleased,
      reservationsPreserved: result.reservationsPreserved,
      manualReviewCases: result.manualReviewCases,
      failedReleases: result.failedReleases,
      lockContended: result.lockContended,
      durationMs,
    });
    logEvent("internal.inventory_cleanup.scan_completed", {
      ordersInspected: result.ordersInspected,
      reservationsReleased: result.reservationsReleased,
      reservationsPreserved: result.reservationsPreserved,
      manualReviewCases: result.manualReviewCases,
      failedReleases: result.failedReleases,
      lockContended: result.lockContended,
      durationMs,
    });

    return res.status(result.lockContended ? 202 : 200).json({
      ...result,
      durationMs,
    });
  } catch (error) {
    logEvent("internal.inventory_cleanup.scan_error", {
      message: error?.message,
      code: error?.code || "",
    }, "error");
    throw error;
  }
});

module.exports = {
  SCHEDULER_REPLAY_WINDOW_MS,
  buildSchedulerSignature,
  runInternalInventoryCleanup,
  runInternalReconciliationScan,
  safeCompareStrings,
  verifySchedulerRequest,
};
