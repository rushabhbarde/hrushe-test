const crypto = require("crypto");
const env = require("../config/env");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { logEvent } = require("../utils/logger");
const { recordMetric } = require("../utils/metrics");
const { markReconciliationScan } = require("../utils/operationsState");
const { scanStuckOrders } = require("../services/reconciliationScanner");

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
  verifySchedulerRequest(req);

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

module.exports = {
  SCHEDULER_REPLAY_WINDOW_MS,
  buildSchedulerSignature,
  runInternalReconciliationScan,
  safeCompareStrings,
  verifySchedulerRequest,
};
