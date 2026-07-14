const test = require("node:test");
const assert = require("node:assert/strict");

const Order = require("../src/models/Order");
const User = require("../src/models/User");
const {
  createStaffUser,
  getOperationsSummary,
} = require("../src/controllers/adminController");

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

test("operations summary returns payment, inventory, order, and system counts", async (t) => {
  const originalCountDocuments = Order.countDocuments;
  const counts = [1, 2, 3, 4, 5, 6, 7, 3, 8, 9, 10];
  const seenQueries = [];

  t.after(() => {
    Order.countDocuments = originalCountDocuments;
  });

  Order.countDocuments = async (query) => {
    seenQueries.push(query);
    return counts.shift();
  };

  const { res, nextError } = await callController(getOperationsSummary, {
    query: {},
    headers: {},
    socket: {},
  });

  assert.ifError(nextError);
  assert.equal(res.body.payments.manualReview, 1);
  assert.equal(res.body.payments.providerUnavailable, 2);
  assert.equal(res.body.payments.capturedUnconfirmed, 3);
  assert.equal(res.body.payments.amountMismatch, 4);
  assert.equal(res.body.payments.currencyMismatch, 5);
  assert.equal(res.body.inventory.activeReservations, 6);
  assert.equal(res.body.inventory.expiredReservations, 7);
  assert.equal(res.body.inventory.consistencyWarnings, 27);
  assert.equal(res.body.orders.failedWithReservation, 8);
  assert.equal(res.body.orders.confirmedButUnpaid, 9);
  assert.equal(res.body.orders.initiatedOlderThan20Minutes, 10);
  assert.equal(typeof res.body.system.mongoReady, "boolean");
  assert.equal(seenQueries.length, 11);
});

test("staff creation rejects duplicate normalized phone numbers before index errors", async (t) => {
  const originalFindOne = User.findOne;
  t.after(() => {
    User.findOne = originalFindOne;
  });

  User.findOne = async (query) => {
    if (query.phone === "9876543210") {
      return { _id: "507f1f77bcf86cd799439011" };
    }
    return null;
  };

  const { nextError } = await callController(createStaffUser, {
    body: {
      name: "Ops Admin",
      email: "ops-admin@example.com",
      phone: "+91 98765 43210",
      password: "StrongPass1!",
      adminRole: "operations-manager",
    },
    headers: {},
    socket: {},
  });

  assert.equal(nextError?.statusCode, 409);
  assert.match(nextError?.message || "", /phone number is already in use/i);
});
