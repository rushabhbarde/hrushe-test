const test = require("node:test");
const assert = require("node:assert/strict");

const CheckoutAttempt = require("../src/models/CheckoutAttempt");
const {
  buildCheckoutCartHash,
  buildCheckoutIdentityHash,
  buildCheckoutRequestHash,
  runCheckoutWithIdempotency,
} = require("../src/services/checkoutIdempotency");

const sleep = (durationMs) =>
  new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });

function installCheckoutAttemptStore(t) {
  const originals = {
    create: CheckoutAttempt.create,
    findOne: CheckoutAttempt.findOne,
    findOneAndUpdate: CheckoutAttempt.findOneAndUpdate,
  };
  const records = [];
  let nextId = 1;

  t.after(() => {
    CheckoutAttempt.create = originals.create;
    CheckoutAttempt.findOne = originals.findOne;
    CheckoutAttempt.findOneAndUpdate = originals.findOneAndUpdate;
  });

  CheckoutAttempt.create = async (payload) => {
    if (records.some((record) => record.active === true && record.keyHash === payload.keyHash)) {
      const error = new Error("duplicate key");
      error.code = 11000;
      throw error;
    }

    const record = {
      _id: `attempt-${nextId++}`,
      ...payload,
    };
    records.push(record);
    return record;
  };

  CheckoutAttempt.findOne = async (query) =>
    records.find((record) =>
      Object.entries(query).every(([key, value]) => record[key] === value)
    ) || null;

  CheckoutAttempt.findOneAndUpdate = async (query, update) => {
    const record = records.find((candidate) => {
      if (query._id && candidate._id !== query._id) {
        return false;
      }
      if (query.keyHash && candidate.keyHash !== query.keyHash) {
        return false;
      }
      if (query.active !== undefined && candidate.active !== query.active) {
        return false;
      }
      if (query.status && candidate.status !== query.status) {
        return false;
      }
      if (query.expiresAt?.$lte) {
        return new Date(candidate.expiresAt).getTime() <= new Date(query.expiresAt.$lte).getTime();
      }
      return true;
    });

    if (!record) {
      return null;
    }

    Object.assign(record, update.$set || {});
    return record;
  };

  return records;
}

function buildContext(patch = {}) {
  const items = [
    {
      productId: "507f1f77bcf86cd799439011",
      size: "M",
      color: "Black",
      fit: "Regular",
      sku: "HRU-TEE-M-BLK",
      quantity: 1,
      pricePaise: 129900,
    },
  ];
  const totals = {
    subtotalPaise: 129900,
    discountPaise: 0,
    shippingPaise: 0,
    taxPaise: 0,
    totalPaise: 129900,
  };
  const identityHash = buildCheckoutIdentityHash({
    userId: patch.userId || null,
    email: patch.email || "customer@example.com",
    phone: patch.phone || "9876543210",
  });
  const cartHash = buildCheckoutCartHash(patch.items || items, patch.totals || totals);
  const requestHash = buildCheckoutRequestHash({
    identityHash,
    cartHash,
    shippingAddressDetails: {
      label: "Home",
      fullName: "Aarav Mehta",
      mobile: patch.phone || "9876543210",
      pincode: "400050",
      city: "Mumbai",
      state: "Maharashtra",
      house: "12 Studio House",
      area: "Bandra West",
      landmark: "",
    },
  });

  return {
    idempotencyKey: patch.idempotencyKey || "checkout-test-key-123",
    identityHash,
    cartHash,
    requestHash,
    expiresAt: patch.expiresAt || new Date(Date.now() + 60_000),
    buildReplayResponse: (snapshot) => ({
      ...snapshot,
      customer: {
        name: "Aarav Mehta",
        email: patch.email || "customer@example.com",
        phone: patch.phone || "9876543210",
      },
    }),
  };
}

