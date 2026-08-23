#!/usr/bin/env node

require("dotenv").config();

const crypto = require("crypto");

const enabled = process.env.RAZORPAY_PRODUCTION_TEST_VERIFY === "true";
const allowProductionMutation =
  process.env.ALLOW_PRODUCTION_TEST_ORDER_MUTATION === "true";
const baseUrl = String(
  process.env.RAZORPAY_TEST_API_BASE_URL ||
    process.env.PRODUCTION_API_BASE_URL ||
    process.env.BACKEND_PUBLIC_URL ||
    ""
)
  .trim()
  .replace(/\/+$/, "");
const webhookSecret = String(
  process.env.RAZORPAY_WEBHOOK_SECRET ||
    process.env.HRUSHE_RZP_WEBHOOK_SECRET ||
    ""
).trim();
const keyId = String(process.env.RAZORPAY_KEY_ID || "").trim();
const checkoutPayload = process.env.RAZORPAY_TEST_CHECKOUT_PAYLOAD_JSON
  ? JSON.parse(process.env.RAZORPAY_TEST_CHECKOUT_PAYLOAD_JSON)
  : null;

function assertSafeConfig() {
  if (!enabled) {
    throw new Error("Refusing to run. Set RAZORPAY_PRODUCTION_TEST_VERIFY=true for explicit test-mode verification.");
  }

  if (!allowProductionMutation) {
    throw new Error("Refusing to create production test orders. Set ALLOW_PRODUCTION_TEST_ORDER_MUTATION=true after confirming this is intentional.");
  }

  if (!baseUrl) {
    throw new Error("RAZORPAY_TEST_API_BASE_URL, PRODUCTION_API_BASE_URL, or BACKEND_PUBLIC_URL is required.");
  }

  const { protocol, hostname } = new URL(baseUrl);
  if (protocol !== "https:" || ["localhost", "127.0.0.1", "0.0.0.0"].includes(hostname)) {
    throw new Error("Production test-mode verification requires an HTTPS production API URL.");
  }

  if (!keyId.startsWith("rzp_test_")) {
    throw new Error("RAZORPAY_KEY_ID must use Razorpay test mode for production-domain verification.");
  }

  if (!webhookSecret) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET or HRUSHE_RZP_WEBHOOK_SECRET is required for signed webhook verification.");
  }

  if (!checkoutPayload) {
    throw new Error("RAZORPAY_TEST_CHECKOUT_PAYLOAD_JSON is required.");
  }
}

function signWebhookBody(rawBody) {
  return crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let body = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: response.status, ok: response.ok, body };
}

async function assertRemoteTestMode(results) {
  const response = await requestJson("/order/checkout/razorpay-mode");
  const pass =
    response.ok &&
    response.body?.provider === "razorpay" &&
    response.body?.configured === true &&
    response.body?.mode === "test" &&
    response.body?.keyPrefix === "rzp_test_";

  record(results, "remote Razorpay test-mode preflight", response, pass);
  if (!pass) {
    throw new Error("Remote backend is not reporting Razorpay test mode. No checkout was created.");
  }
}

async function createCheckout(label) {
  const response = await requestJson("/order/checkout", {
    method: "POST",
    body: JSON.stringify(checkoutPayload),
  });

  if (!response.ok) {
    throw new Error(`${label} checkout creation failed with status ${response.status}`);
  }

  if (!String(response.body?.key || "").startsWith("rzp_test_")) {
    throw new Error(`${label} checkout did not return a Razorpay test-mode key. Stopping before webhook simulation.`);
  }

  return response.body;
}

async function sendWebhook({ eventId, event, razorpayOrderId, paymentId, amount, currency, signature = "valid" }) {
  const body = {
    event,
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: razorpayOrderId,
          status: event === "payment.failed" ? "failed" : "captured",
          captured: event === "payment.captured",
          amount,
          currency,
        },
      },
    },
  };
  const rawBody = JSON.stringify(body);
  return requestJson("/order/checkout/webhook/razorpay", {
    method: "POST",
    headers: {
      "x-razorpay-event-id": eventId,
      "x-razorpay-signature": signature === "valid" ? signWebhookBody(rawBody) : "invalid-signature",
    },
    body: rawBody,
  });
}

