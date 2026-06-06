const mongoose = require("mongoose");
const Counter = require("./Counter");

const supportTranscriptSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["bot", "customer", "system"],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
    timestamps: true,
  }
);

const supportRequestSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: Number,
      unique: true,
      sparse: true,
      min: 1,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    category: {
      type: String,
      enum: [
        "track-order",
        "return-request",
        "exchange-request",
        "login-help",
        "signup-help",
        "payment-refund",
        "product-size",
        "coupon-sale",
        "website-issue",
        "contact-support",
        "other",
      ],
      default: "contact-support",
    },
    source: {
      type: String,
      enum: ["chatbot", "account", "admin"],
      default: "account",
    },
    customerName: {
      type: String,
      default: "",
      trim: true,
    },
    customerEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    customerPhone: {
      type: String,
      default: "",
      trim: true,
    },
    orderId: {
      type: String,
      default: "",
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["open", "in-progress", "waiting-customer", "resolved"],
      default: "open",
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    assignedRole: {
      type: String,
      enum: [
        "",
        "super-admin",
        "brand-growth-manager",
        "operations-manager",
        "catalog-manager",
      ],
      default: "operations-manager",
    },
    resolutionNote: {
      type: String,
      default: "",
      trim: true,
    },
    transcript: {
      type: [supportTranscriptSchema],
      default: [],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        ret.ticketCode = ret.ticketNumber ? `HRSH-${String(ret.ticketNumber).padStart(4, "0")}` : "";
        delete ret._id;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

supportRequestSchema.pre("save", async function assignTicketNumber() {
  if (!this.isNew || this.ticketNumber) {
    return;
  }

  const counter = await Counter.findOneAndUpdate(
    { key: "supportTickets" },
    { $inc: { value: 1 } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  this.ticketNumber = counter.value;
});

module.exports = mongoose.model("SupportRequest", supportRequestSchema);
