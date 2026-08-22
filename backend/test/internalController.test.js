const test = require("node:test");
const assert = require("node:assert/strict");

const env = require("../src/config/env");
const Order = require("../src/models/Order");
const {
  SCHEDULER_REPLAY_WINDOW_MS,
  buildSchedulerSignature,
  runInternalInventoryCleanup,
  runInternalMonitoringTestAlert,
  verifySchedulerRequest,
} = require("../src/controllers/internalController");

const buildSignedRequest = ({ secret = "scheduler-secret", now = Date.now(), body = { limit: 5 } } = {}) => {
  const rawBody = JSON.stringify(body);
  const timestamp = String(now);
  const signature = buildSchedulerSignature({
    secret,
    timestamp,
    rawBody,
  });

  return {
    body,
    rawBody: Buffer.from(rawBody),
    headers: {
      "x-hrushe-scheduler-timestamp": timestamp,
      "x-hrushe-scheduler-signature": signature,
    },
  };
};

test("internal scheduler authentication accepts valid signed requests", () => {
  env.INTERNAL_SCHEDULER_SECRET = "scheduler-secret";
  const now = Date.now();
  const req = buildSignedRequest({ now });

  assert.doesNotThrow(() => verifySchedulerRequest(req, now));
});

test("internal scheduler authentication rejects stale replay attempts", () => {
  env.INTERNAL_SCHEDULER_SECRET = "scheduler-secret";
  const now = Date.now();
  const req = buildSignedRequest({
    now: now - SCHEDULER_REPLAY_WINDOW_MS - 1000,
  });

  assert.throws(() => verifySchedulerRequest(req, now), /replay window/i);
});

test("internal scheduler authentication rejects signature mismatches", () => {
  env.INTERNAL_SCHEDULER_SECRET = "scheduler-secret";
  const now = Date.now();
  const req = buildSignedRequest({ now });
  req.headers["x-hrushe-scheduler-signature"] = "bad-signature";

  assert.throws(() => verifySchedulerRequest(req, now), /invalid scheduler signature/i);
});

test("internal scheduler authentication requires configured secret", () => {
  env.INTERNAL_SCHEDULER_SECRET = "";
  const now = Date.now();
  const req = buildSignedRequest({ now });

  assert.throws(() => verifySchedulerRequest(req, now), /not configured/i);
});

const buildResponse = () => ({
  statusCode: 200,
  body: null,
  status(statusCode) {
    this.statusCode = statusCode;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

const callController = async (handler, req, res = buildResponse()) => {
  let nextError;
  await handler(req, res, (error) => {
    nextError = error;
  });
  return { res, nextError };
};

function installInventoryScanStubs(t) {
  const originals = {
    find: Order.find,
    countDocuments: Order.countDocuments,
  };

  t.after(() => {
    Order.find = originals.find;
    Order.countDocuments = originals.countDocuments;
  });

  Order.find = () => ({ limit: async () => [] });
  Order.countDocuments = async () => 0;
}

test("internal inventory cleanup accepts valid scheduler authentication", async (t) => {
  installInventoryScanStubs(t);
  env.INTERNAL_SCHEDULER_SECRET = "scheduler-secret";
  const now = Date.now();
  const req = buildSignedRequest({ now, body: { limit: 5 } });

  const { res, nextError } = await callController(runInternalInventoryCleanup, req);

  assert.ifError(nextError);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, "completed");
  assert.equal(res.body.ordersInspected, 0);
});

test("internal inventory cleanup rejects invalid scheduler authentication", async (t) => {
  installInventoryScanStubs(t);
  env.INTERNAL_SCHEDULER_SECRET = "scheduler-secret";
  const now = Date.now();
  const req = buildSignedRequest({ now, body: { limit: 5 } });
  req.headers["x-hrushe-scheduler-signature"] = "invalid";

  const { nextError } = await callController(runInternalInventoryCleanup, req);

  assert.match(nextError?.message, /invalid scheduler signature/i);
});

test("internal monitoring test alert requires signed scheduler authentication", async () => {
  env.INTERNAL_SCHEDULER_SECRET = "scheduler-secret";
  const now = Date.now();
  const req = buildSignedRequest({ now, body: { reason: "controlled-test" } });

  const { res, nextError } = await callController(runInternalMonitoringTestAlert, req);

  assert.ifError(nextError);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, "emitted");
  assert.match(res.body.alertId, /.+/);
});
