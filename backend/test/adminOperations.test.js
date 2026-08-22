const test = require("node:test");
const assert = require("node:assert/strict");

const Order = require("../src/models/Order");
const User = require("../src/models/User");
const Product = require("../src/models/Product");
const SiteContent = require("../src/models/SiteContent");
const SupportRequest = require("../src/models/SupportRequest");
const {
  createStaffUser,
  getDashboardOverview,
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

test("dashboard overview returns server-side commerce and storefront action signals", async (t) => {
  const originals = {
    orderAggregate: Order.aggregate,
    orderCountDocuments: Order.countDocuments,
    orderFind: Order.find,
    productAggregate: Product.aggregate,
    siteContentFindOne: SiteContent.findOne,
    supportCountDocuments: SupportRequest.countDocuments,
  };
  const counts = [4, 9, 2, 3, 1, 5, 6, 7, 8, 10, 11];

  t.after(() => {
    Order.aggregate = originals.orderAggregate;
    Order.countDocuments = originals.orderCountDocuments;
    Order.find = originals.orderFind;
    Product.aggregate = originals.productAggregate;
    SiteContent.findOne = originals.siteContentFindOne;
    SupportRequest.countDocuments = originals.supportCountDocuments;
  });

  Order.aggregate = async (pipeline) => {
    if (pipeline.some((stage) => stage.$unwind === "$products")) {
      return [
        {
          productId: "product-1",
          name: "Quiet Shirt",
          quantity: 3,
          revenuePaise: 360000,
        },
      ];
    }

    return [{ orders: 2, revenuePaise: 240000 }];
  };
  Order.countDocuments = async () => counts.shift();
  Order.find = () => ({
    select: () => ({
      sort: () => ({
        limit: () => ({
          lean: async () => [
            {
              _id: { toString: () => "order-1" },
              orderNumber: 24,
              customerName: "Asha",
              customerEmail: "asha@example.com",
              paymentStatus: "paid",
              orderStatus: "Confirmed",
              totalAmount: 1200,
              totalPaise: 120000,
              createdAt: new Date("2026-08-03T08:00:00.000Z"),
            },
          ],
        }),
      }),
    }),
  });
  Product.aggregate = async () => [
    {
      trackedVariants: 4,
      physicalStock: 20,
      reservedUnits: 5,
      reservedVariants: 2,
      lowStockVariants: 1,
      outOfStockVariants: 1,
    },
  ];
  SiteContent.findOne = () => ({
    lean: async () => ({
      adminWorkspaceVersion: 4,
      adminWorkspace: {
        homeManagement: {
          lastPublishedAt: "2026-08-01T10:00:00.000Z",
          banners: [
            {
              enabled: true,
              scheduleStart: "2099-01-01T00:00:00.000Z",
              desktopImage: "/media/drop.jpg",
              mobileImage: "",
              ctaLink: "/shop",
            },
          ],
          sections: [
            {
              isVisible: true,
              publishStart: "2099-01-02T00:00:00.000Z",
              image: "/media/hero.jpg",
              mobileImage: "",
              ctaLink: "http://not-allowed.example",
              cards: [
                {
                  isVisible: true,
                  image: "/media/card.jpg",
                  mobileImage: "",
                  ctaLink: "/collection/men",
                },
              ],
            },
          ],
        },
      },
    }),
  });
  SupportRequest.countDocuments = async () => 12;

  const { res, nextError } = await callController(getDashboardOverview, {
    query: { range: "last7" },
    headers: {},
    socket: {},
  });

  assert.ifError(nextError);
  assert.equal(res.body.dateRange.preset, "last7");
  assert.equal(res.body.revenue.todayPaise, 240000);
  assert.equal(res.body.revenue.averageOrderValuePaise, 120000);
  assert.equal(res.body.orders.today, 4);
  assert.equal(res.body.orders.awaitingFulfillment, 3);
  assert.equal(res.body.payments.manualReview, 6);
  assert.equal(res.body.inventory.lowStockVariants, 1);
  assert.equal(res.body.inventory.activeReservations, 10);
  assert.equal(res.body.storefront.scheduledCampaigns, 2);
  assert.equal(res.body.storefront.missingMobileMedia, 3);
  assert.equal(res.body.storefront.brokenLinks, 1);
  assert.equal(res.body.support.attention, 12);
  assert.equal(res.body.actionCards.find((card) => card.id === "low-stock-products").count, 1);
  assert.equal(res.body.recentOrders[0].orderNumber, 24);
  assert.equal(res.body.topProducts[0].name, "Quiet Shirt");
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
