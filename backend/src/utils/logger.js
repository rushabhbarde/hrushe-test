const { AsyncLocalStorage } = require("async_hooks");
const crypto = require("crypto");

const requestStorage = new AsyncLocalStorage();
const SENSITIVE_KEY_PATTERN =
  /(password|pass|token|secret|authorization|cookie|signature|otp|api[_-]?key|razorpay[_-]?key|card|cvv)/i;

function createRequestId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : crypto.randomBytes(16).toString("hex");
}

function redactValue(value, depth = 0) {
  if (depth > 6) {
    return "[redacted-depth]";
  }

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => redactValue(item, depth + 1));
  }

  if (value && typeof value === "object") {
    return Object.entries(value).reduce((accumulator, [key, nestedValue]) => {
      accumulator[key] = SENSITIVE_KEY_PATTERN.test(key)
        ? "[redacted]"
        : redactValue(nestedValue, depth + 1);
      return accumulator;
    }, {});
  }

  return value;
}

function getRequestContext() {
  return requestStorage.getStore() || {};
}

function getRequestId(req) {
  return req?.requestId || getRequestContext().requestId || "";
}

function logEvent(event, fields = {}, level = "info") {
  const context = getRequestContext();
  const payload = redactValue({
    timestamp: new Date().toISOString(),
    level,
    event,
    requestId: fields.requestId || context.requestId || "",
    ...fields,
  });
  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

function requestContextMiddleware(req, res, next) {
  const requestId =
    String(req.headers["x-request-id"] || req.headers["x-correlation-id"] || "").trim() ||
    createRequestId();
  const startedAt = Date.now();

  req.requestId = requestId;
  res.set("X-Request-Id", requestId);

  requestStorage.run({ requestId }, () => {
    res.on("finish", () => {
      logEvent("http.request.completed", {
        method: req.method,
        path: req.originalUrl || req.url,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
        userId: req.user?._id?.toString?.() || "",
        ip: req.ip,
      });
    });
    next();
  });
}

module.exports = {
  createRequestId,
  getRequestContext,
  getRequestId,
  logEvent,
  redactValue,
  requestContextMiddleware,
};
