const test = require("node:test");
const assert = require("node:assert/strict");

const Coupon = require("../src/models/Coupon");
const Order = require("../src/models/Order");
const User = require("../src/models/User");
const coupons = require("../src/services/coupons");

function stub(t, target, key, value) {
  const original = target[key];
  target[key] = value;
  t.after(() => {
    target[key] = original;
  });
}

const lean = (value) => ({ select: () => ({ lean: async () => value }), lean: async () => value });
const customer = { userId: "u-friend", email: "friend@example.com", phone: "9876543210" };

test("WELCOME10 takes 10% off a first order only", async (t) => {
  stub(t, Order, "exists", async () => null);
  const ok = await coupons.resolveCoupon({ code: " welcome10 ", subtotalPaise: 119800, ...customer });
  assert.deepEqual(ok, { code: "WELCOME10", kind: "welcome", discountPaise: 11980 });

  Order.exists = async () => ({ _id: "earlier" });
  await assert.rejects(coupons.resolveCoupon({ code: "WELCOME10", subtotalPaise: 59900, ...customer }), /first order only/);
});

test("friend codes give a friend 10% and can't be used on your own order", async (t) => {
  stub(t, Order, "exists", async () => null);
  stub(t, User, "findOne", () => lean({ _id: "u-owner", email: "owner@example.com", phone: "9123456789" }));
  const ok = await coupons.resolveCoupon({ code: "hru-7k2pq", subtotalPaise: 59900, ...customer });
  assert.equal(ok.kind, "referral");
  assert.equal(ok.discountPaise, 5990);
  assert.equal(ok.referralOwnerId, "u-owner");

  await assert.rejects(
    coupons.resolveCoupon({ code: "HRU-7K2PQ", subtotalPaise: 59900, userId: null, email: "OWNER@example.com", phone: "" }),
    /can’t be used on your own order/
  );

  User.findOne = () => lean(null);
  await assert.rejects(coupons.resolveCoupon({ code: "HRU-ZZZZ9", subtotalPaise: 59900, ...customer }), /isn’t valid/);
});

test("a thank-you code works once, for its owner only", async (t) => {
  const reward = { code: "THANKS-ABC234", kind: "percent", value: 10, active: true, maxUses: 1, usedCount: 0, ownerUserId: "u-owner", ownerEmail: "owner@example.com", ownerPhone: "", minSubtotalPaise: 0 };
  stub(t, Coupon, "findOne", () => lean(reward));

  const mine = await coupons.resolveCoupon({ code: "thanks-abc234", subtotalPaise: 59900, userId: "u-owner" });
  assert.equal(mine.discountPaise, 5990);
  await assert.rejects(coupons.resolveCoupon({ code: "THANKS-ABC234", subtotalPaise: 59900, ...customer }), /belongs to another customer/);

  Coupon.findOne = () => lean({ ...reward, usedCount: 1 });
  await assert.rejects(coupons.resolveCoupon({ code: "THANKS-ABC234", subtotalPaise: 59900, userId: "u-owner" }), /already been used/);
});

test("the sharer's thank-you code is issued once, when the friend's order is delivered", async (t) => {
  const order = { _id: "o1", couponKind: "referral", referralOwnerId: "u-owner", referralRewardIssuedAt: null, orderStatus: "Delivered" };
  let claims = 0;
  stub(t, Order, "findOneAndUpdate", async () => (claims++ === 0 ? { ...order, referralRewardIssuedAt: new Date() } : null));
  stub(t, User, "findById", () => ({ select: () => ({ lean: async () => ({ _id: "u-owner", email: "owner@example.com", phone: "", name: "Asha" }) }) }));
  let created;
  stub(t, Coupon, "create", async (doc) => {
    created = doc;
    return doc;
  });

  const first = await coupons.grantReferralReward(order);
  assert.match(first.coupon.code, /^THANKS-[A-Z2-9]{6}$/);
  assert.equal(created.ownerUserId, "u-owner");
  assert.equal(created.maxUses, 1);

  assert.equal(await coupons.grantReferralReward(order), null, "a second delivery update issues nothing");
  assert.equal(await coupons.grantReferralReward({ ...order, orderStatus: "Shipped" }), null);
});

test("no code means no discount and no database work", async () => {
  assert.equal(await coupons.resolveCoupon({ code: "", subtotalPaise: 59900 }), null);
});
