const test = require("node:test");
const assert = require("node:assert/strict");
const {
  commitOrderInventory,
  cleanupExpiredInventoryReservations,
  normalizeCheckoutSelections,
  resolveCheckoutItems,
  releaseOrderInventory,
} = require("../src/services/checkoutInventory");
const Product = require("../src/models/Product");
const Order = require("../src/models/Order");

const productId = "507f1f77bcf86cd799439011";

test("checkout selections ignore browser supplied price and product copy", () => {
  const [selection] = normalizeCheckoutSelections([
    {
      productId,
      quantity: 2,
      size: "M",
      color: "Black",
      fit: "Oversize",
      price: 1,
      name: "Tampered name",
      image: "tampered-image",
    },
  ]);

  assert.deepEqual(selection, {
    productId,
    quantity: 2,
    size: "M",
    color: "Black",
    fit: "Oversize",
  });
});

test("duplicate variant lines are combined before stock validation", () => {
  const selections = normalizeCheckoutSelections([
    { productId, quantity: 1, size: "L", color: "Cream" },
    { productId, quantity: 2, size: "L", color: "cream" },
  ]);

  assert.equal(selections.length, 1);
  assert.equal(selections[0].quantity, 3);
});

test("invalid cart identifiers and quantities are rejected", () => {
  assert.throws(
    () => normalizeCheckoutSelections([{ productId: "not-an-id", quantity: 1 }]),
    /invalid product/i
  );
  assert.throws(
    () => normalizeCheckoutSelections([{ productId, quantity: 0 }]),
    /whole numbers/i
  );
  assert.throws(
    () => normalizeCheckoutSelections([{ productId, quantity: 11 }]),
    /maximum of 10/i
  );
});

test("checkout resolution uses current product pricing and canonical options", async (t) => {
  const originalFind = Product.find;
  t.after(() => {
    Product.find = originalFind;
  });

  Product.find = async () => [
    {
      _id: { toString: () => productId },
      name: "test current price tee",
      status: "Active",
      price: 1499,
      pricePaise: 149900,
      sizes: ["M"],
      colors: ["Black"],
      images: ["https://example.com/current.jpg"],
      trackInventory: true,
      variants: [
        {
          sku: "HRU-CURRENT-M-BLK",
          size: "M",
          color: "Black",
          fit: "Regular",
          stock: 3,
          reserved: 0,
          active: true,
        },
      ],
    },
  ];

  const [item] = await resolveCheckoutItems([
    {
      productId,
      quantity: 1,
      size: "m",
      color: "black",
      fit: "Regular",
      price: 1,
    },
  ]);

  assert.equal(item.pricePaise, 149900);
  assert.equal(item.price, 1499);
  assert.equal(item.size, "M");
  assert.equal(item.color, "Black");
  assert.equal(item.sku, "HRU-CURRENT-M-BLK");
});

test("checkout resolution rejects non-active products from stale carts", async (t) => {
  const originalFind = Product.find;
  t.after(() => {
    Product.find = originalFind;
  });

  Product.find = async () => [
    {
      _id: { toString: () => productId },
      name: "test hidden tee",
      status: "hidden",
      price: 1499,
      pricePaise: 149900,
      sizes: ["M"],
      colors: ["Black"],
      images: ["https://example.com/current.jpg"],
      trackInventory: false,
      variants: [],
    },
  ];

  await assert.rejects(
    () => resolveCheckoutItems([{ productId, quantity: 1, size: "M", color: "Black" }]),
    /no longer available/i
  );
});

test("checkout resolution rejects removed options and insufficient current stock", async (t) => {
  const originalFind = Product.find;
  t.after(() => {
    Product.find = originalFind;
  });

  Product.find = async () => [
    {
      _id: { toString: () => productId },
      name: "Limited Tee",
      status: "Active",
      price: 999,
      pricePaise: 99900,
      sizes: ["S"],
      colors: ["Black"],
      images: ["https://example.com/limited.jpg"],
      trackInventory: true,
      variants: [
        {
          sku: "HRU-LIMITED-S-BLK",
          size: "S",
          color: "Black",
          fit: "Regular",
          stock: 1,
          reserved: 0,
          active: true,
        },
      ],
    },
  ];

  await assert.rejects(
    () => resolveCheckoutItems([{ productId, quantity: 1, size: "M", color: "Black" }]),
    /available size/i
  );
  await assert.rejects(
    () => resolveCheckoutItems([{ productId, quantity: 2, size: "S", color: "Black" }]),
    /only 1 unit/i
  );
});

test("inventory commit fails instead of silently confirming missing reservations", async (t) => {
  const originalUpdateOne = Product.updateOne;
  t.after(() => {
    Product.updateOne = originalUpdateOne;
  });

  Product.updateOne = async () => ({ modifiedCount: 0 });

  const order = {
    inventoryReservationStatus: "reserved",
    inventoryReservationExpiresAt: new Date(),
    products: [
      {
        productId,
        quantity: 1,
        sku: "HRU-TEST-M-BLK",
        inventoryTracked: true,
      },
    ],
  };

  await assert.rejects(
    () => commitOrderInventory(order),
    /could not be committed/i
  );
  assert.equal(order.inventoryReservationStatus, "reserved");
});

test("inventory release records released only after every variant is updated", async (t) => {
  const originalUpdateOne = Product.updateOne;
  t.after(() => {
    Product.updateOne = originalUpdateOne;
  });

  Product.updateOne = async () => ({ modifiedCount: 1 });

  const order = {
    inventoryReservationStatus: "reserved",
    inventoryReservationExpiresAt: new Date(),
    products: [
      {
        productId,
        quantity: 1,
        sku: "HRU-TEST-M-BLK",
        inventoryTracked: true,
      },
    ],
  };

  await releaseOrderInventory(order);

  assert.equal(order.inventoryReservationStatus, "released");
  assert.equal(order.inventoryReservationExpiresAt, null);
});

