const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");

const auditLog = require("../src/utils/auditLog");
auditLog.recordAuditLog = async () => {};

const env = require("../src/config/env");
const Order = require("../src/models/Order");
const WebhookEvent = require("../src/models/WebhookEvent");
const {
  razorpayWebhook,
  reconcileOrderPayment,
  verifyCheckout,
  __private: {
    RECONCILIATION_RESULT_CODES,
    getPaymentConfirmationInventoryBlocker,
    saveReconciledOrder,
    selectRazorpayPaymentForOrder,
    setReconciliationResult,
    summarizeRazorpayPayment,
  },
} = require("../src/controllers/orderController");

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

const installOrderStubs = (t) => {
  const originals = {
    findById: Order.findById,
    findOne: Order.findOne,
    findOneAndUpdate: Order.findOneAndUpdate,
  };

  t.after(() => {
    Order.findById = originals.findById;
    Order.findOne = originals.findOne;
    Order.findOneAndUpdate = originals.findOneAndUpdate;
  });
};

const signCheckoutPayment = ({ orderId, paymentId, secret }) =>
  crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

const signWebhookPayload = ({ rawBody, secret }) =>
  crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

test("reconciliation selector accepts only matching captured Razorpay payments", () => {
  const order = {
    totalAmount: 999,
  };
  const response = {
    items: [
      {
        id: "pay_failed",
        status: "failed",
        amount: 99900,
        currency: "INR",
        created_at: 1,
      },
      {
        id: "pay_captured",
        status: "captured",
        captured: true,
        amount: 99900,
        currency: "INR",
        created_at: 2,
      },
    ],
  };

  const selected = selectRazorpayPaymentForOrder(order, response);

  assert.equal(selected.capturedPayment.id, "pay_captured");
  assert.equal(selected.failedPayment.id, "pay_failed");
  assert.equal(selected.latestPayment.id, "pay_captured");
});

test("reconciliation selector exposes mismatched captured Razorpay payments", () => {
  const order = {
    totalAmount: 999,
  };
  const response = {
    items: [
      {
        id: "pay_mismatch",
        status: "captured",
        captured: true,
        amount: 99000,
        currency: "INR",
        created_at: 2,
      },
    ],
  };

  const selected = selectRazorpayPaymentForOrder(order, response);

  assert.equal(selected.capturedPayment, undefined);
  assert.equal(selected.amountMismatchPayment.id, "pay_mismatch");
});

test("reconciliation selector exposes captured currency mismatches separately", () => {
  const selected = selectRazorpayPaymentForOrder(
    { totalAmount: 999 },
    {
      items: [
        {
          id: "pay_currency_mismatch",
          status: "captured",
          captured: true,
          amount: 99900,
          currency: "USD",
          created_at: 2,
        },
      ],
    }
  );

  assert.equal(selected.capturedPayment, undefined);
  assert.equal(selected.currencyMismatchPayment.id, "pay_currency_mismatch");
});

test("reconciliation selector prefers a matching capture over failed attempts", () => {
  const selected = selectRazorpayPaymentForOrder(
    { totalAmount: 999 },
    {
      items: [
        {
          id: "pay_failed_newer",
          status: "failed",
          amount: 99900,
          currency: "INR",
          created_at: 3,
        },
        {
          id: "pay_captured_older",
          status: "captured",
          captured: true,
          amount: 99900,
          currency: "INR",
          created_at: 2,
        },
      ],
    }
  );

  assert.equal(selected.capturedPayment.id, "pay_captured_older");
  assert.equal(selected.failedPayment.id, "pay_failed_newer");
  assert.equal(selected.latestPayment.id, "pay_failed_newer");
});

test("reconciliation selector handles empty provider payment lists", () => {
  const selected = selectRazorpayPaymentForOrder({ totalAmount: 999 }, { items: [] });

  assert.equal(selected.capturedPayment, undefined);
  assert.equal(selected.failedPayment, undefined);
  assert.equal(selected.latestPayment, null);
  assert.equal(selected.paymentCount, 0);
});

