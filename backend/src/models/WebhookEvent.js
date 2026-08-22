const mongoose = require("mongoose");

const webhookEventSchema = new mongoose.Schema(
  {
    provider: { type: String, required: true, trim: true },
    eventId: { type: String, required: true, trim: true },
    eventType: { type: String, required: true, trim: true },
    providerOrderId: { type: String, default: "", trim: true, index: true },
    providerPaymentId: { type: String, default: "", trim: true, index: true },
    status: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "processing",
    },
    resultCode: { type: String, default: "", trim: true },
    error: { type: String, default: "", trim: true },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

webhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });
webhookEventSchema.index({ status: 1, createdAt: 1 });

module.exports = mongoose.model("WebhookEvent", webhookEventSchema);
