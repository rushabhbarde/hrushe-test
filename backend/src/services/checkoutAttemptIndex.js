const env = require("../config/env");
const AppError = require("../utils/AppError");
const { CHECKOUT_ATTEMPT_INDEX } = require("../utils/checkoutAttemptIndexSpec");
const { logEvent } = require("../utils/logger");
const CheckoutAttempt = require("../models/CheckoutAttempt");

const readiness = {
  status: "unknown",
  reason: "not-verified",
  checkedAt: null,
};

function sortObject(value) {
  if (Array.isArray(value)) {
    return value.map(sortObject);
  }
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((nextValue, key) => {
        nextValue[key] = sortObject(value[key]);
        return nextValue;
      }, {});
  }
  return value;
}

function sameDocument(left, right) {
  return JSON.stringify(sortObject(left || {})) === JSON.stringify(sortObject(right || {}));
}

function sameIndexKey(left, right) {
  const leftEntries = Object.entries(left || {});
  const rightEntries = Object.entries(right || {});

  if (leftEntries.length !== rightEntries.length) {
    return false;
  }

  return leftEntries.every(([key, value], index) => {
    const [expectedKey, expectedValue] = rightEntries[index] || [];
    return key === expectedKey && value === expectedValue;
  });
}

function getCheckoutAttemptCollection(collection) {
  return collection || CheckoutAttempt.collection;
}

function buildInvalidResult(reason, index = null) {
  return {
    ok: false,
    status: "invalid",
    reason,
    index: index
      ? {
          name: index.name,
          key: index.key,
          unique: index.unique === true,
          partialFilterExpression: index.partialFilterExpression || {},
        }
      : null,
  };
}

async function verifyCheckoutAttemptIndex(options = {}) {
  const collection = getCheckoutAttemptCollection(options.collection);
  const indexes = await collection.indexes();
  const index = indexes.find((candidate) => candidate.name === CHECKOUT_ATTEMPT_INDEX.name);

  if (!index) {
    return buildInvalidResult("missing");
  }

  if (!sameIndexKey(index.key, CHECKOUT_ATTEMPT_INDEX.key)) {
    return buildInvalidResult("wrong-key", index);
  }

  if (index.unique !== true) {
    return buildInvalidResult("not-unique", index);
  }

  if (!sameDocument(index.partialFilterExpression, CHECKOUT_ATTEMPT_INDEX.partialFilterExpression)) {
    return buildInvalidResult("wrong-partial-filter", index);
  }

  return {
    ok: true,
    status: "ready",
    reason: "verified",
    index: {
      name: index.name,
      key: index.key,
      unique: index.unique === true,
      partialFilterExpression: index.partialFilterExpression || {},
    },
  };
}

function setCheckoutAttemptIndexReadiness(status, reason) {
  readiness.status = status;
  readiness.reason = reason;
  readiness.checkedAt = new Date();
}

function getCheckoutAttemptIndexReadiness() {
  return {
    status: readiness.status,
    reason: readiness.reason,
    checkedAt: readiness.checkedAt,
    ready: readiness.status === "ready",
  };
}

function resetCheckoutAttemptIndexReadinessForTests() {
  readiness.status = "unknown";
  readiness.reason = "not-verified";
  readiness.checkedAt = null;
}

async function refreshCheckoutAttemptIndexReadiness(options = {}) {
  try {
    const result = await verifyCheckoutAttemptIndex(options);
    setCheckoutAttemptIndexReadiness(result.ok ? "ready" : "unavailable", result.reason);

    logEvent("checkout.index.verification", {
      status: result.ok ? "ready" : "unavailable",
      reason: result.reason,
      indexName: CHECKOUT_ATTEMPT_INDEX.name,
    }, result.ok ? "info" : "error");

    return {
      ...result,
      readiness: getCheckoutAttemptIndexReadiness(),
    };
  } catch (error) {
    setCheckoutAttemptIndexReadiness("unavailable", "verification-error");
    logEvent("checkout.index.verification_failed", {
      message: error?.message || "Checkout attempt index verification failed",
      indexName: CHECKOUT_ATTEMPT_INDEX.name,
    }, "error");
    return {
      ok: false,
      status: "invalid",
      reason: "verification-error",
      readiness: getCheckoutAttemptIndexReadiness(),
      error,
    };
  }
}

function assertCheckoutAttemptIndexReady() {
  if (readiness.status === "ready") {
    return;
  }

  logEvent("checkout.index.unavailable", {
    status: readiness.status,
    reason: readiness.reason,
  }, "error");
  throw new AppError("Checkout is temporarily unavailable. Please try again shortly.", 503);
}

async function createCheckoutAttemptIndex(options = {}) {
  const collection = getCheckoutAttemptCollection(options.collection);
  const current = await verifyCheckoutAttemptIndex({ collection });

  if (current.ok) {
    return {
      ...current,
      created: false,
    };
  }

  if (current.status === "invalid" && current.reason !== "missing") {
    return current;
  }

  await collection.createIndex(CHECKOUT_ATTEMPT_INDEX.key, {
    name: CHECKOUT_ATTEMPT_INDEX.name,
    unique: CHECKOUT_ATTEMPT_INDEX.unique,
    partialFilterExpression: CHECKOUT_ATTEMPT_INDEX.partialFilterExpression,
  });

  const verified = await verifyCheckoutAttemptIndex({ collection });
  return {
    ...verified,
    created: verified.ok,
  };
}

function getMongoDatabaseName(uri) {
  try {
    const parsed = new URL(String(uri || ""));
    return parsed.pathname.replace(/^\/+/, "").split("?")[0] || "";
  } catch {
    return "";
  }
}

function describeMongoTarget(uri = env.MONGODB_URI) {
  try {
    const parsed = new URL(String(uri || ""));
    const database = getMongoDatabaseName(uri);
    return {
      protocol: parsed.protocol.replace(/:$/, ""),
      host: parsed.host,
      database,
    };
  } catch {
    return {
      protocol: "",
      host: "",
      database: "",
    };
  }
}

function isProductionEnvironment() {
  const value = String(env.APP_ENV || env.NODE_ENV || "").trim().toLowerCase();
  return value === "production";
}

async function runCheckoutAttemptIndexCommand(options = {}) {
  const mode = options.mode === "create" ? "create" : "check";
  const collection = getCheckoutAttemptCollection(options.collection);
  const production = options.production ?? isProductionEnvironment();
  const target = options.target || describeMongoTarget();

  if (production && !options.confirmProduction) {
    return {
      ok: false,
      status: "blocked",
      reason: "production-confirmation-required",
      mode,
      target,
    };
  }

  if (mode === "check") {
    const result = await verifyCheckoutAttemptIndex({ collection });
    return {
      ...result,
      mode,
      target,
    };
  }

  if (!options.allowCreate) {
    return {
      ok: false,
      status: "blocked",
      reason: "explicit-create-required",
      mode,
      target,
    };
  }

  const result = await createCheckoutAttemptIndex({ collection });
  return {
    ...result,
    mode,
    target,
  };
}

module.exports = {
  CHECKOUT_ATTEMPT_INDEX,
  assertCheckoutAttemptIndexReady,
  createCheckoutAttemptIndex,
  describeMongoTarget,
  getCheckoutAttemptIndexReadiness,
  refreshCheckoutAttemptIndexReadiness,
  resetCheckoutAttemptIndexReadinessForTests,
  runCheckoutAttemptIndexCommand,
  verifyCheckoutAttemptIndex,
};