test("reconciliation result codes are stable machine-readable strings", () => {
  assert.deepEqual(RECONCILIATION_RESULT_CODES, {
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
});

test("Razorpay payment summaries exclude bulky provider payload details", () => {
  const summary = summarizeRazorpayPayment({
    id: "pay_123",
    status: "captured",
    amount: 99900,
    currency: "inr",
    method: "card",
    captured: true,
    created_at: 1,
    card: { last4: "1111" },
  });

  assert.deepEqual(summary, {
    id: "pay_123",
    status: "captured",
    amount: 99900,
    currency: "INR",
    method: "card",
    captured: true,
    createdAt: new Date(1000),
    errorCode: "",
    errorDescription: "",
  });
});

test("payment confirmation blocks tracked inventory with released reservations", async (t) => {
  installOrderStubs(t);
  const originalSecret = env.RAZORPAY_KEY_SECRET;
  env.RAZORPAY_KEY_SECRET = "checkout-secret";
  t.after(() => {
    env.RAZORPAY_KEY_SECRET = originalSecret;
  });

  let saved = false;
  const order = {
    _id: "507f1f77bcf86cd799439011",
    checkoutProvider: "razorpay",
    checkoutSessionId: "order_razorpay",
    paymentStatus: "initiated",
    orderStatus: "Pending",
    inventoryReservationStatus: "released",
    inventoryReservationExpiresAt: null,
    paymentReconciliationResultCode: "",
    checkoutLogs: [],
    products: [
      {
        productId: "507f1f77bcf86cd799439012",
        quantity: 1,
        sku: "HRU-TEST-M-BLK",
        inventoryTracked: true,
      },
    ],
    save: async () => {
      saved = true;
    },
  };

  Order.findById = async () => order;

  const paymentId = "pay_razorpay";
  const { nextError } = await callController(verifyCheckout, {
    body: {
      appOrderId: order._id,
      razorpay_order_id: order.checkoutSessionId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signCheckoutPayment({
        orderId: order.checkoutSessionId,
        paymentId,
        secret: env.RAZORPAY_KEY_SECRET,
      }),
    },
    headers: {},
    socket: {},
  });

  assert.equal(nextError?.statusCode, 409);
  assert.match(nextError?.message || "", /manual review/i);
  assert.equal(saved, true);
  assert.equal(order.paymentStatus, "initiated");
  assert.equal(order.orderStatus, "Pending");
  assert.equal(order.inventoryReservationStatus, "released");
  assert.equal(
    order.paymentReconciliationResultCode,
    RECONCILIATION_RESULT_CODES.MANUAL_REVIEW_REQUIRED
  );
  assert.equal(order.checkoutLogs.at(-1).event, "payment_confirmation_manual_review");
  assert.equal(order.checkoutLogs.at(-1).payload.reason, "reservation-missing");
});

test("captured webhooks block expired tracked reservations instead of confirming paid", async (t) => {
  installOrderStubs(t);
  const originalWebhookSecret = env.RAZORPAY_WEBHOOK_SECRET;
  const originalCurrency = env.RAZORPAY_CURRENCY;
  const originalWebhookCreate = WebhookEvent.create;
  env.RAZORPAY_WEBHOOK_SECRET = "webhook-secret";
  env.RAZORPAY_CURRENCY = "INR";
  t.after(() => {
    env.RAZORPAY_WEBHOOK_SECRET = originalWebhookSecret;
    env.RAZORPAY_CURRENCY = originalCurrency;
    WebhookEvent.create = originalWebhookCreate;
  });

  let orderSaved = false;
  const webhookEvent = {
    status: "processing",
    processedAt: null,
    save: async () => {},
  };
  const order = {
    _id: "507f1f77bcf86cd799439011",
    checkoutProvider: "razorpay",
    checkoutSessionId: "order_razorpay",
    paymentStatus: "initiated",
    orderStatus: "Pending",
    totalPaise: 50000,
    totalAmount: 500,
    inventoryReservationStatus: "reserved",
    inventoryReservationExpiresAt: new Date(Date.now() - 1000),
    paymentReconciliationResultCode: "",
    checkoutLogs: [],
    products: [
      {
        productId: "507f1f77bcf86cd799439012",
        quantity: 1,
        sku: "HRU-TEST-M-BLK",
        inventoryTracked: true,
      },
    ],
    save: async () => {
      orderSaved = true;
    },
  };
  const body = {
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: "pay_razorpay",
          order_id: order.checkoutSessionId,
          status: "captured",
          amount: 50000,
          currency: "INR",
        },
      },
    },
  };
  const rawBody = JSON.stringify(body);

  WebhookEvent.create = async () => webhookEvent;
  Order.findOne = async () => order;

  const { res, nextError } = await callController(razorpayWebhook, {
    body,
    rawBody: Buffer.from(rawBody),
    headers: {
      "x-razorpay-signature": signWebhookPayload({
        rawBody,
        secret: env.RAZORPAY_WEBHOOK_SECRET,
      }),
      "x-razorpay-event-id": "evt_razorpay",
    },
    socket: {},
  });

  assert.ifError(nextError);
  assert.equal(res.statusCode, 202);
  assert.deepEqual(res.body, {
    received: true,
    manualReview: true,
    reason: "reservation-expired",
  });
  assert.equal(orderSaved, true);
  assert.equal(order.paymentStatus, "initiated");
  assert.equal(order.orderStatus, "Pending");
  assert.equal(order.inventoryReservationStatus, "reserved");
  assert.equal(
    order.paymentReconciliationResultCode,
    RECONCILIATION_RESULT_CODES.MANUAL_REVIEW_REQUIRED
  );
  assert.equal(webhookEvent.status, "completed");
  assert.ok(webhookEvent.processedAt instanceof Date);
});

