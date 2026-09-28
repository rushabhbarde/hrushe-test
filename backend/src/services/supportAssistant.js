const Product = require("../models/Product");
const policies = require("../data/policies.json");

/**
 * HRUSHE's own help assistant — no external AI. It recognises what the customer is asking
 * (English + common Hinglish), answers word-for-word from the store policies and live
 * products, checks an order with the same proof as Track Order, and hands anything it
 * can't do (returns, refunds, cancellations, the unknown) to the team as a ticket.
 */

const CONTACT = "team@hrushe.in · +91 91128 54988 (Mon–Sat, 10–7)";

const INTENTS = [
  ["human", /\b(human|person|agent|someone|executive|representative|call me|talk to|speak to|baat kar|team se)\b/],
  ["cancel", /\b(cancel|cancellation|radd)\b/],
  ["refund", /\b(refund|money back|paisa|paise|charged|deducted|payment (failed|issue|problem)|double (charge|payment))\b/],
  ["exchange", /\b(exchange|swap|replace|badal|badalna|different size|size change)\b/],
  ["return", /\b(return|send back|wapas|vapas)\b/],
  ["damaged", /\b(damaged|defective|torn|stain|wrong (item|product|size|colou?r)|missing item)\b/],
  ["track", /\b(track|tracking|where('?s| is)? my order|order status|status|kab aayega|kab ayega|not (received|delivered|arrived)|delivered|shipped|dispatch(ed)?|awb)\b/],
  ["shipping", /\b(shipping|delivery|deliver|how long|kitne din|days|charges|free delivery|cod|cash on delivery)\b/],
  ["size", /\b(size|sizing|fit|fits|measurement|chest|oversized?|small|medium|large|xl)\b/],
  ["care", /\b(wash|care|fabric|material|gsm|cotton|shrink|iron)\b/],
  ["account", /\b(login|log in|sign in|signin|otp|account|password)\b/],
  ["thanks", /\b(thanks|thank you|thx|dhanyavad|shukriya|ok bye|bye)\b/],
  ["greeting", /^(hi|hii+|hello|hey|namaste|good (morning|afternoon|evening))\b/],
];

function section(policyKey, titleStart) {
  const policy = policies.find((item) => item.key === policyKey);
  const found = policy?.sections.find((item) =>
    item.title.replace(/^\s*\d+[.)]\s*/, "").toLowerCase().startsWith(titleStart.toLowerCase())
  );
  return found ? found.body.split("\n")[0].trim() : "";
}

function detectIntent(text) {
  const value = text.toLowerCase().replace(/[’‘`]/g, "'");
  if (/\b(return|wapas|vapas)\b/.test(value) && /\b(exchange|badal)\b/.test(value)) {
    return "return";
  }
  const match = INTENTS.find(([, pattern]) => pattern.test(value));
  return match ? match[0] : "";
}

/** Order number, email and phone from what the customer has typed so far. */
function extractDetails(userText) {
  const email = (userText.match(/[^\s@]+@[^\s@]+\.[^\s@]+/) || [])[0] || "";
  const phoneMatch = userText.replace(/[\s-]/g, "").match(/(?:\+?91)?([6-9]\d{9})\b/);
  const phone = phoneMatch ? phoneMatch[1] : "";
  const withoutPhone = phone ? userText.replace(/[\s-]/g, " ").replace(new RegExp(phone), " ") : userText;
  const orderMatch = withoutPhone.match(/(?:order|#|no\.?|number)\s*#?\s*(\d{3,7})\b/i) || withoutPhone.match(/\b(\d{3,7})\b/);
  return { orderNumber: orderMatch ? orderMatch[1] : "", email, phone };
}

const productCache = { items: null, expiresAt: 0 };
async function loadProducts() {
  if (productCache.items && Date.now() < productCache.expiresAt) {
    return productCache.items;
  }
  const items = await Product.find({ status: { $in: ["Active", "active"] } })
    .select("name slug fitType fabric gsm washCare sizeGuide")
    .limit(80)
    .lean()
    .catch(() => []);
  productCache.items = items;
  productCache.expiresAt = Date.now() + 5 * 60 * 1000;
  return items;
}

function pickProduct(products, text) {
  const value = text.toLowerCase();
  return (
    products.find((product) =>
      String(product.name || "")
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 3 && word !== "tee")
        .some((word) => value.includes(word))
    ) || products.find((product) => Array.isArray(product.sizeGuide) && product.sizeGuide.length) || null
  );
}

function sizeAnswer(products, text) {
  const product = pickProduct(products, text);
  const guide = (product?.sizeGuide || []).filter((row) => Number(row.chest) > 0);
  if (!guide.length) {
    return "Each piece’s size guide is on its product page under “Size guide”. Tell me your chest measurement in inches and I’ll suggest a size.";
  }

  const table = guide.map((row) => `${row.size}: chest ${row.chest}″, length ${row.length}″`).join(" · ");
  const chest = Number((text.match(/(\d{2}(?:\.\d)?)\s*(?:inch|in\b|″|")/i) || text.match(/chest\D{0,12}(\d{2}(?:\.\d)?)/i) || [])[1]);
  const name = product?.name ? `${product.name} ` : "";

  if (chest >= 28 && chest <= 56) {
    // Garment chest is measured flat-lay around; ~5″ over body chest gives the relaxed HRUSHE fit.
    const pick = guide.find((row) => Number(row.chest) - chest >= 5) || guide[guide.length - 1];
    const closer = guide[guide.indexOf(pick) - 1];
    return `For a ${chest}″ chest, take ${pick.size} for the relaxed fit it’s designed for${
      closer ? ` — or ${closer.size} if you like it closer` : ""
    }. ${name}garment measurements: ${table}.`;
  }

  return `${name}garment measurements: ${table}. Tell me your chest measurement in inches and I’ll suggest a size.`;
}

function careAnswer(products, text) {
  const product = pickProduct(products, text);
  if (!product) {
    return "Fabric and care details are on each product page.";
  }
  const care = String(product.washCare || "").split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 4).join(", ");
  return `${product.name}: ${[product.fabric, product.gsm && `${product.gsm} GSM`].filter(Boolean).join(", ")}. Care: ${care || "see the product page"}.`;
}

function orderSummary(order) {
  const items = (order.products || []).map((item) => `${item.name} (${item.size})`).join(", ");
  const tracking = order.trackingUrl ? ` Track it here: ${order.trackingUrl}` : " Tracking is shared as soon as it ships.";
  return `Order ${order.orderNumber || ""} is ${String(order.orderStatus || "").toLowerCase()}${
    order.courierName ? ` with ${order.courierName}` : ""
  }. ${items ? `Items: ${items}.` : ""}${tracking}`.replace(/\s+/g, " ").trim();
}

/**
 * One turn. `messages` = visible chat ending with the customer's message.
 * Returns { reply, handoff, suggestions }.
 */
async function runAssistant(messages, { lookupOrder } = {}) {
  const userMessages = messages.filter((message) => message.role === "user").map((message) => message.content);
  const last = userMessages[userMessages.length - 1] || "";
  const allUserText = userMessages.join("\n");
  const lastBot = [...messages].reverse().find((message) => message.role === "assistant")?.content || "";
  const details = extractDetails(allUserText);

  let intent = detectIntent(last);
  // A reply with just an order number / email / phone continues the order check.
  if ((!intent || intent === "greeting") && /order number|email or phone/i.test(lastBot) && (details.orderNumber || details.email || details.phone)) {
    intent = "track";
  }

  const handoff = (category, summary) => ({ category, summary, orderNumber: details.orderNumber });

  switch (intent) {
    case "greeting":
      return {
        reply: "Hello. Ask me about an order, returns, sizes or delivery.",
        handoff: null,
        suggestions: ["Where’s my order?", "Return or exchange", "Which size should I take?"],
      };
    case "thanks":
      return { reply: "You’re welcome. We’re here if you need anything else.", handoff: null, suggestions: [] };
    case "track": {
      if (!details.orderNumber) {
        return { reply: "I can check that. What’s your order number? It’s in your confirmation email, e.g. 1024.", handoff: null, suggestions: [] };
      }
      if (!details.email && !details.phone) {
        return { reply: `Thanks. To confirm it’s your order ${details.orderNumber}, what email or phone did you use at checkout?`, handoff: null, suggestions: [] };
      }
      const order = lookupOrder
        ? await lookupOrder({ orderReference: details.orderNumber, email: details.email, phone: details.phone }).catch(() => null)
        : null;
      if (!order) {
        return {
          reply: `I couldn’t find order ${details.orderNumber} with those details. Check the number and the email or phone used at checkout — or send it to our team.`,
          handoff: handoff("track-order", `Customer can't find order ${details.orderNumber}.`),
          suggestions: [],
        };
      }
      return { reply: orderSummary(order), handoff: null, suggestions: ["Return or exchange", "Talk to a person"] };
    }
    case "cancel":
      return {
        reply: `${section("returns", "Cancellation")} If your order is still within that window, send it to our team now and we’ll cancel it.`,
        handoff: handoff("other", `Customer wants to cancel${details.orderNumber ? ` order ${details.orderNumber}` : " an order"}.`),
        suggestions: [],
      };
    case "damaged":
      return {
        reply: `Sorry about that. ${section("returns", "Conditions for Return").split(". ").slice(1).join(". ")} Send it to our team with your order number and we’ll sort it.`,
        handoff: handoff("return-request", "Customer received a damaged, defective or incorrect item."),
        suggestions: [],
      };
    case "return":
      return {
        reply: `${section("returns", "Return Eligibility")} ${section("returns", "Exchange")} ${section("returns", "Refund Process")} To start a return or exchange, send it to our team.`,
        handoff: handoff("return-request", `Customer wants to return${details.orderNumber ? ` from order ${details.orderNumber}` : " a piece"}.`),
        suggestions: ["Exchange instead", "Which size should I take?"],
      };
    case "exchange":
      return {
        reply: `${section("returns", "Exchange")} To arrange it, send it to our team with the size you’d like.`,
        handoff: handoff("exchange-request", `Customer wants a size exchange${details.orderNumber ? ` for order ${details.orderNumber}` : ""}.`),
        suggestions: ["Which size should I take?"],
      };
    case "refund":
      return {
        reply: `${section("returns", "Refund Process")} If money was deducted but the order didn’t go through, it’s usually reversed automatically by your bank — send it to our team and we’ll check it for you.`,
        handoff: handoff("payment-refund", `Customer has a payment/refund question${details.orderNumber ? ` about order ${details.orderNumber}` : ""}.`),
        suggestions: [],
      };
    case "shipping":
      return {
        reply: `${section("shipping", "Order Processing")} ${section("shipping", "Delivery Time")} ${section("shipping", "Shipping Charges")}`,
        handoff: null,
        suggestions: ["Where’s my order?"],
      };
    case "size":
      return { reply: sizeAnswer(await loadProducts(), allUserText), handoff: null, suggestions: ["Return or exchange"] };
    case "care":
      return { reply: careAnswer(await loadProducts(), allUserText), handoff: null, suggestions: [] };
    case "account":
      return {
        reply: "You sign in with your mobile number and a 6-digit SMS code — no password. If the code doesn’t arrive, wait a minute and tap “Resend code”.",
        handoff: handoff("login-help", "Customer has trouble signing in."),
        suggestions: [],
      };
    case "human":
      return {
        reply: `Of course. Send your question to our team and a person will reply by email. You can also reach us at ${CONTACT}.`,
        handoff: handoff("other", `Customer asked for a person: "${last.slice(0, 200)}"`),
        suggestions: [],
      };
    default:
      return {
        reply: `I’m not sure about that one. Send it to our team and a person will reply by email — or reach us at ${CONTACT}.`,
        handoff: handoff("other", `Customer asked: "${last.slice(0, 300)}"`),
        suggestions: ["Where’s my order?", "Return or exchange", "Which size should I take?"],
      };
  }
}

function resetCacheForTests() {
  productCache.items = null;
  productCache.expiresAt = 0;
}

module.exports = { runAssistant, detectIntent, extractDetails, resetCacheForTests };
