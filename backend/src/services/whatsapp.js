const env = require("../config/env");
const Order = require("../models/Order");
const User = require("../models/User");
const { normalizeIndianPhone } = require("../utils/phone");
const { logEvent } = require("../utils/logger");

const GRAPH_API = "https://graph.facebook.com/v21.0";

/**
 * Order updates on WhatsApp through Meta's WhatsApp Cloud API.
 * Business-initiated messages must use templates approved in WhatsApp Manager;
 * the names and wording to submit are in docs/whatsapp-templates.md.
 */
const TEMPLATES = {
  Confirmed: {
    name: "hrushe_order_confirmed",
    params: (order) => [firstName(order), orderLabel(order), formatRupees(order)],
  },
  Shipped: {
    name: "hrushe_order_shipped",
    params: (order) => [
      firstName(order),
      orderLabel(order),
      order.courierName || "our courier",
      order.trackingUrl || "https://hrushe.in/track-order",
    ],
  },
  "Out for delivery": {
    name: "hrushe_order_out_for_delivery",
    params: (order) => [firstName(order), orderLabel(order)],
  },
  Delivered: {
    name: "hrushe_order_delivered",
    params: (order) => [firstName(order), orderLabel(order)],
  },
};

function isWhatsAppConfigured() {
  return Boolean(env.WHATSAPP_ENABLED && env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID);
}

function firstName(order) {
  const name = String(order.shippingAddressDetails?.fullName || order.customerName || "").trim().split(/\s+/)[0];
  return name || "there";
}

function orderLabel(order) {
  return order.orderNumber ? `#${order.orderNumber}` : `#${String(order._id).slice(-6).toUpperCase()}`;
}

function formatRupees(order) {
  const paise = Number(order.totalPaise);
  const rupees = Number.isFinite(paise) && paise > 0 ? paise / 100 : Number(order.totalAmount || 0);
  return `₹${rupees.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function recipientFor(order) {
  const phone = normalizeIndianPhone(order.customerPhone || order.shippingAddressDetails?.mobile || "");
  return /^[6-9]\d{9}$/.test(phone) ? `91${phone}` : "";
}

function buildTemplateMessage(order) {
  const template = TEMPLATES[order.orderStatus];
  const to = recipientFor(order);
  if (!template || !to) {
    return null;
  }
  return {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: template.name,
      language: { code: env.WHATSAPP_TEMPLATE_LANGUAGE },
      components: [
        {
          type: "body",
          // WhatsApp rejects parameters with newlines, tabs or 4+ spaces.
          parameters: template.params(order).map((text) => ({
            type: "text",
            text: String(text).replace(/\s+/g, " ").trim().slice(0, 200),
          })),
        },
      ],
    },
  };
}

async function customerAllowsWhatsApp(order) {
  if (!order.userId) {
    return true; // Guests gave their number for delivery and order updates.
  }
  const user = await User.findById(order.userId).select("communicationPreferences").lean();
  return user?.communicationPreferences?.whatsappOrderUpdates !== false;
}

/**
 * Sends the update for the order's current status, once per status. Never throws:
 * a WhatsApp failure must not affect payments, shipping or email.
 */
async function sendOrderUpdate(order, { fetchImpl = fetch } = {}) {
  try {
    if (!isWhatsAppConfigured() || !order) {
      return { sent: false, reason: "disabled" };
    }
    const message = buildTemplateMessage(order);
    if (!message) {
      return { sent: false, reason: "no-template-or-phone" };
    }
    if (!(await customerAllowsWhatsApp(order))) {
      return { sent: false, reason: "opted-out" };
    }

    const status = order.orderStatus;
    const claimed = await Order.findOneAndUpdate(
      { _id: order._id, whatsappNotified: { $ne: status } },
      { $addToSet: { whatsappNotified: status } },
      { new: true }
    );
    if (!claimed) {
      return { sent: false, reason: "already-sent" };
    }

    const response = await fetchImpl(`${GRAPH_API}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      // Release the claim so a later update can try again.
      await Order.updateOne({ _id: order._id }, { $pull: { whatsappNotified: status } });
      logEvent("whatsapp.send.failed", {
        orderId: String(order._id),
        status,
        httpStatus: response.status,
        code: body?.error?.code,
        message: body?.error?.message,
      }, "error");
      return { sent: false, reason: "api-error" };
    }

    logEvent("whatsapp.sent", { orderId: String(order._id), status, template: message.template.name });
    return { sent: true, messageId: body?.messages?.[0]?.id || "" };
  } catch (error) {
    logEvent("whatsapp.send.failed", { orderId: String(order?._id || ""), message: error?.message }, "error");
    return { sent: false, reason: "error" };
  }
}

module.exports = { TEMPLATES, buildTemplateMessage, isWhatsAppConfigured, sendOrderUpdate };