test("payment confirmation inventory blocker allows committed tracked inventory", () => {
  assert.equal(
    getPaymentConfirmationInventoryBlocker({
      inventoryReservationStatus: "committed",
      products: [{ inventoryTracked: true }],
    }),
    ""
  );
});

test("reconciliation returns a stable already-running code while another attempt is in progress", async (t) => {
  installOrderStubs(t);

  Order.findById = async () => ({
    _id: "507f1f77bcf86cd799439011",
    checkoutProvider: "razorpay",
    checkoutSessionId: "order_razorpay",
    paymentStatus: "initiated",
    save: async () => {},
  });
  Order.findOneAndUpdate = async () => null;

  const { res, nextError } = await callController(reconcileOrderPayment, {
    params: { id: "507f1f77bcf86cd799439011" },
    user: { _id: "admin-id", email: "admin@example.com" },
    headers: {},
    socket: {},
  });

  assert.ifError(nextError);
  assert.equal(res.statusCode, 409);
  assert.equal(res.body.resultCode, RECONCILIATION_RESULT_CODES.RECONCILIATION_ALREADY_RUNNING);
  assert.equal(res.body.action, "retry-later");
});

test("reconciliation final save is conditional on current database lock owner", async (t) => {
  installOrderStubs(t);

  let capturedFilter;
  let capturedUpdate;
  Order.findOneAndUpdate = async (filter, update) => {
    capturedFilter = filter;
    capturedUpdate = update;
    return { _id: filter._id, ...update.$set };
  };

  const order = {
    _id: "507f1f77bcf86cd799439011",
    paymentStatus: "initiated",
    orderStatus: "Pending",
    checkoutUrl: "",
    inventoryReservationStatus: "reserved",
    inventoryReservationExpiresAt: new Date(),
    paymentReconciliationLockId: "lock-1",
    paymentReconciliationActorId: "507f1f77bcf86cd799439012",
    checkoutLogs: [],
  };

  setReconciliationResult(order, RECONCILIATION_RESULT_CODES.NO_PROVIDER_PAYMENT, "lock-1");
  const saved = await saveReconciledOrder(order, "lock-1");

  assert.equal(capturedFilter._id, order._id);
  assert.equal(capturedFilter.paymentReconciliationLockId, "lock-1");
  assert.equal(capturedUpdate.$set.paymentReconciliationLockId, "");
  assert.equal(saved.paymentReconciliationResultCode, RECONCILIATION_RESULT_CODES.NO_PROVIDER_PAYMENT);
});

test("reconciliation final save rejects expired-lock ownership takeover", async (t) => {
  installOrderStubs(t);

  Order.findOneAndUpdate = async () => null;

  const order = {
    _id: "507f1f77bcf86cd799439011",
    paymentStatus: "initiated",
    orderStatus: "Pending",
    checkoutUrl: "",
    inventoryReservationStatus: "reserved",
    inventoryReservationExpiresAt: new Date(),
    paymentReconciliationLockId: "lock-1",
    paymentReconciliationActorId: "507f1f77bcf86cd799439012",
    checkoutLogs: [],
  };

  setReconciliationResult(order, RECONCILIATION_RESULT_CODES.NO_PROVIDER_PAYMENT, "lock-1");

  await assert.rejects(
    () => saveReconciledOrder(order, "lock-1"),
    /lock ownership changed/i
  );
});
