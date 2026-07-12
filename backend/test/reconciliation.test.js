const test = require("node:test");
const assert = require("node:assert/strict");

const {
  RECONCILIATION_LOCK_WINDOW_MS,
  RECONCILIATION_RESULT_CODES,
  STUCK_INITIATED_MS,
  buildReconciliationSummary,
  classifyOrderForReview,
  isReconciliationLockExpired,
} = require("../src/utils/reconciliation");
const {
  buildReviewCandidateQuery,
  mapReconciliationOrder,
} = require("../src/services/reconciliationScanner");
const {
  __private: {
    buildReconciliationFilter,
    setReconciliationResult,
  },
} = require("../src/controllers/orderController");

test("reconciliation result codes include concurrent lock failures", () => {
  assert.equal(
    RECONCILIATION_RESULT_CODES.RECONCILIATION_ALREADY_RUNNING,
    "RECONCILIATION_ALREADY_RUNNING"
  );
});

test("reconciliation lock expiry uses the configured lock window", () => {
  const now = Date.now();

  assert.equal(
    isReconciliationLockExpired({
      paymentReconciliationStartedAt: new Date(now - RECONCILIATION_LOCK_WINDOW_MS - 1),
    }, now),
    true
  );
  assert.equal(
    isReconciliationLockExpired({
      paymentReconciliationStartedAt: new Date(now - RECONCILIATION_LOCK_WINDOW_MS + 1000),
    }, now),
    false
  );
});

test("stale initiated orders require review", () => {
  const now = Date.now();
  const classification = classifyOrderForReview({
    paymentStatus: "initiated",
    createdAt: new Date(now - STUCK_INITIATED_MS - 1000),
  }, now);

  assert.equal(classification.reviewRequired, true);
  assert.ok(classification.reasons.includes("initiated-stale"));
});

test("paid orders with reserved inventory require review", () => {
  const classification = classifyOrderForReview({
    paymentStatus: "paid",
    inventoryReservationStatus: "reserved",
    createdAt: new Date(),
  });

  assert.ok(classification.reasons.includes("paid-with-uncommitted-inventory"));
});

test("confirmed unpaid orders require review", () => {
  const classification = classifyOrderForReview({
    paymentStatus: "initiated",
    orderStatus: "Confirmed",
    createdAt: new Date(),
  });

  assert.ok(classification.reasons.includes("confirmed-unpaid"));
});

test("failed orders with active reservations require review", () => {
  const classification = classifyOrderForReview({
    paymentStatus: "failed",
    inventoryReservationStatus: "reserved",
    createdAt: new Date(),
  });

  assert.ok(classification.reasons.includes("failed-with-active-reservation"));
});

test("reconciliation summaries count manual review classes", () => {
  const summary = buildReconciliationSummary([
    {
      paymentStatus: "paid",
      inventoryReservationStatus: "reserved",
      createdAt: new Date(),
    },
    {
      paymentStatus: "initiated",
      paymentReconciliationResultCode: RECONCILIATION_RESULT_CODES.PROVIDER_UNAVAILABLE,
      createdAt: new Date(Date.now() - STUCK_INITIATED_MS - 1000),
    },
  ]);

  assert.equal(summary.totalReviewRequired, 2);
  assert.equal(summary.capturedUnconfirmed, 1);
  assert.equal(summary.providerUnavailable, 1);
  assert.equal(summary.manualReview, 2);
});

test("review candidate query contains indexed order state branches", () => {
  const query = buildReviewCandidateQuery(Date.now());

  assert.equal(Array.isArray(query.$or), true);
  assert.ok(query.$or.some((branch) => branch.paymentStatus === "initiated"));
  assert.ok(query.$or.some((branch) => branch.paymentReconciliationResultCode));
});

test("dashboard reconciliation filter defaults to review candidates", () => {
  const filter = buildReconciliationFilter({}, Date.now());

  assert.equal(Array.isArray(filter.$and), true);
  assert.ok(filter.$and.some((clause) => Array.isArray(clause.$or)));
});

test("dashboard reconciliation filter can include all orders", () => {
  const filter = buildReconciliationFilter({ includeAll: "true" }, Date.now());

  assert.equal(filter.$and, undefined);
});

test("mapped reconciliation orders include review reasons and integer total", () => {
  const order = {
    _id: { toString: () => "order-id" },
    totalAmount: 999,
    paymentStatus: "paid",
    inventoryReservationStatus: "reserved",
    createdAt: new Date(),
  };
  const mapped = mapReconciliationOrder(order);

  assert.equal(mapped.id, "order-id");
  assert.equal(mapped.totalPaise, 99900);
  assert.equal(mapped.reviewRequired, true);
  assert.ok(mapped.reviewReasons.includes("paid-with-uncommitted-inventory"));
});

test("reconciliation result clears only when lock owner matches", () => {
  const order = {
    paymentReconciliationLockId: "lock-1",
    paymentReconciliationStartedAt: new Date(),
    paymentReconciliationActorId: "actor",
  };

  setReconciliationResult(order, RECONCILIATION_RESULT_CODES.NO_PROVIDER_PAYMENT, "lock-1");

  assert.equal(order.paymentReconciliationResultCode, "NO_PROVIDER_PAYMENT");
  assert.equal(order.paymentReconciliationStartedAt, null);
  assert.equal(order.paymentReconciliationLockId, "");
  assert.equal(order.paymentReconciliationActorId, null);
});

test("reconciliation result rejects lock-owner mismatches", () => {
  assert.throws(
    () =>
      setReconciliationResult(
        { paymentReconciliationLockId: "lock-1" },
        RECONCILIATION_RESULT_CODES.NO_PROVIDER_PAYMENT,
        "lock-2"
      ),
    /lock ownership changed/i
  );
});
