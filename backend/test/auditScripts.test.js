const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildReport,
  summarizeReport,
} = require("../scripts/audit-user-phones");
const {
  assertPhoneDataIsIndexable,
  INDEX_NAME,
} = require("../scripts/create-user-phone-index");
const User = require("../src/models/User");
const {
  analyzeOrder: analyzeMoneyOrder,
  analyzeProduct: analyzeMoneyProduct,
} = require("../scripts/audit-money-paise");
const {
  analyzeOrders: analyzeInventoryOrders,
  analyzeProducts: analyzeInventoryProducts,
} = require("../scripts/audit-inventory-consistency");

const originalEnv = { ...process.env };
const razorpayVerificationScriptPath = require.resolve("../scripts/verify-razorpay-production-testmode");

const id = (value) => ({ toString: () => value });

function loadRazorpayVerificationScript(overrides = {}) {
  delete require.cache[razorpayVerificationScriptPath];
  process.env = { ...originalEnv, ...overrides };
  return require(razorpayVerificationScriptPath);
}

test.afterEach(() => {
  delete require.cache[razorpayVerificationScriptPath];
  process.env = { ...originalEnv };
});

test("phone audit reports empty, invalid, duplicate, and normalizable users", () => {
  const report = buildReport([
    { _id: id("u1"), phone: "+91 98765 43210" },
    { _id: id("u2"), phone: "09876543210" },
    { _id: id("u3"), phone: "" },
    { _id: id("u4"), phone: "12345" },
  ]);

  assert.equal(report.totalUsersScanned, 4);
  assert.equal(report.missingNumbers, 1);
  assert.equal(report.invalidNumbers, 1);
  assert.equal(report.duplicateGroups.length, 1);
  assert.ok(report.manualReviewUserIds.includes("u4"));
});

test("phone audit summary exposes production checklist field names", () => {
  const report = buildReport([
    { _id: id("u1"), phone: "+91 98765 43210" },
    { _id: id("u2"), phone: "" },
  ]);
  const safeUpdates = report.updates;
  const summary = summarizeReport(report, safeUpdates, "report");

  assert.equal(summary.emptyPhoneValues, 1);
  assert.equal(summary.validNormalizedNumbers, 1);
  assert.equal(summary.usersThatWouldBeModified, 1);
  assert.equal(summary.usersRequiringManualReview, 0);
});

test("phone index dry-run aborts on normalized duplicates and non-canonical values", async (t) => {
  const originalFind = User.find;
  t.after(() => {
    User.find = originalFind;
  });

  User.find = () => ({
    select: () => ({
      lean: async () => [
        { _id: id("u1"), phone: "+91 98765 43210" },
        { _id: id("u2"), phone: "9876543210" },
      ],
    }),
  });

  await assert.rejects(
    () => assertPhoneDataIsIndexable(),
    (error) => {
      assert.match(error.message, /not ready for a unique index/i);
      assert.equal(error.report.duplicateGroups.length, 1);
      assert.equal(error.report.duplicateGroups[0].phone, "******3210");
      assert.equal(error.report.normalizableUsers.length, 1);
      assert.equal(error.report.normalizableUsers[0].from, "******3210");
      assert.equal(error.report.normalizableUsers[0].to, "******3210");
      return true;
    }
  );
  assert.equal(INDEX_NAME, "users_phone_unique_non_empty");
});

test("phone index dry-run accepts canonical unique non-empty phones", async (t) => {
  const originalFind = User.find;
  t.after(() => {
    User.find = originalFind;
  });

  User.find = () => ({
    select: () => ({
      lean: async () => [
        { _id: id("u1"), phone: "9876543210" },
        { _id: id("u2"), phone: "9876543211" },
      ],
    }),
  });

  await assert.doesNotReject(() => assertPhoneDataIsIndexable());
});

test("money product audit marks missing paise fields as safe backfills", () => {
  const finding = analyzeMoneyProduct({
    _id: id("p1"),
    price: 999,
    compareAtPrice: 1299,
  });

  assert.deepEqual(finding.issues, [
    "missing-price-paise",
    "missing-compare-at-price-paise",
  ]);
  assert.equal(finding.safelyBackfillable, true);
  assert.equal(finding.patch.pricePaise, 99900);
});

