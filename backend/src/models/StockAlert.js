const mongoose = require("mongoose");

/** "Tell me when it's back": one waiting request per person, piece and size. */
const stockAlertSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    size: { type: String, default: "", trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    notifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

stockAlertSchema.index({ productId: 1, size: 1, email: 1, notifiedAt: 1 });

module.exports = mongoose.model("StockAlert", stockAlertSchema);
