const test = require("node:test");
const assert = require("node:assert/strict");

const {
  addPaise,
  calculateOrderTotals,
  fixedDiscountPaise,
  getPaiseValue,
  multiplyPaise,
  normalizePaise,
  paiseToRupees,
  percentageDiscountPaise,
  rupeesToPaise,
} = require("../src/utils/money");

test("rupee amounts are rounded to integer paise", () => {
  assert.equal(rupeesToPaise(999), 99900);
  assert.equal(rupeesToPaise("10.235"), 1024);
  assert.equal(rupeesToPaise(undefined), 0);
});

test("paise values convert back to rupees without floating calculations in storage", () => {
  assert.equal(paiseToRupees(99900), 999);
  assert.equal(paiseToRupees(1024), 10.24);
});

test("paise normalization rejects decimal and negative values", () => {
  assert.throws(() => normalizePaise(10.5), /integer paise/i);
  assert.throws(() => normalizePaise(-1), /cannot be negative/i);
});

test("paise normalization can allow negative values explicitly", () => {
  assert.equal(normalizePaise(-50, { allowNegative: true }), -50);
});

test("dual-read money prefers paise field over legacy rupee field", () => {
  assert.equal(getPaiseValue({ pricePaise: 12345, price: 999 }, "pricePaise", "price"), 12345);
});

test("dual-read money falls back to legacy rupee field", () => {
  assert.equal(getPaiseValue({ price: 999 }, "pricePaise", "price"), 99900);
});

test("paise addition is integer-only", () => {
  assert.equal(addPaise([100, 200, 300]), 600);
  assert.throws(() => addPaise([100, 1.2]), /integer paise/i);
});

test("paise multiplication requires whole non-negative quantity", () => {
  assert.equal(multiplyPaise(99900, 2), 199800);
  assert.throws(() => multiplyPaise(99900, 1.5), /quantity/i);
  assert.throws(() => multiplyPaise(99900, -1), /quantity/i);
});

test("fixed discounts never exceed the base amount", () => {
  assert.equal(fixedDiscountPaise(1000, 400), 400);
  assert.equal(fixedDiscountPaise(1000, 1500), 1000);
});

test("percentage discounts round to nearest paise", () => {
  assert.equal(percentageDiscountPaise(999, 10), 100);
});

test("order totals calculate subtotal, discounts, shipping, tax, and final total in paise", () => {
  const totals = calculateOrderTotals({
    items: [
      { pricePaise: 99900, quantity: 2 },
      { price: 499, quantity: 1 },
    ],
    discountPaise: 10000,
    shippingPaise: 5000,
    taxPaise: 2500,
  });

  assert.deepEqual(totals, {
    subtotalPaise: 249700,
    discountPaise: 10000,
    shippingPaise: 5000,
    taxPaise: 2500,
    totalPaise: 247200,
  });
});

test("order totals clamp excessive discounts to subtotal", () => {
  const totals = calculateOrderTotals({
    items: [{ pricePaise: 5000, quantity: 1 }],
    discountPaise: 6000,
  });

  assert.equal(totals.discountPaise, 5000);
  assert.equal(totals.totalPaise, 0);
});
