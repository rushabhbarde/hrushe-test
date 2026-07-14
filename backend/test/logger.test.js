const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createRequestId,
  getRequestId,
  redactValue,
  requestContextMiddleware,
} = require("../src/utils/logger");
const { recordMetric } = require("../src/utils/metrics");

test("request ids are generated as non-empty strings", () => {
  assert.equal(typeof createRequestId(), "string");
  assert.ok(createRequestId().length >= 16);
});

test("redaction masks sensitive nested fields", () => {
  const redacted = redactValue({
    email: "customer@example.com",
    password: "secret",
    nested: {
      razorpay_signature: "sig",
      token: "jwt",
      safe: "value",
    },
  });

  assert.equal(redacted.email, "[redacted]");
  assert.equal(redacted.password, "[redacted]");
  assert.equal(redacted.nested.razorpay_signature, "[redacted]");
  assert.equal(redacted.nested.token, "[redacted]");
  assert.equal(redacted.nested.safe, "value");
});

test("redaction caps long arrays", () => {
  const redacted = redactValue({ values: Array.from({ length: 60 }, (_, index) => index) });

  assert.equal(redacted.values.length, 50);
});

test("request context middleware attaches and exposes correlation id", () => {
  const headers = {};
  const res = {
    statusCode: 200,
    set(name, value) {
      headers[name] = value;
    },
    on() {},
  };
  const req = {
    headers: { "x-request-id": "req-test" },
    method: "GET",
    originalUrl: "/healthz",
    ip: "127.0.0.1",
  };
  let nextCalled = false;

  requestContextMiddleware(req, res, () => {
    nextCalled = true;
    assert.equal(getRequestId(req), "req-test");
  });

  assert.equal(nextCalled, true);
  assert.equal(headers["X-Request-Id"], "req-test");
});

test("metric fields cannot overwrite the structured log event name", () => {
  const originalLog = console.log;
  let capturedLine = "";

  console.log = (line) => {
    capturedLine = line;
  };

  try {
    recordMetric("payment.webhook.processed", {
      event: "payment.captured",
      orderId: "order-test",
    });
  } finally {
    console.log = originalLog;
  }

  const payload = JSON.parse(capturedLine);
  assert.equal(payload.event, "metric.recorded");
  assert.equal(payload.metric, "payment.webhook.processed");
  assert.equal(payload.metricEvent, "payment.captured");
  assert.equal(payload.orderId, "order-test");
});
