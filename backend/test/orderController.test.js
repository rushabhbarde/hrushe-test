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
const orderRoutes = require("../src/routes/orderRoutes");
const {
  razorpayWebhook,
  reconcileOrderPayment,
  reorderOrder,
  trackOrder,
  updateOrderStatus,
  getCheckoutPaymentConfig,
  verifyCheckout,
  __private: {
    RECONCILIATION_RESULT_CODES,
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

test("order status transition guard blocks terminal and backward fulfillment moves", () => {
  assert.equal(canTransitionOrderStatus("Delivered", "Confirmed"), false);
  assert.equal(canTransitionOrderStatus("Cancelled", "Shipped"), false);
  assert.equal(canTransitionOrderStatus("Confirmed", "Packed"), true);
  assert.equal(canTransitionOrderStatus("Delivered", "Returned"), true);
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
