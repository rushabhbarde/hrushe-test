const test = require("node:test");
const assert = require("node:assert/strict");

const env = require("../src/config/env");
const Product = require("../src/models/Product");
const assistant = require("../src/services/supportAssistant");
const { assistantChat } = require("../src/controllers/supportController");

function setup(t, extraEnv = {}) {
  const previous = { key: env.ANTHROPIC_API_KEY, find: Product.find };
  env.ANTHROPIC_API_KEY = "test-key";
  Object.assign(env, extraEnv);
  Product.find = () => ({
    select: () => ({
      limit: () => ({
        lean: async () => [{ name: "Desert Oat Tee", slug: "desert-oat-tee", pricePaise: 59900, sizes: ["S", "M"], trackInventory: false, fabric: "Cotton" }],
      }),
    }),
  });
  assistant.resetKnowledgeCacheForTests();
  t.after(() => {
    env.ANTHROPIC_API_KEY = previous.key;
    Product.find = previous.find;
    assistant.resetKnowledgeCacheForTests();
  });
}

const reply = (content, stop = "end_turn") => ({ ok: true, status: 200, json: async () => ({ stop_reason: stop, content }) });

test("system prompt carries the policies, products and safety rules", async (t) => {
  setup(t);
  const bodies = [];
  const fetchImpl = async (url, init) => {
    bodies.push(JSON.parse(init.body));
    return reply([{ type: "text", text: "Returns are accepted within 7 days of delivery." }]);
  };
  const result = await assistant.runAssistant([{ role: "user", content: "What is your return policy?" }], { fetchImpl });

  assert.equal(result.reply, "Returns are accepted within 7 days of delivery.");
  assert.equal(result.handoff, null);
  assert.match(bodies[0].system, /Return & Refund Policy/);
  assert.match(bodies[0].system, /Desert Oat Tee — ₹599/);
  assert.match(bodies[0].system, /Never ask for or accept OTPs/);
  assert.equal(bodies[0].tools.length, 2);
});

test("order questions use the verified lookup and never skip it", async (t) => {
  setup(t);
  let lookupArgs;
  let round = 0;
  const bodies = [];
  const fetchImpl = async (url, init) => {
    bodies.push(JSON.parse(init.body));
    round += 1;
    return round === 1
      ? reply([{ type: "tool_use", id: "tu1", name: "track_order", input: { order_number: "1024", phone: "9876543210" } }], "tool_use")
      : reply([{ type: "text", text: "Order 1024 has shipped with Delhivery." }]);
  };
  const lookupOrder = async (args) => {
    lookupArgs = args;
    return { orderNumber: 1024, orderStatus: "Shipped", paymentStatus: "paid", courierName: "Delhivery", products: [] };
  };

  const result = await assistant.runAssistant([{ role: "user", content: "Where is order 1024? My phone is 9876543210" }], { fetchImpl, lookupOrder });

  assert.deepEqual(lookupArgs, { orderReference: "1024", email: undefined, phone: "9876543210" });
  const toolResult = bodies[1].messages.at(-1).content[0];
  assert.equal(toolResult.type, "tool_result");
  assert.match(toolResult.content, /"status":"Shipped"/);
  assert.equal(result.reply, "Order 1024 has shipped with Delhivery.");
});

test("hand-off returns a ticket draft for the team", async (t) => {
  setup(t);
  let round = 0;
  const fetchImpl = async () => {
    round += 1;
    return round === 1
      ? reply([{ type: "tool_use", id: "tu1", name: "hand_off_to_team", input: { category: "return-request", summary: "Wants to return a tee, wrong size.", order_number: "1024" } }], "tool_use")
      : reply([{ type: "text", text: "I’ll pass this to our team." }]);
  };

  const result = await assistant.runAssistant([{ role: "user", content: "I want to return my tee" }], { fetchImpl });

  assert.deepEqual(result.handoff, { category: "return-request", summary: "Wants to return a tee, wrong size.", orderNumber: "1024" });
});

const call = async (req) => {
  const res = { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  let error;
  await assistantChat(req, res, (nextError) => { error = nextError; });
  return { res, error };
};

test("the chat endpoint is off without a key and validates messages", async (t) => {
  const previous = env.ANTHROPIC_API_KEY;
  t.after(() => { env.ANTHROPIC_API_KEY = previous; });

  env.ANTHROPIC_API_KEY = "";
  assert.equal((await call({ body: { messages: [{ role: "user", content: "hi" }] } })).error?.statusCode, 503);

  env.ANTHROPIC_API_KEY = "test-key";
  assert.equal((await call({ body: { messages: [] } })).error?.statusCode, 400);
  assert.equal((await call({ body: { messages: [{ role: "assistant", content: "hi" }] } })).error?.statusCode, 400);
});
