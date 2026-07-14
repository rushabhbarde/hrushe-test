const test = require("node:test");
const assert = require("node:assert/strict");

const env = require("../src/config/env");
const {
  SCHEDULER_REPLAY_WINDOW_MS,
  buildSchedulerSignature,
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
