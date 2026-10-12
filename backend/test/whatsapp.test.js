const test = require("node:test");
const assert = require("node:assert/strict");

const env = require("../src/config/env");
const Order = require("../src/models/Order");
const User = require("../src/models/User");
const whatsapp = require("../src/services/whatsapp");

function stub(t, target, key, value) {
  const original = target[key];
  target[key] = value;
  t.after(() => {
    target[key] = original;
  });
}

function enable(t) {
  stub(t, env, "WHATSAPP_ENABLED", true);
  stub(t, env, "WHATSAPP_TOKEN", "test-token");
  stub(t, env, "WHATSAPP_PHONE_NUMBER_ID", "123456");
}

const order = {
  _id: "64b000000000000000000001",
  orderNumber: 1024,
  orderStatus: "Shipped",
  customerName: "Asha Rao",
  customerPhone: "+91 98765 43210",
  courierName: "Delhivery",
  trackingUrl: "https://track.example/AWB1",
  totalPaise: 53910,
  userId: null,
};

test("builds the approved template with the order's details", () => {
  const message = whatsapp.buildTemplateMessage(order);
  assert.equal(message.to, "919876543210");
  assert.equal(message.template.name, "hrushe_order_shipped");
  assert.deepEqual(
    message.template.components[0].parameters.map((p) => p.text),
    ["Asha", "#1024", "Delhivery", "https://track.example/AWB1"]
  );
  assert.equal(
    whatsapp.buildTemplateMessage({ ...order, orderStatus: "Confirmed" }).template.components[0].parameters[2].text,
    "₹539.1"
  );
});

test("statuses without an update, and bad numbers, send nothing", () => {
  assert.equal(whatsapp.buildTemplateMessage({ ...order, orderStatus: "Packed" }), null);
  assert.equal(whatsapp.buildTemplateMessage({ ...order, customerPhone: "12345" }), null);
});

test("stays silent unless switched on", async (t) => {
  stub(t, env, "WHATSAPP_ENABLED", false);
  let called = false;
  const result = await whatsapp.sendOrderUpdate(order, { fetchImpl: async () => { called = true; } });
  assert.equal(result.reason, "disabled");
  assert.equal(called, false);
});

test("sends each status once", async (t) => {
  enable(t);
  const sent = new Set();
  stub(t, Order, "findOneAndUpdate", async (filter, update) => {
    const status = update.$addToSet.whatsappNotified;
    if (sent.has(status)) return null;
    sent.add(status);
    return { ...order };
  });
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body), auth: init.headers.Authorization });
    return { ok: true, json: async () => ({ messages: [{ id: "wamid.1" }] }) };
  };

  assert.deepEqual(await whatsapp.sendOrderUpdate(order, { fetchImpl }), { sent: true, messageId: "wamid.1" });
  assert.equal((await whatsapp.sendOrderUpdate(order, { fetchImpl })).reason, "already-sent");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://graph.facebook.com/v21.0/123456/messages");
  assert.equal(calls[0].auth, "Bearer test-token");
});

test("respects a customer who turned WhatsApp updates off", async (t) => {
  enable(t);
  stub(t, User, "findById", () => ({ select: () => ({ lean: async () => ({ communicationPreferences: { whatsappOrderUpdates: false } }) }) }));
  const result = await whatsapp.sendOrderUpdate({ ...order, userId: "u1" }, { fetchImpl: async () => assert.fail("must not send") });
  assert.equal(result.reason, "opted-out");
});

test("an API error releases the claim and never throws", async (t) => {
  enable(t);
  stub(t, Order, "findOneAndUpdate", async () => ({ ...order }));
  let released = false;
  stub(t, Order, "updateOne", async (_, update) => {
    released = update.$pull.whatsappNotified === "Shipped";
  });
  const result = await whatsapp.sendOrderUpdate(order, {
    fetchImpl: async () => ({ ok: false, status: 400, json: async () => ({ error: { code: 132001, message: "Template not found" } }) }),
  });
  assert.equal(result.reason, "api-error");
  assert.equal(released, true);
});