test("parallel duplicate checkout attempts execute side effects once and replay the session", async (t) => {
  installCheckoutAttemptStore(t);
  let inventoryReservations = 0;
  let razorpayOrders = 0;
  let hrusheOrders = 0;
  const context = buildContext();

  const createCheckoutSession = async () => {
    inventoryReservations += 1;
    await sleep(80);
    razorpayOrders += 1;
    hrusheOrders += 1;
    const responseSnapshot = {
      appOrderId: "507f1f77bcf86cd799439012",
      orderId: 42,
      razorpayOrderId: "order_razorpay",
      amount: 129900,
      currency: "INR",
      key: "rzp_test_123",
      paymentStatus: "initiated",
      mode: "provider",
      checkoutState: "state",
    };

    return {
      responseSnapshot,
      response: context.buildReplayResponse(responseSnapshot),
    };
  };

  const [first, second] = await Promise.all([
    runCheckoutWithIdempotency({ ...context, createCheckoutSession }),
    runCheckoutWithIdempotency({ ...context, createCheckoutSession }),
  ]);

  assert.equal(inventoryReservations, 1);
  assert.equal(razorpayOrders, 1);
  assert.equal(hrusheOrders, 1);
  assert.equal(first.response.razorpayOrderId, "order_razorpay");
  assert.equal(second.response.razorpayOrderId, "order_razorpay");
  assert.equal(first.replayed, false);
  assert.equal(second.replayed, true);
});

test("reusing a checkout idempotency key for another cart is rejected", async (t) => {
  installCheckoutAttemptStore(t);
  const firstContext = buildContext();
  const secondContext = buildContext({
    items: [
      {
        productId: "507f1f77bcf86cd799439011",
        size: "L",
        color: "Black",
        fit: "Regular",
        sku: "HRU-TEE-L-BLK",
        quantity: 1,
        pricePaise: 129900,
      },
    ],
  });

  await runCheckoutWithIdempotency({
    ...firstContext,
    createCheckoutSession: async () => {
      const responseSnapshot = {
        appOrderId: "507f1f77bcf86cd799439012",
        orderId: 42,
        razorpayOrderId: "order_razorpay",
        amount: 129900,
        currency: "INR",
        key: "rzp_test_123",
        paymentStatus: "initiated",
        mode: "provider",
        checkoutState: "state",
      };

      return {
        responseSnapshot,
        response: firstContext.buildReplayResponse(responseSnapshot),
      };
    },
  });

  await assert.rejects(
    () =>
      runCheckoutWithIdempotency({
        ...secondContext,
        createCheckoutSession: async () => {
          throw new Error("side effects should not run");
        },
      }),
    /different checkout/i
  );
});

test("expired checkout attempts allow a new session with the same key", async (t) => {
  const records = installCheckoutAttemptStore(t);
  const context = buildContext();
  let sessionsCreated = 0;

  await runCheckoutWithIdempotency({
    ...context,
    createCheckoutSession: async () => {
      sessionsCreated += 1;
      const responseSnapshot = {
        appOrderId: `507f1f77bcf86cd79943901${sessionsCreated}`,
        orderId: 42,
        razorpayOrderId: `order_razorpay_${sessionsCreated}`,
        amount: 129900,
        currency: "INR",
        key: "rzp_test_123",
        paymentStatus: "initiated",
        mode: "provider",
        checkoutState: "state",
      };

      return {
        responseSnapshot,
        response: context.buildReplayResponse(responseSnapshot),
      };
    },
  });
  records[0].expiresAt = new Date(Date.now() - 1000);

  const second = await runCheckoutWithIdempotency({
    ...context,
    createCheckoutSession: async () => {
      sessionsCreated += 1;
      const responseSnapshot = {
        appOrderId: "507f1f77bcf86cd799439099",
        orderId: 43,
        razorpayOrderId: "order_razorpay_new",
        amount: 129900,
        currency: "INR",
        key: "rzp_test_123",
        paymentStatus: "initiated",
        mode: "provider",
        checkoutState: "state",
      };

      return {
        responseSnapshot,
        response: context.buildReplayResponse(responseSnapshot),
      };
    },
  });

  assert.equal(sessionsCreated, 2);
  assert.equal(records[0].active, false);
  assert.equal(second.response.razorpayOrderId, "order_razorpay_new");
});
