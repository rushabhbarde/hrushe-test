const test = require("node:test");
const assert = require("node:assert/strict");

const auditLog = require("../src/utils/auditLog");
auditLog.recordAuditLog = async () => {};

const Order = require("../src/models/Order");
const {
  reconcileOrderPayment,
  __private: {
    RECONCILIATION_RESULT_CODES,
    selectRazorpayPaymentForOrder,
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
    findOneAndUpdate: Order.findOneAndUpdate,
  };

  t.after(() => {
    Order.findById = originals.findById;
    Order.findOneAndUpdate = originals.findOneAndUpdate;
  });
};

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
