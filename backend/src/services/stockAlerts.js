const Product = require("../models/Product");
const StockAlert = require("../models/StockAlert");
const { buildBackInStockEmail } = require("../utils/emailTemplates");
const { sendEmail } = require("../utils/mailer");
const { logEvent } = require("../utils/logger");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ALERTS_PER_RUN = 200;

const isPubliclyBuyable = (product) => !product.status || ["Active", "active"].includes(product.status);

/** Sizes of a piece that can be bought right now. An untracked piece is always available. */
function availableSizes(product) {
  if (!isPubliclyBuyable(product)) {
    return [];
  }
  if (!product.trackInventory) {
    return product.sizes || [];
  }
  return (product.variants || [])
    .filter((variant) => variant.active && Number(variant.stock) > 0)
    .map((variant) => String(variant.size || ""));
}

const sameSize = (left, right) => String(left || "").toLowerCase() === String(right || "").toLowerCase();

async function requestStockAlert({ product, size, email, userId }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedSize = String(size || "").trim().slice(0, 20);
  if (!EMAIL_PATTERN.test(normalizedEmail) || normalizedEmail.length > 254) {
    return { ok: false, reason: "invalid-email" };
  }
  if (normalizedSize && !(product.sizes || []).some((option) => sameSize(option, normalizedSize))) {
    return { ok: false, reason: "unknown-size" };
  }
  if (availableSizes(product).some((option) => !normalizedSize || sameSize(option, normalizedSize))) {
    return { ok: false, reason: "in-stock" };
  }

  await StockAlert.updateOne(
    { productId: product._id, size: normalizedSize, email: normalizedEmail, notifiedAt: null },
    { $setOnInsert: { userId: userId || null } },
    { upsert: true }
  );
  return { ok: true };
}

/**
 * Called after a piece's stock may have gone up (Atelier edit, cancelled order). Emails
 * everyone waiting on a size that is now available, once. Never throws.
 */
async function notifyBackInStock(productId, deps = {}) {
  const send = deps.sendEmail || sendEmail;
  try {
    const product = await Product.findById(productId);
    if (!product) {
      return { sent: 0 };
    }
    const available = availableSizes(product);
    if (available.length === 0) {
      return { sent: 0 };
    }

    const waiting = await StockAlert.find({ productId: product._id, notifiedAt: null }).limit(MAX_ALERTS_PER_RUN);
    let sent = 0;
    for (const alert of waiting) {
      const sizeIsBack = alert.size ? available.some((size) => sameSize(size, alert.size)) : true;
      if (!sizeIsBack) continue;
      // Claim first so two triggers close together cannot both email.
      const claimed = await StockAlert.findOneAndUpdate(
        { _id: alert._id, notifiedAt: null },
        { $set: { notifiedAt: new Date() } }
      );
      if (!claimed) continue;
      const name = product.displayName || product.name;
      let delivered = false;
      try {
        const result = await send({
          to: alert.email,
          subject: `${name}${alert.size ? ` in ${alert.size}` : ""} is back`,
          text: `${name}${alert.size ? ` in size ${alert.size}` : ""} is back at HRUSHE.`,
          html: buildBackInStockEmail({ product, size: alert.size }),
        });
        delivered = result?.delivered !== false;
      } catch (error) {
        logEvent("stock_alerts.email_failed", { message: error?.message }, "error");
      }
      if (!delivered) {
        // Not sent: keep the person waiting so the next restock tries again.
        await StockAlert.updateOne({ _id: alert._id }, { $set: { notifiedAt: null } });
        continue;
      }
      sent += 1;
    }
    if (sent > 0) {
      logEvent("stock_alerts.sent", { productId: String(product._id), sent });
    }
    return { sent };
  } catch (error) {
    logEvent("stock_alerts.failed", { productId: String(productId), message: error?.message }, "error");
    return { sent: 0 };
  }
}

module.exports = { availableSizes, notifyBackInStock, requestStockAlert };
