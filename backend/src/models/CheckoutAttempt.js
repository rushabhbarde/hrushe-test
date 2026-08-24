const mongoose = require("mongoose");
const { CHECKOUT_ATTEMPT_INDEX } = require("../utils/checkoutAttemptIndexSpec");

const checkoutAttemptSchema = new mongoose.Schema(
  {
    keyHash: {
      type: String,
      required: true,
      trim: true,
    },
    identityHash: {
      type: String,
      required: true,
      trim: true,
    },
    cartHash: {
      type: String,
      required: true,
      trim: true,
    },
    requestHash: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["processing", "created", "failed", "expired"],
      default: "processing",
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    checkoutSessionId: {
      type: String,
      default: "",
      trim: true,
    },
    responseSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    errorMessage: {
      type: String,
      default: "",
      trim: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

checkoutAttemptSchema.index(
  CHECKOUT_ATTEMPT_INDEX.key,
  {
    unique: CHECKOUT_ATTEMPT_INDEX.unique,
    name: CHECKOUT_ATTEMPT_INDEX.name,
    partialFilterExpression: CHECKOUT_ATTEMPT_INDEX.partialFilterExpression,
  }
);
checkoutAttemptSchema.index({ orderId: 1 });
checkoutAttemptSchema.index({ checkoutSessionId: 1 });

module.exports = mongoose.model("CheckoutAttempt", checkoutAttemptSchema);
