const test = require("node:test");
const assert = require("node:assert/strict");
const {
  commitOrderInventory,
  normalizeCheckoutSelections,
  releaseOrderInventory,
} = require("../src/services/checkoutInventory");
const Product = require("../src/models/Product");

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