function buildReservedOrder(overrides = {}) {
  return {
    _id: overrides._id || "order-id",
    paymentStatus: overrides.paymentStatus || "pending",
    inventoryReservationStatus: "reserved",
    inventoryReservationExpiresAt: overrides.inventoryReservationExpiresAt || new Date(Date.now() - 1000),
    paymentReconciliationResultCode: "",
    products: [
      {
        productId,
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
}

function installCleanupStubs(t, { orders = [], preserved = 0, manualReview = 0, updateOne } = {}) {
  const originals = {
    find: Order.find,
    countDocuments: Order.countDocuments,
    updateOne: Product.updateOne,
  };

  t.after(() => {
    Order.find = originals.find;
    Order.countDocuments = originals.countDocuments;
    Product.updateOne = originals.updateOne;
  });

  Order.find = () => ({
    limit: async () => orders,
  });
  Order.countDocuments = async (query) =>
    query.inventoryReservationExpiresAt?.$gt ? preserved : manualReview;
  Product.updateOne = updateOne || (async () => ({ modifiedCount: 1 }));
}

test("expired inventory cleanup handles an empty scan", async (t) => {
  installCleanupStubs(t);

  const result = await cleanupExpiredInventoryReservations({ now: new Date(), limit: 5 });

  assert.equal(result.status, "completed");
  assert.equal(result.ordersInspected, 0);
  assert.equal(result.reservationsReleased, 0);
  assert.equal(result.failedReleases, 0);
});

test("expired inventory cleanup preserves active reservations", async (t) => {
  installCleanupStubs(t, { preserved: 2 });

  const result = await cleanupExpiredInventoryReservations({ now: new Date(), limit: 5 });

  assert.equal(result.reservationsPreserved, 2);
  assert.equal(result.reservationsReleased, 0);
});

test("expired inventory cleanup releases expired reservations and cancels initiated payment", async (t) => {
  const order = buildReservedOrder({ paymentStatus: "initiated" });
  installCleanupStubs(t, { orders: [order] });

  const result = await cleanupExpiredInventoryReservations({ now: new Date(), limit: 5 });

  assert.equal(result.ordersInspected, 1);
  assert.equal(result.reservationsReleased, 1);
  assert.equal(order.inventoryReservationStatus, "released");
  assert.equal(order.inventoryReservationExpiresAt, null);
  assert.equal(order.paymentStatus, "cancelled");
  assert.equal(order.saveCalls, 1);
});

test("expired inventory cleanup is idempotent across duplicate scan calls", async (t) => {
  const order = buildReservedOrder();
  let findCalls = 0;
  let updateCalls = 0;
  installCleanupStubs(t, {
    updateOne: async () => {
      updateCalls += 1;
      return { modifiedCount: 1 };
    },
  });
  Order.find = () => ({
    limit: async () => {
      findCalls += 1;
      return findCalls === 1 ? [order] : [];
    },
  });

  const first = await cleanupExpiredInventoryReservations({ now: new Date(), limit: 5 });
  const second = await cleanupExpiredInventoryReservations({ now: new Date(), limit: 5 });

  assert.equal(first.reservationsReleased, 1);
  assert.equal(second.reservationsReleased, 0);
  assert.equal(updateCalls, 1);
});

test("expired inventory cleanup reports concurrent scan lock contention", async (t) => {
  const order = buildReservedOrder();
  let releaseUpdate;
  const releaseGate = new Promise((resolve) => {
    releaseUpdate = resolve;
  });
  installCleanupStubs(t, {
    orders: [order],
    updateOne: async () => {
      await releaseGate;
      return { modifiedCount: 1 };
    },
  });

  const firstScan = cleanupExpiredInventoryReservations({ now: new Date(), limit: 5 });
  const secondScan = await cleanupExpiredInventoryReservations({ now: new Date(), limit: 5 });
  releaseUpdate();
  const firstResult = await firstScan;

  assert.equal(secondScan.status, "already-running");
  assert.equal(secondScan.lockContended, true);
  assert.equal(firstResult.reservationsReleased, 1);
});

test("expired inventory cleanup recovers expired reservations after restart", async (t) => {
  const order = buildReservedOrder({ _id: "after-restart" });
  installCleanupStubs(t, { orders: [order] });

  const result = await cleanupExpiredInventoryReservations({
    now: new Date(),
    limit: 5,
    source: "startup",
  });

  assert.equal(result.status, "completed");
  assert.equal(result.reservationsReleased, 1);
});

test("expired inventory cleanup routes partial release failures to manual review", async (t) => {
  const order = buildReservedOrder();
  installCleanupStubs(t, {
    orders: [order],
    updateOne: async () => ({ modifiedCount: 0 }),
  });

  const result = await cleanupExpiredInventoryReservations({ now: new Date(), limit: 5 });

  assert.equal(result.reservationsReleased, 0);
  assert.equal(result.failedReleases, 1);
  assert.equal(order.inventoryReservationStatus, "reserved");
  assert.equal(order.paymentReconciliationResultCode, "MANUAL_REVIEW_REQUIRED");
  assert.equal(order.saveCalls, 1);
});

test("expired inventory cleanup reports manual-review cases without releasing them", async (t) => {
  installCleanupStubs(t, { manualReview: 3 });

  const result = await cleanupExpiredInventoryReservations({ now: new Date(), limit: 5 });

  assert.equal(result.manualReviewCases, 3);
  assert.equal(result.reservationsReleased, 0);
});
