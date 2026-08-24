const test = require("node:test");
const assert = require("node:assert/strict");

const { CHECKOUT_ATTEMPT_INDEX } = require("../src/utils/checkoutAttemptIndexSpec");
const {
  assertCheckoutAttemptIndexReady,
  createCheckoutAttemptIndex,
  refreshCheckoutAttemptIndexReadiness,
  resetCheckoutAttemptIndexReadinessForTests,
  runCheckoutAttemptIndexCommand,
  verifyCheckoutAttemptIndex,
} = require("../src/services/checkoutAttemptIndex");

function exactIndex(patch = {}) {
  return {
    name: CHECKOUT_ATTEMPT_INDEX.name,
    key: { ...CHECKOUT_ATTEMPT_INDEX.key },
    unique: true,
    partialFilterExpression: { ...CHECKOUT_ATTEMPT_INDEX.partialFilterExpression },
    ...patch,
  };
}

function fakeCollection(initialIndexes = []) {
  const indexes = [...initialIndexes];
  const creates = [];

  return {
    creates,
    async indexes() {
      return indexes;
    },
    async createIndex(key, options) {
      creates.push({ key, options });
      indexes.push({
        name: options.name,
        key,
        unique: options.unique,
        partialFilterExpression: options.partialFilterExpression,
      });
      return options.name;
    },
  };
}

test("checkout attempt index verification passes only with the exact canonical index", async () => {
  const result = await verifyCheckoutAttemptIndex({
    collection: fakeCollection([exactIndex()]),
  });

  assert.equal(result.ok, true);
  assert.equal(result.reason, "verified");
});

test("checkout attempt index verification fails when the index is missing", async () => {
  const result = await verifyCheckoutAttemptIndex({
    collection: fakeCollection([]),
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, "missing");
});

test("checkout attempt index verification does not accept a similar differently named index", async () => {
  const result = await verifyCheckoutAttemptIndex({
    collection: fakeCollection([
      exactIndex({ name: "similar_checkout_attempt_index" }),
    ]),
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, "missing");
});

test("checkout attempt index verification rejects same-name indexes with wrong keys", async () => {
  const result = await verifyCheckoutAttemptIndex({
    collection: fakeCollection([exactIndex({ key: { active: 1, keyHash: 1 } })]),
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, "wrong-key");
});

test("checkout attempt index verification rejects indexes without unique true", async () => {
  const result = await verifyCheckoutAttemptIndex({
    collection: fakeCollection([exactIndex({ unique: false })]),
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, "not-unique");
});

test("checkout attempt index verification rejects wrong partial filters", async () => {
  const result = await verifyCheckoutAttemptIndex({
    collection: fakeCollection([
      exactIndex({ partialFilterExpression: { active: { $eq: true } } }),
    ]),
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, "wrong-partial-filter");
});

test("checkout attempt index verification database errors fail closed", async (t) => {
  t.after(() => {
    resetCheckoutAttemptIndexReadinessForTests();
  });

  const result = await refreshCheckoutAttemptIndexReadiness({
    collection: {
      indexes: async () => {
        throw new Error("database unavailable");
      },
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, "verification-error");
  assert.throws(
    () => assertCheckoutAttemptIndexReady(),
    (error) => {
      assert.equal(error.statusCode, 503);
      assert.match(error.message, /temporarily unavailable/i);
      assert.equal(/index|mongo|database/i.test(error.message), false);
      return true;
    }
  );
});

test("checkout attempt index creation is idempotent when the exact index already exists", async () => {
  const collection = fakeCollection([exactIndex()]);
  const result = await createCheckoutAttemptIndex({ collection });

  assert.equal(result.ok, true);
  assert.equal(result.created, false);
  assert.equal(collection.creates.length, 0);
});

test("checkout attempt index check-only command never creates indexes", async () => {
  const collection = fakeCollection([]);
  const result = await runCheckoutAttemptIndexCommand({
    mode: "check",
    collection,
    production: false,
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, "missing");
  assert.equal(collection.creates.length, 0);
});

test("checkout attempt index creation command requires explicit create permission", async () => {
  const collection = fakeCollection([]);
  const result = await runCheckoutAttemptIndexCommand({
    mode: "create",
    collection,
    production: false,
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, "blocked");
  assert.equal(result.reason, "explicit-create-required");
  assert.equal(collection.creates.length, 0);
});

test("checkout attempt index creation command creates and verifies the canonical index", async () => {
  const collection = fakeCollection([]);
  const result = await runCheckoutAttemptIndexCommand({
    mode: "create",
    allowCreate: true,
    collection,
    production: false,
  });

  assert.equal(result.ok, true);
  assert.equal(result.created, true);
  assert.equal(collection.creates.length, 1);
  assert.deepEqual(collection.creates[0].key, CHECKOUT_ATTEMPT_INDEX.key);
  assert.deepEqual(collection.creates[0].options.partialFilterExpression, CHECKOUT_ATTEMPT_INDEX.partialFilterExpression);
});

test("checkout attempt index command blocks production without explicit confirmation", async () => {
  const collection = fakeCollection([exactIndex()]);
  const result = await runCheckoutAttemptIndexCommand({
    mode: "check",
    collection,
    production: true,
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, "blocked");
  assert.equal(result.reason, "production-confirmation-required");
  assert.equal(collection.creates.length, 0);
});
