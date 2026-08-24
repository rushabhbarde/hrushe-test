const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");

const auditLog = require("../src/utils/auditLog");
auditLog.recordAuditLog = async () => {};

const env = require("../src/config/env");
const Order = require("../src/models/Order");
const WebhookEvent = require("../src/models/WebhookEvent");
const Cart = require("../src/models/Cart");
const Product = require("../src/models/Product");
const CheckoutAttempt = require("../src/models/CheckoutAttempt");
const { CHECKOUT_ATTEMPT_INDEX } = require("../src/utils/checkoutAttemptIndexSpec");
const {
  refreshCheckoutAttemptIndexReadiness,
  resetCheckoutAttemptIndexReadinessForTests,
} = require("../src/services/checkoutAttemptIndex");
const orderRoutes = require("../src/routes/orderRoutes");
const {
  razorpayWebhook,
  cancelCheckout,
  createCheckout,
  reconcileOrderPayment,
  reorderOrder,
  trackOrder,
  updateOrderStatus,
  getCheckoutPaymentConfig,
  verifyCheckout,
  __private: {
    RECONCILIATION_RESULT_CODES,
    buildAdminOrderFilter,
    buildAdminOrderSort,
    canTransitionOrderStatus,
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
  redirect(url) {
    this.redirectUrl = url;
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
    findByIdAndUpdate: Order.findByIdAndUpdate,
  };

  t.after(() => {
    Order.findById = originals.findById;
    Order.findOne = originals.findOne;
    Order.findOneAndUpdate = originals.findOneAndUpdate;
    Order.findByIdAndUpdate = originals.findByIdAndUpdate;
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

const signCheckoutState = ({ orderId, checkoutSessionId, secret }) =>
  crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${checkoutSessionId}`)
    .digest("hex");

const validCheckoutIndexCollection = () => ({
  indexes: async () => [
    {
      name: CHECKOUT_ATTEMPT_INDEX.name,
      key: CHECKOUT_ATTEMPT_INDEX.key,
      unique: true,
      partialFilterExpression: CHECKOUT_ATTEMPT_INDEX.partialFilterExpression,
    },
  ],
});

function buildTerminalOrder(overrides = {}) {
  const order = {
    _id: "507f1f77bcf86cd799439011",
    checkoutProvider: "razorpay",
    checkoutSessionId: "order_razorpay",
    paymentStatus: "initiated",
    orderStatus: "Pending",
    totalPaise: 50000,
    totalAmount: 500,
    inventoryReservationStatus: "reserved",
    inventoryReservationExpiresAt: new Date(Date.now() + 60_000),
    paymentReconciliationResultCode: "",
    paymentConfirmationStartedAt: null,
    paymentConfirmationLockId: "",
    checkoutLogs: [],
    products: [
      {
        productId: "507f1f77bcf86cd799439012",
        quantity: 1,
        sku: "HRU-TEST-M-BLK",
        inventoryTracked: true,
      },
    ],
    saveCalls: 0,
    async save() {
      this.saveCalls += 1;
      return this;
    },
    ...overrides,
  };

  return order;
}

function installTerminalPaymentStubs(t, order, { updateOne } = {}) {
  const originals = {
    orderFindById: Order.findById,
    orderFindOne: Order.findOne,
    orderFindOneAndUpdate: Order.findOneAndUpdate,
    productUpdateOne: Product.updateOne,
  };
  let releaseUpdates = 0;

  t.after(() => {
    Order.findById = originals.orderFindById;
    Order.findOne = originals.orderFindOne;
    Order.findOneAndUpdate = originals.orderFindOneAndUpdate;
    Product.updateOne = originals.productUpdateOne;
  });

  Order.findById = async () => order;
  Order.findOne = async () => order;
  Order.findOneAndUpdate = async (filter, update) => {
    if (filter.paymentConfirmationLockId) {
      if (order.paymentConfirmationLockId !== filter.paymentConfirmationLockId) {
        return null;
      }
      Object.assign(order, update.$set);
      return order;
    }

    if (order.paymentStatus === "paid") {
      return null;
    }
    if (order.paymentConfirmationStartedAt && order.paymentConfirmationLockId) {
      return null;
    }
    Object.assign(order, update.$set);
    return order;
  };
  Product.updateOne = async (...args) => {
    releaseUpdates += 1;
    return updateOne ? updateOne(...args) : { modifiedCount: 1 };
  };

  return {
    get releaseUpdates() {
      return releaseUpdates;
    },
  };
}

function installWebhookEventStub(t) {
  const originalCreate = WebhookEvent.create;
  const webhookEvent = {
    status: "processing",
    resultCode: "",
    processedAt: null,
    error: "",
    saveCalls: 0,
    async save() {
      this.saveCalls += 1;
      return this;
    },
  };

  t.after(() => {
    WebhookEvent.create = originalCreate;
  });

  WebhookEvent.create = async () => webhookEvent;
  return webhookEvent;
}

function buildWebhookRequest({ event = "payment.failed", orderId = "order_razorpay", paymentId = "pay_failed" } = {}) {
  const body = {
    event,
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: orderId,
          status: event === "payment.captured" ? "captured" : "failed",
          amount: 50000,
          currency: "INR",
          captured: event === "payment.captured",
        },
      },
    },
  };
  const rawBody = JSON.stringify(body);

  return {
    body,
    rawBody: Buffer.from(rawBody),
    headers: {
      "x-razorpay-signature": signWebhookPayload({
        rawBody,
        secret: env.RAZORPAY_WEBHOOK_SECRET,
      }),
      "x-razorpay-event-id": `evt_${event}_${paymentId}`,
    },
    socket: {},
  };
}

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

test("legacy COD order placement route is retired", () => {
  const placeRoute = orderRoutes.stack.find(
    (layer) => layer.route?.path === "/place" && layer.route?.methods?.post
  );

  assert.equal(placeRoute, undefined);
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

test("checkout payment config exposes only Razorpay mode metadata", async (t) => {
  const originalKeyId = env.RAZORPAY_KEY_ID;
  const originalKeySecret = env.RAZORPAY_KEY_SECRET;
  const originalCurrency = env.RAZORPAY_CURRENCY;
  env.RAZORPAY_KEY_ID = "rzp_test_1234567890";
  env.RAZORPAY_KEY_SECRET = "secret-value-not-returned";
  env.RAZORPAY_CURRENCY = "INR";
  t.after(() => {
    env.RAZORPAY_KEY_ID = originalKeyId;
    env.RAZORPAY_KEY_SECRET = originalKeySecret;
    env.RAZORPAY_CURRENCY = originalCurrency;
  });

  const { res, nextError } = await callController(getCheckoutPaymentConfig, {
    body: {},
    headers: {},
    socket: {},
  });

  assert.ifError(nextError);
  assert.deepEqual(res.body, {
    provider: "razorpay",
    configured: true,
    keyPrefix: "rzp_test_",
    mode: "test",
    currency: "INR",
  });
  assert.equal(JSON.stringify(res.body).includes("secret-value-not-returned"), false);
});

test("checkout creation fails closed while idempotency index readiness is unknown", async (t) => {
  const originals = {
    productFind: Product.find,
    productUpdateOne: Product.updateOne,
    orderCreate: Order.create,
    checkoutAttemptCreate: CheckoutAttempt.create,
  };
  const calls = {
    productFind: 0,
    productUpdateOne: 0,
    orderCreate: 0,
    checkoutAttemptCreate: 0,
  };

  resetCheckoutAttemptIndexReadinessForTests();
  t.after(() => {
    Product.find = originals.productFind;
    Product.updateOne = originals.productUpdateOne;
    Order.create = originals.orderCreate;
    CheckoutAttempt.create = originals.checkoutAttemptCreate;
    resetCheckoutAttemptIndexReadinessForTests();
  });

  Product.find = async () => {
    calls.productFind += 1;
    return [];
  };
  Product.updateOne = async () => {
    calls.productUpdateOne += 1;
    return { modifiedCount: 1 };
  };
  Order.create = async () => {
    calls.orderCreate += 1;
    return {};
  };
  CheckoutAttempt.create = async () => {
    calls.checkoutAttemptCreate += 1;
    return {};
  };

  const { nextError } = await callController(createCheckout, {
    body: {
      shippingInfo: {},
      items: [],
    },
    headers: {},
    get: () => "",
    socket: {},
  });

  assert.equal(nextError?.statusCode, 503);
  assert.match(nextError?.message || "", /temporarily unavailable/i);
  assert.equal(/index|mongo|database/i.test(nextError?.message || ""), false);
  assert.deepEqual(calls, {
    productFind: 0,
    productUpdateOne: 0,
    orderCreate: 0,
    checkoutAttemptCreate: 0,
  });
});

test("checkout creation fails closed when the idempotency index is missing", async (t) => {
  const originals = {
    productFind: Product.find,
    productUpdateOne: Product.updateOne,
    orderCreate: Order.create,
    checkoutAttemptCreate: CheckoutAttempt.create,
  };
  const calls = {
    productFind: 0,
    productUpdateOne: 0,
    orderCreate: 0,
    checkoutAttemptCreate: 0,
  };

  await refreshCheckoutAttemptIndexReadiness({
    collection: {
      indexes: async () => [],
    },
  });
  t.after(() => {
    Product.find = originals.productFind;
    Product.updateOne = originals.productUpdateOne;
    Order.create = originals.orderCreate;
    CheckoutAttempt.create = originals.checkoutAttemptCreate;
    resetCheckoutAttemptIndexReadinessForTests();
  });

  Product.find = async () => {
    calls.productFind += 1;
    return [];
  };
  Product.updateOne = async () => {
    calls.productUpdateOne += 1;
    return { modifiedCount: 1 };
  };
  Order.create = async () => {
    calls.orderCreate += 1;
    return {};
  };
  CheckoutAttempt.create = async () => {
    calls.checkoutAttemptCreate += 1;
    return {};
  };

  const { nextError } = await callController(createCheckout, {
    body: {
      shippingInfo: {
        fullName: "Asha Customer",
        email: "asha.customer@example.com",
        phone: "9876543210",
        address: {
          house: "12 Studio House",
          area: "Bandra West",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400050",
        },
      },
      items: [
        {
          productId: "507f1f77bcf86cd799439011",
          quantity: 1,
          size: "M",
          color: "Black",
        },
      ],
    },
    headers: {},
    get: () => "",
    socket: {},
  });

  assert.equal(nextError?.statusCode, 503);
  assert.match(nextError?.message || "", /temporarily unavailable/i);
  assert.equal(/index|mongo|database/i.test(nextError?.message || ""), false);
  assert.deepEqual(calls, {
    productFind: 0,
    productUpdateOne: 0,
    orderCreate: 0,
    checkoutAttemptCreate: 0,
  });
});

test("checkout creation can proceed past readiness gate when the exact idempotency index is verified", async (t) => {
  await refreshCheckoutAttemptIndexReadiness({ collection: validCheckoutIndexCollection() });
  t.after(() => {
    resetCheckoutAttemptIndexReadinessForTests();
  });

  const { nextError } = await callController(createCheckout, {
    body: {
      shippingInfo: {},
      items: [],
    },
    headers: {},
    get: () => "",
    socket: {},
  });

  assert.notEqual(nextError?.statusCode, 503);
  assert.match(nextError?.message || "", /required/i);
});

test("payment confirmation blocks tracked inventory with released reservations", async (t) => {
  installOrderStubs(t);
  const originalSecret = env.RAZORPAY_KEY_SECRET;
  env.RAZORPAY_KEY_SECRET = "checkout-secret";
  t.after(() => {
    env.RAZORPAY_KEY_SECRET = originalSecret;
  });

  let lockSaveCalled = false;
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
  };

  Order.findById = async () => order;
  Order.findOneAndUpdate = async (filter, update) => {
    if (filter.paymentConfirmationLockId) {
      lockSaveCalled = true;
      Object.assign(order, update.$set);
      return order;
    }
    order.paymentConfirmationLockId = update.$set.paymentConfirmationLockId;
    order.paymentConfirmationStartedAt = update.$set.paymentConfirmationStartedAt;
    return order;
  };

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
  assert.equal(lockSaveCalled, true);
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

test("payment confirmation rejects concurrent finalization attempts with a stable retry error", async (t) => {
  installOrderStubs(t);
  const originalSecret = env.RAZORPAY_KEY_SECRET;
  env.RAZORPAY_KEY_SECRET = "checkout-secret";
  t.after(() => {
    env.RAZORPAY_KEY_SECRET = originalSecret;
  });

  const order = {
    _id: "507f1f77bcf86cd799439011",
    checkoutSessionId: "order_razorpay",
    paymentStatus: "initiated",
    orderStatus: "Pending",
    inventoryReservationStatus: "reserved",
    inventoryReservationExpiresAt: new Date(Date.now() + 60_000),
    products: [{ inventoryTracked: true }],
  };
  Order.findById = async () => order;
  Order.findOneAndUpdate = async () => null;

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
  assert.match(nextError?.message || "", /already in progress/i);
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

  const webhookEvent = {
    status: "processing",
    processedAt: null,
    resultCode: "",
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
  Order.findOneAndUpdate = async (filter, update) => {
    if (filter.paymentConfirmationLockId) {
      Object.assign(order, update.$set);
      return order;
    }
    order.paymentConfirmationLockId = update.$set.paymentConfirmationLockId;
    order.paymentConfirmationStartedAt = update.$set.paymentConfirmationStartedAt;
    return order;
  };

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

test("captured webhook amount mismatch is durably routed to manual review", async (t) => {
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

  const webhookEvent = {
    status: "processing",
    resultCode: "",
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
    inventoryReservationExpiresAt: new Date(Date.now() + 60_000),
    paymentReconciliationResultCode: "",
    checkoutLogs: [],
    products: [{ inventoryTracked: true }],
    save: async () => order,
  };
  const body = {
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: "pay_mismatch",
          order_id: order.checkoutSessionId,
          status: "captured",
          amount: 50001,
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
      "x-razorpay-event-id": "evt_amount_mismatch",
    },
    socket: {},
  });

  assert.ifError(nextError);
  assert.equal(res.statusCode, 202);
  assert.equal(res.body.manualReview, true);
  assert.equal(res.body.reason, RECONCILIATION_RESULT_CODES.PAYMENT_AMOUNT_MISMATCH);
  assert.equal(order.paymentStatus, "initiated");
  assert.equal(
    order.paymentReconciliationResultCode,
    RECONCILIATION_RESULT_CODES.PAYMENT_AMOUNT_MISMATCH
  );
  assert.equal(order.paymentProviderPaymentId, "pay_mismatch");
  assert.equal(webhookEvent.status, "completed");
  assert.equal(webhookEvent.resultCode, RECONCILIATION_RESULT_CODES.PAYMENT_AMOUNT_MISMATCH);
});

test("customer cancellation releases unpaid checkout inventory exactly once", async (t) => {
  const originalSecret = env.RAZORPAY_KEY_SECRET;
  env.RAZORPAY_KEY_SECRET = "checkout-secret";
  t.after(() => {
    env.RAZORPAY_KEY_SECRET = originalSecret;
  });
  const order = buildTerminalOrder();
  const terminalStubs = installTerminalPaymentStubs(t, order);

  const { res, nextError } = await callController(cancelCheckout, {
    query: {
      orderId: order._id,
      checkoutState: signCheckoutState({
        orderId: order._id,
        checkoutSessionId: order.checkoutSessionId,
        secret: env.RAZORPAY_KEY_SECRET,
      }),
    },
    headers: {},
    socket: {},
  });

  assert.ifError(nextError);
  assert.match(res.redirectUrl, /\/checkout\/failure/);
  assert.equal(order.paymentStatus, "cancelled");
  assert.equal(order.orderStatus, "Cancelled");
  assert.equal(order.inventoryReservationStatus, "released");
  assert.equal(terminalStubs.releaseUpdates, 1);

  await callController(cancelCheckout, {
    query: {
      orderId: order._id,
      checkoutState: signCheckoutState({
        orderId: order._id,
        checkoutSessionId: order.checkoutSessionId,
        secret: env.RAZORPAY_KEY_SECRET,
      }),
    },
    headers: {},
    socket: {},
  });

  assert.equal(terminalStubs.releaseUpdates, 1);
});

test("payment.failed webhook releases inventory and closes the order", async (t) => {
  installOrderStubs(t);
  const originalWebhookSecret = env.RAZORPAY_WEBHOOK_SECRET;
  const originalCurrency = env.RAZORPAY_CURRENCY;
  env.RAZORPAY_WEBHOOK_SECRET = "webhook-secret";
  env.RAZORPAY_CURRENCY = "INR";
  t.after(() => {
    env.RAZORPAY_WEBHOOK_SECRET = originalWebhookSecret;
    env.RAZORPAY_CURRENCY = originalCurrency;
  });
  const order = buildTerminalOrder();
  const webhookEvent = installWebhookEventStub(t);
  const terminalStubs = installTerminalPaymentStubs(t, order);

  const { res, nextError } = await callController(
    razorpayWebhook,
    buildWebhookRequest({ event: "payment.failed" })
  );

  assert.ifError(nextError);
  assert.equal(res.body.received, true);
  assert.equal(order.paymentStatus, "failed");
  assert.equal(order.orderStatus, "Cancelled");
  assert.equal(order.inventoryReservationStatus, "released");
  assert.equal(terminalStubs.releaseUpdates, 1);
  assert.equal(webhookEvent.resultCode, RECONCILIATION_RESULT_CODES.PAYMENT_FAILED_RESERVATION_RELEASED);
});

test("duplicate payment.failed webhooks do not release inventory twice", async (t) => {
  installOrderStubs(t);
  const originalWebhookSecret = env.RAZORPAY_WEBHOOK_SECRET;
  const originalCurrency = env.RAZORPAY_CURRENCY;
  env.RAZORPAY_WEBHOOK_SECRET = "webhook-secret";
  env.RAZORPAY_CURRENCY = "INR";
  t.after(() => {
    env.RAZORPAY_WEBHOOK_SECRET = originalWebhookSecret;
    env.RAZORPAY_CURRENCY = originalCurrency;
  });
  const order = buildTerminalOrder({
    paymentStatus: "failed",
    orderStatus: "Cancelled",
    inventoryReservationStatus: "released",
    inventoryReservationExpiresAt: null,
  });
  installWebhookEventStub(t);
  const terminalStubs = installTerminalPaymentStubs(t, order);

  const { nextError } = await callController(
    razorpayWebhook,
    buildWebhookRequest({ event: "payment.failed", paymentId: "pay_failed_duplicate" })
  );

  assert.ifError(nextError);
  assert.equal(order.paymentStatus, "failed");
  assert.equal(order.orderStatus, "Cancelled");
  assert.equal(terminalStubs.releaseUpdates, 0);
});

test("late payment capture after cancellation is routed to manual review", async (t) => {
  installOrderStubs(t);
  const originalWebhookSecret = env.RAZORPAY_WEBHOOK_SECRET;
  const originalCurrency = env.RAZORPAY_CURRENCY;
  env.RAZORPAY_WEBHOOK_SECRET = "webhook-secret";
  env.RAZORPAY_CURRENCY = "INR";
  t.after(() => {
    env.RAZORPAY_WEBHOOK_SECRET = originalWebhookSecret;
    env.RAZORPAY_CURRENCY = originalCurrency;
  });
  const order = buildTerminalOrder({
    paymentStatus: "cancelled",
    orderStatus: "Cancelled",
    inventoryReservationStatus: "released",
    inventoryReservationExpiresAt: null,
  });
  const webhookEvent = installWebhookEventStub(t);
  installTerminalPaymentStubs(t, order);

  const { res, nextError } = await callController(
    razorpayWebhook,
    buildWebhookRequest({ event: "payment.captured", paymentId: "pay_late_capture" })
  );

  assert.ifError(nextError);
  assert.equal(res.statusCode, 202);
  assert.equal(res.body.manualReview, true);
  assert.equal(res.body.reason, "reservation-missing");
  assert.equal(order.paymentStatus, "cancelled");
  assert.equal(order.orderStatus, "Cancelled");
  assert.equal(order.paymentReconciliationResultCode, RECONCILIATION_RESULT_CODES.MANUAL_REVIEW_REQUIRED);
  assert.equal(webhookEvent.resultCode, RECONCILIATION_RESULT_CODES.MANUAL_REVIEW_REQUIRED);
});

test("payment.failed release failure preserves manual review state", async (t) => {
  installOrderStubs(t);
  const originalWebhookSecret = env.RAZORPAY_WEBHOOK_SECRET;
  const originalCurrency = env.RAZORPAY_CURRENCY;
  env.RAZORPAY_WEBHOOK_SECRET = "webhook-secret";
  env.RAZORPAY_CURRENCY = "INR";
  t.after(() => {
    env.RAZORPAY_WEBHOOK_SECRET = originalWebhookSecret;
    env.RAZORPAY_CURRENCY = originalCurrency;
  });
  const order = buildTerminalOrder();
  const webhookEvent = installWebhookEventStub(t);
  installTerminalPaymentStubs(t, order, {
    updateOne: async () => ({ modifiedCount: 0 }),
  });

  const { nextError } = await callController(
    razorpayWebhook,
    buildWebhookRequest({ event: "payment.failed", paymentId: "pay_release_failed" })
  );

  assert.equal(nextError?.statusCode, 409);
  assert.match(nextError?.message || "", /could not be released/i);
  assert.equal(order.inventoryReservationStatus, "reserved");
  assert.equal(order.paymentReconciliationResultCode, RECONCILIATION_RESULT_CODES.MANUAL_REVIEW_REQUIRED);
  assert.equal(webhookEvent.status, "failed");
});

test("concurrent cancellation and capture cannot both release and confirm inventory", async (t) => {
  installOrderStubs(t);
  const originalWebhookSecret = env.RAZORPAY_WEBHOOK_SECRET;
  const originalKeySecret = env.RAZORPAY_KEY_SECRET;
  const originalCurrency = env.RAZORPAY_CURRENCY;
  env.RAZORPAY_WEBHOOK_SECRET = "webhook-secret";
  env.RAZORPAY_KEY_SECRET = "checkout-secret";
  env.RAZORPAY_CURRENCY = "INR";
  t.after(() => {
    env.RAZORPAY_WEBHOOK_SECRET = originalWebhookSecret;
    env.RAZORPAY_KEY_SECRET = originalKeySecret;
    env.RAZORPAY_CURRENCY = originalCurrency;
  });
  const order = buildTerminalOrder();
  installWebhookEventStub(t);
  let releaseUpdate;
  const releaseGate = new Promise((resolve) => {
    releaseUpdate = resolve;
  });
  const terminalStubs = installTerminalPaymentStubs(t, order, {
    updateOne: async () => {
      await releaseGate;
      return { modifiedCount: 1 };
    },
  });

  const cancelPromise = callController(cancelCheckout, {
    query: {
      orderId: order._id,
      checkoutState: signCheckoutState({
        orderId: order._id,
        checkoutSessionId: order.checkoutSessionId,
        secret: env.RAZORPAY_KEY_SECRET,
      }),
    },
    headers: {},
    socket: {},
  });
  await new Promise((resolve) => setImmediate(resolve));
  const captureResult = await callController(
    razorpayWebhook,
    buildWebhookRequest({ event: "payment.captured", paymentId: "pay_concurrent_capture" })
  );
  releaseUpdate();
  const cancelResult = await cancelPromise;

  assert.ifError(cancelResult.nextError);
  assert.equal(captureResult.nextError?.statusCode, 409);
  assert.equal(order.paymentStatus, "cancelled");
  assert.equal(order.orderStatus, "Cancelled");
  assert.equal(order.inventoryReservationStatus, "released");
  assert.equal(terminalStubs.releaseUpdates, 1);
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

test("public order tracking redacts contact and precise address details", async (t) => {
  installOrderStubs(t);

  Order.findById = async () => ({
    _id: "507f1f77bcf86cd799439011",
    id: "507f1f77bcf86cd799439011",
    orderNumber: 42,
    customerName: "Asha Customer",
    customerEmail: "asha.customer@example.com",
    customerPhone: "9876543210",
    paymentStatus: "paid",
    orderStatus: "Confirmed",
    shippingAddress: "Flat 12, Pearl Heights, Bandra West, Mumbai, Maharashtra, 400050",
    shippingAddressDetails: {
      house: "Flat 12, Pearl Heights",
      area: "Bandra West",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400050",
    },
    paymentMethod: "Razorpay",
    courierName: "",
    trackingId: "",
    trackingUrl: "",
    totalAmount: 999,
    totalPaise: 99900,
    products: [],
    createdAt: new Date("2026-08-01T10:00:00.000Z"),
    updatedAt: new Date("2026-08-01T10:00:00.000Z"),
  });

  const { res, nextError } = await callController(trackOrder, {
    body: {
      orderId: "507f1f77bcf86cd799439011",
      email: "asha.customer@example.com",
    },
    headers: {},
    socket: {},
  });

  assert.ifError(nextError);
  assert.equal(res.body.customerName, "A***");
  assert.equal(res.body.customerEmail, "as***@example.com");
  assert.equal(res.body.customerPhone, "******3210");
  assert.equal(res.body.shippingAddress, "Mumbai, Maharashtra, 400050");
  assert.equal("shippingAddressDetails" in res.body, false);
});

test("public order tracking uses a generic lookup failure to reduce enumeration", async (t) => {
  installOrderStubs(t);

  Order.findById = async () => ({
    _id: "507f1f77bcf86cd799439011",
    customerEmail: "owner@example.com",
    customerPhone: "9876543210",
  });

  const { nextError } = await callController(trackOrder, {
    body: {
      orderId: "507f1f77bcf86cd799439011",
      email: "attacker@example.com",
    },
    headers: {},
    socket: {},
  });

  assert.equal(nextError?.statusCode, 404);
  assert.match(nextError?.message || "", /not found or lookup details/i);
});

test("public order tracking returns the same generic response for valid missing and mismatched phone lookups", async (t) => {
  installOrderStubs(t);
  const existingOrder = {
    _id: "507f1f77bcf86cd799439011",
    customerEmail: "owner@example.com",
    customerPhone: "9876543210",
  };

  Order.findById = async (orderId) =>
    orderId === existingOrder._id ? existingOrder : null;

  const missingOrder = await callController(trackOrder, {
    body: {
      orderId: "507f1f77bcf86cd799439012",
      phone: "9876543210",
    },
    headers: {},
    socket: {},
  });
  const mismatchedPhone = await callController(trackOrder, {
    body: {
      orderId: "507f1f77bcf86cd799439011",
      phone: "9876543211",
    },
    headers: {},
    socket: {},
  });

  assert.equal(missingOrder.nextError?.statusCode, 404);
  assert.equal(mismatchedPhone.nextError?.statusCode, 404);
  assert.equal(missingOrder.nextError?.message, mismatchedPhone.nextError?.message);
  assert.match(missingOrder.nextError?.message || "", /not found or lookup details/i);
});

test("public order tracking accepts equivalent Indian phone formats", async (t) => {
  installOrderStubs(t);

  Order.findById = async () => ({
    _id: "507f1f77bcf86cd799439011",
    id: "507f1f77bcf86cd799439011",
    orderNumber: 42,
    customerName: "Asha Customer",
    customerEmail: "asha.customer@example.com",
    customerPhone: "9876543210",
    paymentStatus: "paid",
    orderStatus: "Confirmed",
    shippingAddress: "Mumbai, Maharashtra, 400050",
    shippingAddressDetails: {
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400050",
    },
    paymentMethod: "Razorpay",
    courierName: "",
    trackingId: "",
    trackingUrl: "",
    totalAmount: 999,
    totalPaise: 99900,
    products: [],
    createdAt: new Date("2026-08-01T10:00:00.000Z"),
    updatedAt: new Date("2026-08-01T10:00:00.000Z"),
  });

  for (const phone of [
    "9876543210",
    "+91 98765 43210",
    "+91-98765-43210",
    "09876543210",
  ]) {
    const { res, nextError } = await callController(trackOrder, {
      body: {
        orderId: "507f1f77bcf86cd799439011",
        phone,
      },
      headers: {},
      socket: {},
    });

    assert.ifError(nextError);
    assert.equal(res.body.customerPhone, "******3210");
  }
});

test("public order tracking rejects invalid phone format before any order lookup", async (t) => {
  installOrderStubs(t);
  let findByIdCalls = 0;
  let findOneCalls = 0;

  Order.findById = async () => {
    findByIdCalls += 1;
    throw new Error("Order.findById should not be called for invalid phone input");
  };
  Order.findOne = async () => {
    findOneCalls += 1;
    throw new Error("Order.findOne should not be called for invalid phone input");
  };

  const existingReference = await callController(trackOrder, {
    body: {
      orderId: "507f1f77bcf86cd799439011",
      phone: "+91 51234 56789",
    },
    headers: {},
    socket: {},
  });
  const missingReference = await callController(trackOrder, {
    body: {
      orderId: "507f1f77bcf86cd799439012",
      phone: "+91 51234 56789",
    },
    headers: {},
    socket: {},
  });

  assert.equal(existingReference.nextError?.statusCode, 400);
  assert.equal(missingReference.nextError?.statusCode, 400);
  assert.equal(existingReference.nextError?.message, missingReference.nextError?.message);
  assert.match(existingReference.nextError?.message || "", /valid 10-digit indian phone/i);
  assert.equal(findByIdCalls, 0);
  assert.equal(findOneCalls, 0);
});

test("public order tracking rejects invalid order references before database lookup", async (t) => {
  installOrderStubs(t);
  let findByIdCalls = 0;
  let findOneCalls = 0;

  Order.findById = async () => {
    findByIdCalls += 1;
    throw new Error("Order.findById should not be called for invalid order references");
  };
  Order.findOne = async () => {
    findOneCalls += 1;
    throw new Error("Order.findOne should not be called for invalid order references");
  };

  const { nextError } = await callController(trackOrder, {
    body: {
      orderId: "not-an-order-id",
      phone: "9876543210",
    },
    headers: {},
    socket: {},
  });

  assert.equal(nextError?.statusCode, 404);
  assert.match(nextError?.message || "", /not found or lookup details/i);
  assert.equal(findByIdCalls, 0);
  assert.equal(findOneCalls, 0);
});

test("public order tracking still returns tracking data for a valid matching phone", async (t) => {
  installOrderStubs(t);

  Order.findById = async () => ({
    _id: "507f1f77bcf86cd799439011",
    id: "507f1f77bcf86cd799439011",
    orderNumber: 42,
    customerName: "Asha Customer",
    customerEmail: "asha.customer@example.com",
    customerPhone: "9876543210",
    paymentStatus: "paid",
    orderStatus: "Confirmed",
    shippingAddress: "Mumbai, Maharashtra, 400050",
    shippingAddressDetails: {
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400050",
    },
    paymentMethod: "Razorpay",
    courierName: "",
    trackingId: "",
    trackingUrl: "",
    totalAmount: 999,
    totalPaise: 99900,
    products: [],
    createdAt: new Date("2026-08-01T10:00:00.000Z"),
    updatedAt: new Date("2026-08-01T10:00:00.000Z"),
  });

  const { res, nextError } = await callController(trackOrder, {
    body: {
      orderId: "507f1f77bcf86cd799439011",
      phone: "+91 98765 43210",
    },
    headers: {},
    socket: {},
  });

  assert.ifError(nextError);
  assert.equal(res.body.orderStatus, "Confirmed");
  assert.equal(res.body.customerPhone, "******3210");
});

test("order status transition guard blocks terminal and backward fulfillment moves", () => {
  assert.equal(canTransitionOrderStatus("Delivered", "Confirmed"), false);
  assert.equal(canTransitionOrderStatus("Cancelled", "Shipped"), false);
  assert.equal(canTransitionOrderStatus("Confirmed", "Packed"), true);
  assert.equal(canTransitionOrderStatus("Delivered", "Returned"), true);
});

test("admin order list filter supports safe search, status, payment, and date filters", () => {
  const filter = buildAdminOrderFilter({
    search: "Asha (VIP)",
    status: "Packed",
    payment: "paid",
    from: "2026-08-01T00:00:00.000Z",
    to: "2026-08-23T23:59:59.000Z",
  });

  assert.equal(filter.orderStatus, "Packed");
  assert.equal(filter.paymentStatus, "paid");
  assert.ok(filter.createdAt.$gte instanceof Date);
  assert.ok(filter.createdAt.$lte instanceof Date);
  assert.equal(filter.$and.length, 1);
  assert.ok(filter.$and[0].$or.some((branch) => branch.customerName));
  assert.match(filter.$and[0].$or[0].customerName.source, /Asha/);
});

test("admin order list ignores unsupported filters and maps supported sort keys", () => {
  const filter = buildAdminOrderFilter({
    status: "Refunded",
    payment: "captured",
  });

  assert.deepEqual(filter, {});
  assert.deepEqual(buildAdminOrderSort({ sort: "value-desc" }), {
    totalPaise: -1,
    totalAmount: -1,
    createdAt: -1,
  });
  assert.deepEqual(buildAdminOrderSort({ sort: "unknown" }), { createdAt: -1 });
});

test("admin order status updates reject invalid lifecycle transitions", async (t) => {
  installOrderStubs(t);
  let updateCalled = false;

  Order.findById = async () => ({
    _id: "507f1f77bcf86cd799439011",
    paymentStatus: "paid",
    orderStatus: "Delivered",
  });
  Order.findOneAndUpdate = async () => {
    updateCalled = true;
    return null;
  };

  const { nextError } = await callController(updateOrderStatus, {
    params: { id: "507f1f77bcf86cd799439011" },
    body: { orderStatus: "Confirmed" },
    user: { _id: "admin-id", email: "admin@example.com" },
    headers: {},
    socket: {},
  });

  assert.equal(nextError?.statusCode, 409);
  assert.match(nextError?.message || "", /invalid order status transition/i);
  assert.equal(updateCalled, false);
});

test("admin order status updates are conditional on the previously read status", async (t) => {
  installOrderStubs(t);
  let capturedFilter;

  Order.findById = async () => ({
    _id: "507f1f77bcf86cd799439011",
    paymentStatus: "paid",
    orderStatus: "Confirmed",
  });
  Order.findOneAndUpdate = async (filter, update) => {
    capturedFilter = filter;
    return {
      _id: filter._id,
      paymentStatus: "paid",
      orderStatus: update.$set?.orderStatus || update.orderStatus,
      checkoutLogs: [],
    };
  };

  const { res, nextError } = await callController(updateOrderStatus, {
    params: { id: "507f1f77bcf86cd799439011" },
    body: { orderStatus: "Packed" },
    user: { _id: "admin-id", email: "admin@example.com" },
    headers: {},
    socket: {},
  });

  assert.ifError(nextError);
  assert.equal(res.body.orderStatus, "Packed");
  assert.equal(capturedFilter.orderStatus, "Confirmed");
  assert.equal(capturedFilter.paymentStatus, "paid");
});

test("reorders revalidate current product availability before rebuilding cart", async (t) => {
  const originals = {
    orderFindById: Order.findById,
    cartFindOne: Cart.findOne,
    cartCreate: Cart.create,
    productFind: Product.find,
  };
  t.after(() => {
    Order.findById = originals.orderFindById;
    Cart.findOne = originals.cartFindOne;
    Cart.create = originals.cartCreate;
    Product.find = originals.productFind;
  });

  let cartSaved = false;
  const productId = "507f1f77bcf86cd799439012";
  Order.findById = async () => ({
    _id: "507f1f77bcf86cd799439011",
    userId: { toString: () => "507f1f77bcf86cd799439010" },
    products: [
      {
        productId,
        quantity: 1,
        size: "M",
        color: "Black",
        fit: "Oversize",
      },
    ],
  });
  Cart.findOne = () => ({
    populate: async () => ({
      items: [],
      save: async () => {
        cartSaved = true;
      },
      populate: async () => {},
    }),
  });
  Product.find = async () => [];

  const { nextError } = await callController(reorderOrder, {
    params: { id: "507f1f77bcf86cd799439011" },
    user: { _id: { toString: () => "507f1f77bcf86cd799439010" } },
    headers: {},
    socket: {},
  });

  assert.equal(nextError?.statusCode, 409);
  assert.match(nextError?.message || "", /no longer available/i);
  assert.equal(cartSaved, false);
});

test("reorder rejects guest-owned orders without throwing", async (t) => {
  installOrderStubs(t);

  Order.findById = async () => ({
    _id: "507f1f77bcf86cd799439011",
    userId: null,
    products: [],
  });

  const { nextError } = await callController(reorderOrder, {
    params: { id: "507f1f77bcf86cd799439011" },
    user: { _id: { toString: () => "507f1f77bcf86cd799439010" } },
    headers: {},
    socket: {},
  });

  assert.equal(nextError?.statusCode, 403);
  assert.match(nextError?.message || "", /not authorized/i);
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