function record(results, name, response, pass) {
  results.push({
    name,
    status: response.status,
    pass: Boolean(pass),
    body: response.body && typeof response.body === "object"
      ? {
          provider: response.body.provider,
          configured: response.body.configured,
          mode: response.body.mode,
          keyPrefix: response.body.keyPrefix,
          received: response.body.received,
          duplicate: response.body.duplicate,
          manualReview: response.body.manualReview,
          reason: response.body.reason,
          retry: response.body.retry,
        }
      : null,
  });
}

async function main() {
  assertSafeConfig();
  const results = [];
  const suffix = Date.now().toString(36);

  const health = await requestJson("/healthz");
  record(results, "health", health, health.ok);

  const ready = await requestJson("/readyz");
  record(results, "readiness", ready, ready.ok);

  await assertRemoteTestMode(results);

  const successCheckout = await createCheckout("success");
  const successWebhook = await sendWebhook({
    eventId: `codex-${suffix}-captured`,
    event: "payment.captured",
    razorpayOrderId: successCheckout.razorpayOrderId,
    paymentId: `pay_codex_${suffix}_success`,
    amount: successCheckout.amount,
    currency: successCheckout.currency,
  });
  record(results, "captured webhook", successWebhook, successWebhook.ok);

  const duplicateWebhook = await sendWebhook({
    eventId: `codex-${suffix}-captured`,
    event: "payment.captured",
    razorpayOrderId: successCheckout.razorpayOrderId,
    paymentId: `pay_codex_${suffix}_success`,
    amount: successCheckout.amount,
    currency: successCheckout.currency,
  });
  record(results, "duplicate webhook", duplicateWebhook, duplicateWebhook.ok && duplicateWebhook.body?.duplicate === true);

  const invalidSignature = await sendWebhook({
    eventId: `codex-${suffix}-invalid-signature`,
    event: "payment.captured",
    razorpayOrderId: successCheckout.razorpayOrderId,
    paymentId: `pay_codex_${suffix}_invalid`,
    amount: successCheckout.amount,
    currency: successCheckout.currency,
    signature: "invalid",
  });
  record(results, "invalid webhook signature", invalidSignature, invalidSignature.status === 401);

  const mismatchCheckout = await createCheckout("amount mismatch");
  const amountMismatch = await sendWebhook({
    eventId: `codex-${suffix}-amount-mismatch`,
    event: "payment.captured",
    razorpayOrderId: mismatchCheckout.razorpayOrderId,
    paymentId: `pay_codex_${suffix}_amount`,
    amount: Number(mismatchCheckout.amount) + 1,
    currency: mismatchCheckout.currency,
  });
  record(results, "amount mismatch", amountMismatch, amountMismatch.status === 202 && amountMismatch.body?.manualReview === true);

  const currencyCheckout = await createCheckout("currency mismatch");
  const currencyMismatch = await sendWebhook({
    eventId: `codex-${suffix}-currency-mismatch`,
    event: "payment.captured",
    razorpayOrderId: currencyCheckout.razorpayOrderId,
    paymentId: `pay_codex_${suffix}_currency`,
    amount: currencyCheckout.amount,
    currency: "USD",
  });
  record(results, "currency mismatch", currencyMismatch, currencyMismatch.status === 202 && currencyMismatch.body?.manualReview === true);

  const failedCheckout = await createCheckout("failed payment");
  const failedPayment = await sendWebhook({
    eventId: `codex-${suffix}-failed`,
    event: "payment.failed",
    razorpayOrderId: failedCheckout.razorpayOrderId,
    paymentId: `pay_codex_${suffix}_failed`,
    amount: failedCheckout.amount,
    currency: failedCheckout.currency,
  });
  record(results, "failed payment webhook", failedPayment, failedPayment.ok);

  const unknownOrder = await sendWebhook({
    eventId: `codex-${suffix}-unknown-order`,
    event: "payment.captured",
    razorpayOrderId: `order_codex_unknown_${suffix}`,
    paymentId: `pay_codex_${suffix}_unknown`,
    amount: successCheckout.amount,
    currency: successCheckout.currency,
  });
  record(results, "unknown Razorpay order", unknownOrder, unknownOrder.ok);

  const passed = results.every((result) => result.pass);
  console.log(JSON.stringify({ environment: "production-test-mode", baseUrl, passed, results }, null, 2));
  if (!passed) {
    process.exitCode = 1;
  }
}

if (require.main === module && process.env.npm_lifecycle_event !== "test") {
  main().catch((error) => {
    console.error(JSON.stringify({ ok: false, error: error?.message || "Razorpay production test-mode verification failed." }));
    process.exitCode = 1;
  });
}

module.exports = {
  assertSafeConfig,
  signWebhookBody,
};
