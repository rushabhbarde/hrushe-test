const Order = require("../models/Order");
const shiprocket = require("./shiprocket");
const { logEvent } = require("../utils/logger");

const STALE_SENDING_MS = 2 * 60 * 1000;

/**
 * Sends a paid order to Shiprocket exactly once, and only after the team has confirmed it
 * with the customer by phone (callConfirmedAt). Called from "Confirm after call" and the retry. Never throws: a Shiprocket outage
 * must not undo the confirmation, so failures are stored on the order for a retry.
 */
async function sendOrderToShiprocket(orderId) {
  if (!shiprocket.isShiprocketConfigured()) {
    return { order: await Order.findById(orderId), skipped: "not-configured" };
  }

  const now = new Date();
  const claimed = await Order.findOneAndUpdate(
    {
      _id: orderId,
      orderStatus: { $in: ["Confirmed", "Packed"] },
      paymentStatus: "paid",
      callConfirmedAt: { $ne: null },
      $or: [
        { "shiprocket.status": { $in: ["", "failed", null] } },
        { "shiprocket.status": { $exists: false } },
        { "shiprocket.status": "sending", "shiprocket.attemptedAt": { $lt: new Date(now.getTime() - STALE_SENDING_MS) } },
      ],
    },
    { $set: { "shiprocket.status": "sending", "shiprocket.attemptedAt": now, "shiprocket.error": "" } },
    { new: true }
  );

  if (!claimed) {
    return { order: await Order.findById(orderId), skipped: "not-eligible-or-already-sent" };
  }

  try {
    const created = await shiprocket.createShiprocketOrder(claimed);
    const update = {
      "shiprocket.status": "created",
      "shiprocket.orderId": created.orderId,
      "shiprocket.shipmentId": created.shipmentId,
      "shiprocket.awbCode": created.awbCode,
      "shiprocket.createdAt": new Date(),
    };
    const order = await Order.findByIdAndUpdate(orderId, { $set: update }, { new: true });
    return { order, sent: true };
  } catch (error) {
    logEvent("shiprocket.order.failed", { orderId: String(orderId), message: error?.message }, "error");
    const order = await Order.findByIdAndUpdate(
      orderId,
      { $set: { "shiprocket.status": "failed", "shiprocket.error": String(error?.message || "Unknown error").slice(0, 500) } },
      { new: true }
    );
    return { order, failed: true };
  }
}

module.exports = { sendOrderToShiprocket };
