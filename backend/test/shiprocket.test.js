const test = require("node:test");
const assert = require("node:assert/strict");

const env = require("../src/config/env");
const Order = require("../src/models/Order");
const auditLog = require("../src/utils/auditLog");
const mailer = require("../src/utils/mailer");
const shiprocket = require("../src/services/shiprocket");
const shipmentSync = require("../src/services/shipmentSync");

auditLog.recordAuditLog = async () => {};
mailer.sendEmail = async () => ({ delivered: true });

const { updateOrderStatus, shiprocketWebhook } = require("../src/controllers/orderController");

const sampleOrder = (extra = {}) => ({
  _id: "507f1f77bcf86cd799439011",
  orderNumber: 1024,
  customerName: "Asha Rao",
  customerEmail: "asha@example.com",
  customerPhone: "9876543210",
  paymentStatus: "paid",
  orderStatus: "Confirmed",
  totalPaise: 59900,
  shippingPaise: 0,
  discountPaise: 0,
  createdAt: new Date("2026-09-29T10:00:00Z"),
  shippingAddress: "12 Lake Road, Baner, Pune",
  shippingAddressDetails: { fullName: "Asha Rao", mobile: "+91 98765 43210", house: "12 Lake Road", area: "Baner", city: "Pune", state: "Maharashtra", pincode: "411045" },
  products: [{ productId: "p1", name: "Desert Oat Tee", size: "M", color: "Cream", quantity: 1, pricePaise: 59900, sku: "DOT-M" }],
  ...extra,
});

function withEnv(t, values) {
  const previous = {};
  for (const [key, value] of Object.entries(values)) {
    previous[key] = env[key];
    env[key] = value;
  }
  t.after(() => Object.assign(env, previous));
}

function stub(t, target, key, value) {
  const original = target[key];
  target[key] = value;
  t.after(() => {
    target[key] = original;
  });
}

const run = async (handler, req) => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  let error;
  await handler(req, res, (nextError) => {
    error = nextError;
  });
  return { res, error };
};

test("payload is a prepaid order with the customer's address and items", () => {
  const payload = shiprocket.buildShiprocketOrderPayload(sampleOrder());
  assert.equal(payload.order_id, "1024");
  assert.equal(payload.payment_method, "Prepaid");
  assert.equal(payload.billing_customer_name, "Asha");
  assert.equal(payload.billing_last_name, "Rao");
  assert.equal(payload.billing_phone, "9876543210");
  assert.equal(payload.billing_pincode, "411045");
  assert.equal(payload.sub_total, 599);
  assert.deepEqual(payload.order_items[0], { name: "Desert Oat Tee · M · Cream", sku: "DOT-M", units: 1, selling_price: 599, discount: 0, tax: 0, hsn: "" });
});

test("create logs in, creates the order and reports Shiprocket's rejection", async (t) => {
  withEnv(t, { SHIPROCKET_ENABLED: true, SHIPROCKET_EMAIL: "api@hrushe.in", SHIPROCKET_PASSWORD: "secret" });
  shiprocket.resetShiprocketTokenForTests();
  const calls = [];
  const ok = async (url, init) => {
    calls.push(url);
    if (url.endsWith("/auth/login")) return { ok: true, status: 200, json: async () => ({ token: "t" }) };
    return { ok: true, status: 200, json: async () => ({ order_id: 555, shipment_id: 777, status: "NEW" }) };
  };
  const created = await shiprocket.createShiprocketOrder(sampleOrder(), { fetchImpl: ok });
  assert.deepEqual(created, { orderId: "555", shipmentId: "777", awbCode: "", status: "NEW" });
  assert.equal(calls.length, 2);

  const rejected = async (url) =>
    url.endsWith("/auth/login")
      ? { ok: true, status: 200, json: async () => ({ token: "t" }) }
      : { ok: false, status: 422, json: async () => ({ message: "Invalid pincode" }) };
  await assert.rejects(shiprocket.createShiprocketOrder(sampleOrder(), { fetchImpl: rejected }), /Invalid pincode/);
});

test("tracking statuses map to our order statuses", () => {
  assert.equal(shiprocket.mapShiprocketStatus("PICKED UP"), "Shipped");
  assert.equal(shiprocket.mapShiprocketStatus("Out For Delivery"), "Out for delivery");
  assert.equal(shiprocket.mapShiprocketStatus("DELIVERED"), "Delivered");
  assert.equal(shiprocket.mapShiprocketStatus("NEW"), "");
});

