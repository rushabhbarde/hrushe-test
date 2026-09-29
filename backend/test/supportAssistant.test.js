const test = require("node:test");
const assert = require("node:assert/strict");

const Product = require("../src/models/Product");
const assistant = require("../src/services/supportAssistant");
const { assistantChat } = require("../src/controllers/supportController");

const tee = {
  name: "Desert Oat Tee",
  slug: "desert-oat-tee",
  fabric: "Cotton",
  gsm: "240",
  washCare: "Machine wash cold (30°C)\nWash inside out",
  sizeGuide: [
    { size: "S", chest: "44", length: "27" },
    { size: "M", chest: "46", length: "28" },
    { size: "L", chest: "48", length: "29" },
  ],
};

function stubProducts(t) {
  const original = Product.find;
  Product.find = () => ({ select: () => ({ limit: () => ({ lean: async () => [tee] }) }) });
  assistant.resetCacheForTests();
  t.after(() => {
    Product.find = original;
    assistant.resetCacheForTests();
  });
}

const user = (content) => ({ role: "user", content });
const bot = (content) => ({ role: "assistant", content });
const ask = (...messages) => assistant.runAssistant(messages, {});

test("recognises what customers ask, in English and Hinglish", () => {
  assert.equal(assistant.detectIntent("Where’s my order?"), "track");
  assert.equal(assistant.detectIntent("mera order kab aayega"), "track");
  assert.equal(assistant.detectIntent("I want to return my tee"), "return");
  assert.equal(assistant.detectIntent("Return or exchange"), "return");
  assert.equal(assistant.detectIntent("can I get a different size"), "exchange");
  assert.equal(assistant.detectIntent("paisa deducted but no order"), "refund");
  assert.equal(assistant.detectIntent("how many days for delivery"), "shipping");
  assert.equal(assistant.detectIntent("talk to a person please"), "human");
  assert.equal(assistant.detectIntent("asdfgh"), "");
});

test("pulls order number, email and phone out of messages", () => {
  assert.deepEqual(assistant.extractDetails("order #1024, phone 98765 43210"), { orderNumber: "1024", email: "", phone: "9876543210" });
  assert.deepEqual(assistant.extractDetails("1024 asha@example.com"), { orderNumber: "1024", email: "asha@example.com", phone: "" });
});

test("policy answers are quoted word for word", async () => {
  const shipping = await ask(user("How long does delivery take?"));
  assert.match(shipping.reply, /Orders are processed within 1–3 business days/);
  assert.match(shipping.reply, /Standard shipping is complimentary across India/);
  assert.equal(shipping.handoff, null);

  const returns = await ask(user("I want to return my tee"));
  assert.match(returns.reply, /within 7 days of delivery/);
  assert.equal(returns.handoff.category, "return-request");
});

test("order checks ask for proof, then use the verified lookup", async () => {
  const first = await ask(user("Where is my order?"));
  assert.match(first.reply, /order number/i);

  const second = await ask(user("Where is my order?"), bot(first.reply), user("1024"));
  assert.match(second.reply, /email or phone/i);

  let lookupArgs;
  const lookupOrder = async (args) => {
    lookupArgs = args;
    return { orderNumber: 1024, orderStatus: "Shipped", courierName: "Delhivery", trackingUrl: "https://shiprocket.co/tracking/AWB1", products: [{ name: "Desert Oat Tee", size: "M" }] };
  };
  const third = await assistant.runAssistant(
    [user("Where is my order?"), bot(first.reply), user("1024"), bot(second.reply), user("9876543210")],
    { lookupOrder }
  );
  assert.deepEqual(lookupArgs, { orderReference: "1024", email: "", phone: "9876543210" });
  assert.match(third.reply, /Order 1024 is shipped with Delhivery/);
  assert.match(third.reply, /shiprocket\.co\/tracking\/AWB1/);

  const missing = await assistant.runAssistant([user("track order 9999 asha@example.com")], { lookupOrder: async () => null });
  assert.match(missing.reply, /couldn’t find order 9999/);
  assert.equal(missing.handoff.category, "track-order");
});

test("size advice uses the real size guide", async (t) => {
  stubProducts(t);
  const withChest = await ask(user("Which size for a 40 inch chest?"));
  assert.match(withChest.reply, /For a 40″ chest, take M/);
  assert.match(withChest.reply, /or S if you like it closer/);

  const noChest = await ask(user("Which size should I take?"));
  assert.match(noChest.reply, /S: chest 44″/);
  assert.match(noChest.reply, /chest measurement/);
});

test("anything unknown goes to a person", async () => {
  const result = await ask(user("Do you ship to Dubai on camels?"));
  assert.match(result.reply, /send it to our team/i);
  assert.equal(result.handoff.category, "other");
});

const call = async (req) => {
  const res = { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  let error;
  await assistantChat(req, res, (nextError) => { error = nextError; });
  return { res, error };
};

test("the chat endpoint validates messages and answers without any outside service", async () => {
  assert.equal((await call({ body: { messages: [] } })).error?.statusCode, 400);
  assert.equal((await call({ body: { messages: [{ role: "assistant", content: "hi" }] } })).error?.statusCode, 400);
  const ok = await call({ body: { messages: [{ role: "user", content: "hello" }] } });
  assert.ifError(ok.error);
  assert.match(ok.res.body.reply, /Ask me about an order/);
});
