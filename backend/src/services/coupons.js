const crypto = require("crypto");
const Coupon = require("../models/Coupon");
const Order = require("../models/Order");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { percentageDiscountPaise, fixedDiscountPaise } = require("../utils/money");
const { normalizeIndianPhone } = require("../utils/phone");
const { logEvent } = require("../utils/logger");

/**
 * Discounts are decided here, on the server, from the cart the server priced itself.
 *   WELCOME10      10% off a customer's first paid order (checked by account, email and phone).
 *   HRU-XXXX       a customer's personal friend code: 10% off a friend's first order.
 *   stored codes   e.g. THANKS-XXXXXX, the single-use 10% code a customer earns when a
 *                  friend's order is delivered (only that customer can use it).
 */
const WELCOME_CODE = "WELCOME10";
const WELCOME_PERCENT = 10;
const REFERRAL_PERCENT = 10;
const REWARD_PERCENT = 10;
const REFERRAL_PATTERN = /^HRU-[A-Z0-9]{4,8}$/;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

function normalizeCode(code) {
  return String(code || "").trim().toUpperCase().replace(/\s+/g, "");
}

function randomCode(length) {
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("");
}

function customerFilters({ userId, email, phone }) {
  const filters = [];
  if (userId) filters.push({ userId });
  if (email) filters.push({ customerEmail: String(email).toLowerCase() });
  const normalizedPhone = phone ? normalizeIndianPhone(phone) : "";
  if (normalizedPhone) filters.push({ customerPhone: normalizedPhone });
  return filters;
}

async function hasPriorPaidOrder(customer) {
  const filters = customerFilters(customer);
  if (!filters.length) {
    return false;
  }
  return Boolean(await Order.exists({ paymentStatus: "paid", $or: filters }));
}

function isSameCustomer(owner, { userId, email, phone }) {
  const normalizedPhone = phone ? normalizeIndianPhone(phone) : "";
  return Boolean(
    (userId && owner._id && String(owner._id) === String(userId)) ||
      (email && owner.email && String(owner.email).toLowerCase() === String(email).toLowerCase()) ||
      (normalizedPhone && owner.phone && String(owner.phone) === normalizedPhone)
  );
}

/**
 * Validates a code for this customer and cart. Returns
 * { code, kind, discountPaise, referralOwnerId?, couponId? } or throws a friendly 400.
 */
async function resolveCoupon({ code, subtotalPaise, userId = null, email = "", phone = "" }) {
  const normalized = normalizeCode(code);
  if (!normalized) {
    return null;
  }
  const customer = { userId, email, phone };

  if (normalized === WELCOME_CODE) {
    if (await hasPriorPaidOrder(customer)) {
      throw new AppError("WELCOME10 is for a first order only.", 400);
    }
    return { code: WELCOME_CODE, kind: "welcome", discountPaise: percentageDiscountPaise(subtotalPaise, WELCOME_PERCENT) };
  }

  if (REFERRAL_PATTERN.test(normalized)) {
    const owner = await User.findOne({ referralCode: normalized }).select("_id email phone").lean();
    if (!owner) {
      throw new AppError("That code isn’t valid.", 400);
    }
    if (isSameCustomer(owner, customer)) {
      throw new AppError("Share your code with a friend — it can’t be used on your own order.", 400);
    }
    if (await hasPriorPaidOrder(customer)) {
      throw new AppError("Friend codes are for a first order only.", 400);
    }
    return {
      code: normalized,
      kind: "referral",
      discountPaise: percentageDiscountPaise(subtotalPaise, REFERRAL_PERCENT),
      referralOwnerId: owner._id,
    };
  }

  const coupon = await Coupon.findOne({ code: normalized }).lean();
  const now = Date.now();
  if (!coupon || !coupon.active || (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < now) || coupon.usedCount >= coupon.maxUses) {
    throw new AppError("That code isn’t valid or has already been used.", 400);
  }
  const restricted = coupon.ownerUserId || coupon.ownerEmail || coupon.ownerPhone;
  if (restricted && !isSameCustomer({ _id: coupon.ownerUserId, email: coupon.ownerEmail, phone: coupon.ownerPhone }, customer)) {
    throw new AppError("This code belongs to another customer.", 400);
  }
  if (subtotalPaise < (coupon.minSubtotalPaise || 0)) {
    throw new AppError(`This code needs a bag of at least ₹${Math.round(coupon.minSubtotalPaise / 100)}.`, 400);
  }
  const discountPaise =
    coupon.kind === "flat" ? fixedDiscountPaise(subtotalPaise, coupon.value) : percentageDiscountPaise(subtotalPaise, coupon.value);
  return { code: coupon.code, kind: "stored", discountPaise, couponId: coupon._id };
}

/** Called once a payment is confirmed: counts a use of a stored code. */
async function recordCouponUse(order) {
  if (order?.couponKind !== "stored" || !order.couponCode) {
    return;
  }
  await Coupon.updateOne(
    { code: order.couponCode, $expr: { $lt: ["$usedCount", "$maxUses"] } },
    { $inc: { usedCount: 1 } }
  ).catch((error) => logEvent("coupon.use.failed", { message: error?.message, code: order.couponCode }, "error"));
}

/** A customer's personal friend code, created on first request. */
async function getOrCreateReferralCode(userId) {
  const user = await User.findById(userId).select("referralCode");
  if (!user) {
    throw new AppError("User not found", 404);
  }
  if (user.referralCode) {
    return user.referralCode;
  }
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = `HRU-${randomCode(5)}`;
    if (!(await User.exists({ referralCode: candidate }))) {
      const updated = await User.findOneAndUpdate(
        { _id: userId, referralCode: { $in: [null, undefined, ""] } },
        { $set: { referralCode: candidate } },
        { new: true }
      ).select("referralCode");
      return updated?.referralCode || (await User.findById(userId).select("referralCode")).referralCode;
    }
  }
  throw new AppError("Could not create your code. Please try again.", 500);
}

/**
 * When a friend's order is delivered, give the code's owner a single-use 10% code.
 * Idempotent: the order is claimed once via referralRewardIssuedAt.
 */
async function grantReferralReward(order) {
  if (order?.couponKind !== "referral" || !order.referralOwnerId || order.referralRewardIssuedAt || order.orderStatus !== "Delivered") {
    return null;
  }
  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, referralRewardIssuedAt: null, orderStatus: "Delivered" },
    { $set: { referralRewardIssuedAt: new Date() } },
    { new: true }
  );
  if (!claimed) {
    return null;
  }
  const owner = await User.findById(order.referralOwnerId).select("_id email phone name").lean();
  if (!owner) {
    return null;
  }
  const coupon = await Coupon.create({
    code: `THANKS-${randomCode(6)}`,
    kind: "percent",
    value: REWARD_PERCENT,
    source: "referral-reward",
    ownerUserId: owner._id,
    ownerEmail: owner.email || "",
    ownerPhone: owner.phone || "",
    maxUses: 1,
    sourceOrderId: order._id,
  });
  logEvent("coupon.referral_reward.issued", { ownerId: String(owner._id), orderId: String(order._id) });
  return { coupon, owner };
}

async function listRewardCoupons(userId) {
  return Coupon.find({ ownerUserId: userId, active: true, $expr: { $lt: ["$usedCount", "$maxUses"] } })
    .select("code kind value createdAt")
    .sort({ createdAt: -1 })
    .lean();
}

module.exports = {
  WELCOME_CODE,
  getOrCreateReferralCode,
  grantReferralReward,
  listRewardCoupons,
  normalizeCode,
  recordCouponUse,
  resolveCoupon,
};