test("an order is sent once; failures are stored for retry", async (t) => {
  withEnv(t, { SHIPROCKET_ENABLED: true, SHIPROCKET_EMAIL: "api@hrushe.in", SHIPROCKET_PASSWORD: "secret" });
  let creates = 0;
  let stored;
  stub(t, Order, "findById", async () => sampleOrder());
  stub(t, Order, "findByIdAndUpdate", async (id, update) => {
    stored = update.$set;
    return sampleOrder({ shiprocket: update.$set });
  });

  // Claimed → created
  stub(t, Order, "findOneAndUpdate", async () => sampleOrder());
  stub(t, shiprocket, "createShiprocketOrder", async () => {
    creates += 1;
    return { orderId: "555", shipmentId: "777", awbCode: "", status: "NEW" };
  });
  const sent = await shipmentSync.sendOrderToShiprocket("507f1f77bcf86cd799439011");
  assert.equal(sent.sent, true);
  assert.equal(stored["shiprocket.status"], "created");

  // Already sent → the claim finds nothing, Shiprocket is not called again
  Order.findOneAndUpdate = async () => null;
  const again = await shipmentSync.sendOrderToShiprocket("507f1f77bcf86cd799439011");
  assert.equal(again.skipped, "not-eligible-or-already-sent");
  assert.equal(creates, 1);

  // Failure → stored as failed with the reason
  Order.findOneAndUpdate = async () => sampleOrder();
  shiprocket.createShiprocketOrder = async () => {
    throw new Error("Shiprocket rejected the order: Invalid pincode");
  };
  const failed = await shipmentSync.sendOrderToShiprocket("507f1f77bcf86cd799439011");
  assert.equal(failed.failed, true);
  assert.equal(stored["shiprocket.status"], "failed");
  assert.match(stored["shiprocket.error"], /Invalid pincode/);
});

test("nothing is sent while Shiprocket is switched off, even with credentials", async (t) => {
  withEnv(t, { SHIPROCKET_ENABLED: false, SHIPROCKET_EMAIL: "api@hrushe.in", SHIPROCKET_PASSWORD: "secret" });
  stub(t, Order, "findById", async () => sampleOrder());
  stub(t, Order, "findOneAndUpdate", async () => {
    throw new Error("should not claim");
  });
  const result = await shipmentSync.sendOrderToShiprocket("507f1f77bcf86cd799439011");
  assert.equal(result.skipped, "not-configured");
});

test("only Pending → Confirmed hands the order to Shiprocket", async (t) => {
  const sends = [];
  stub(t, shipmentSync, "sendOrderToShiprocket", async (id) => {
    sends.push(String(id));
    return { order: sampleOrder({ shiprocket: { status: "created" } }) };
  });

  const confirm = async (from, to) => {
    Order.findById = async () => sampleOrder({ orderStatus: from });
    Order.findOneAndUpdate = async () => sampleOrder({ orderStatus: to });
    return run(updateOrderStatus, { params: { id: "507f1f77bcf86cd799439011" }, body: { orderStatus: to }, user: { _id: "admin" } });
  };
  stub(t, Order, "findById", Order.findById);
  stub(t, Order, "findOneAndUpdate", Order.findOneAndUpdate);

  const first = await confirm("Pending", "Confirmed");
  assert.ifError(first.error);
  assert.equal(sends.length, 1);
  assert.equal(first.res.body.shiprocket.status, "created");

  const second = await confirm("Confirmed", "Packed");
  assert.ifError(second.error);
  assert.equal(sends.length, 1, "later status changes do not resend");
});

test("webhook needs the token and only moves orders forward", async (t) => {
  withEnv(t, { SHIPROCKET_WEBHOOK_TOKEN: "hook-secret" });
  const denied = await run(shiprocketWebhook, { headers: { "x-api-key": "wrong" }, body: {} });
  assert.equal(denied.error?.statusCode, 401);

  let applied;
  stub(t, Order, "findOne", async () => sampleOrder({ orderStatus: "Confirmed" }));
  stub(t, Order, "findOneAndUpdate", async (filter, update) => {
    applied = update.$set;
    return sampleOrder({ orderStatus: update.$set.orderStatus || "Confirmed" });
  });
  const shipped = await run(shiprocketWebhook, {
    headers: { "x-api-key": "hook-secret" },
    body: { order_id: "1024", awb: "AWB123", courier_name: "Delhivery", current_status: "PICKED UP" },
  });
  assert.ifError(shipped.error);
  assert.equal(applied.orderStatus, "Shipped");
  assert.equal(applied.trackingId, "AWB123");
  assert.equal(applied.courierName, "Delhivery");
  assert.equal(applied.trackingUrl, "https://shiprocket.co/tracking/AWB123");

  Order.findOne = async () => sampleOrder({ orderStatus: "Delivered" });
  await run(shiprocketWebhook, { headers: { "x-api-key": "hook-secret" }, body: { order_id: "1024", current_status: "IN TRANSIT" } });
  assert.equal(applied.orderStatus, undefined, "a delivered order is never moved back");
});