test("money product audit flags mismatched paise fields for manual review", () => {
  const finding = analyzeMoneyProduct({
    _id: id("p1"),
    price: 999,
    pricePaise: 99899,
  });

  assert.deepEqual(finding.issues, ["price-paise-mismatch"]);
  assert.equal(finding.safelyBackfillable, false);
});

test("money order audit detects missing total, subtotal, and item paise", () => {
  const finding = analyzeMoneyOrder({
    _id: id("o1"),
    orderNumber: 10,
    totalAmount: 1498,
    products: [
      { price: 999, quantity: 1 },
      { price: 499, quantity: 1 },
    ],
  });

  assert.ok(finding.issues.includes("missing-total-paise"));
  assert.ok(finding.issues.includes("missing-subtotal-paise"));
  assert.equal(finding.itemIssues.length, 2);
  assert.equal(finding.patch.totalPaise, 149800);
  assert.equal(finding.patch.subtotalPaise, 149800);
});

test("money order audit flags mismatched totals for manual review", () => {
  const finding = analyzeMoneyOrder({
    _id: id("o1"),
    totalAmount: 1498,
    totalPaise: 100,
    subtotalPaise: 149800,
    products: [{ price: 1498, pricePaise: 149800, quantity: 1 }],
  });

  assert.ok(finding.issues.includes("total-paise-mismatch"));
  assert.equal(finding.safelyBackfillable, false);
});

test("inventory product audit detects duplicate SKU and negative stock", () => {
  const findings = analyzeInventoryProducts([
    {
      _id: id("p1"),
      name: "Quiet Tee",
      status: "Active",
      variants: [
        { sku: "HRU-1", stock: -1, reserved: 0 },
        { sku: "HRU-1", stock: 1, reserved: -1 },
      ],
    },
  ]);

  assert.equal(findings.duplicateSkuProducts.length, 1);
  assert.equal(findings.negativeStockVariants.length, 1);
  assert.equal(findings.negativeReservedVariants.length, 1);
});

test("inventory product audit detects archived products with reservations", () => {
  const findings = analyzeInventoryProducts([
    {
      _id: id("p1"),
      name: "Archived Tee",
      status: "archived",
      variants: [{ sku: "HRU-1", stock: 0, reserved: 2 }],
    },
  ]);

  assert.equal(findings.archivedProductsWithReservedStock.length, 1);
});

test("inventory order audit detects paid orders with uncommitted reservation", () => {
  const findings = analyzeInventoryOrders([
    {
      _id: id("o1"),
      paymentStatus: "paid",
      orderStatus: "Confirmed",
      inventoryReservationStatus: "reserved",
      products: [{ inventoryTracked: true }],
    },
  ]);

  assert.equal(findings.paidOrdersWithReservedInventory.length, 1);
});

test("inventory order audit detects expired and failed reserved orders", () => {
  const findings = analyzeInventoryOrders([
    {
      _id: id("o1"),
      paymentStatus: "failed",
      orderStatus: "Cancelled",
      inventoryReservationStatus: "reserved",
      inventoryReservationExpiresAt: new Date(Date.now() - 1000),
      products: [{ inventoryTracked: true }],
    },
  ]);

  assert.equal(findings.failedOrCancelledOrdersWithReservedInventory.length, 1);
  assert.equal(findings.expiredReservations.length, 1);
});

test("Razorpay production test verifier accepts HRUSHE webhook secret alias", () => {
  const { assertSafeConfig } = loadRazorpayVerificationScript({
    RAZORPAY_PRODUCTION_TEST_VERIFY: "true",
    ALLOW_PRODUCTION_TEST_ORDER_MUTATION: "true",
    BACKEND_PUBLIC_URL: "https://api-staging.hrushe.example",
    RAZORPAY_KEY_ID: "rzp_test_1234567890",
    RAZORPAY_WEBHOOK_SECRET: "",
    HRUSHE_RZP_WEBHOOK_SECRET: "webhook-secret-with-more-than-32-characters",
    RAZORPAY_TEST_CHECKOUT_PAYLOAD_JSON: JSON.stringify({ items: [] }),
  });

  assert.doesNotThrow(() => assertSafeConfig());
});
