const mongoose = require("mongoose");

const verificationCodeSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    purpose: {
      type: String,
      required: true,
      enum: ["signup", "password-reset", "email-change"],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    codeHash: {
      type: String,
      required: true,
    },
    failedAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    lockedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

verificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
verificationCodeSchema.index({ email: 1, purpose: 1, userId: 1, createdAt: -1 });

module.exports = mongoose.model("VerificationCode", verificationCodeSchema);
