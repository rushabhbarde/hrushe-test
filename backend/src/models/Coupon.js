const mongoose = require("mongoose");

/**
 * Stored coupons. WELCOME10 and personal friend codes (HRU-XXXX) are rules, not rows;
 * rows are the single-use "thank you" codes given to a customer when a friend's order
 * is delivered, plus any manual codes the team creates.
 */
const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    kind: { type: String, enum: ["percent", "flat"], default: "percent" },
    value: { type: Number, required: true, min: 0 },
    minSubtotalPaise: { type: Number, default: 0, min: 0 },
    source: { type: String, enum: ["referral-reward", "manual"], default: "manual" },
    // When set, only this customer (account, email or phone) can use the code.
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    ownerEmail: { type: String, default: "", lowercase: true, trim: true },
    ownerPhone: { type: String, default: "", trim: true },
    maxUses: { type: Number, default: 1, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null },
    sourceOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
  },
  { timestamps: true }
);

couponSchema.index({ ownerUserId: 1, active: 1 });
couponSchema.index({ sourceOrderId: 1 }, { unique: true, partialFilterExpression: { sourceOrderId: { $type: "objectId" } } });

module.exports = mongoose.model("Coupon", couponSchema);
