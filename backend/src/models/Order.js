const mongoose = require("mongoose");
const Counter = require("./Counter");
const { paiseToRupees, rupeesToPaise } = require("../utils/money");

const orderProductSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    size: {
      type: String,
      default: "",
      trim: true,
    },
    color: {
      type: String,
      default: "",
      trim: true,
    },
    fit: {
      type: String,
      enum: ["", "Oversize", "Regular"],
      default: "",
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    pricePaise: {
      type: Number,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Order item pricePaise must be an integer.",
      },
      default: undefined,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: "",
      trim: true,
    },
    sku: {
      type: String,
      default: "",
      trim: true,
    },
    inventoryTracked: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const shippingAddressDetailsSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      enum: ["Home", "Work", "Other"],
      default: "Home",
    },
    fullName: {
      type: String,
      default: "",
      trim: true,
    },
    mobile: {
      type: String,
      default: "",
      trim: true,
    },
    pincode: {
      type: String,
      default: "",
      trim: true,
    },
    city: {
      type: String,
      default: "",
      trim: true,
    },
    state: {
      type: String,
      default: "",
      trim: true,
    },
    house: {
      type: String,
      default: "",
      trim: true,
    },
    area: {
      type: String,
      default: "",
      trim: true,
    },
    landmark: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const checkoutLogSchema = new mongoose.Schema(
  {
    event: {
      type: String,
      required: true,
      trim: true,
    },
    source: {
      type: String,
      default: "system",
      trim: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    _id: false,
    timestamps: true,
  }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: Number,
      unique: true,
      sparse: true,
      min: 1,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    products: {
      type: [orderProductSchema],
      default: [],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    subtotalPaise: {
      type: Number,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Order subtotalPaise must be an integer.",
      },
      default: undefined,
    },
    discountPaise: {
      type: Number,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Order discountPaise must be an integer.",
      },
      default: 0,
    },
    shippingPaise: {
      type: Number,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Order shippingPaise must be an integer.",
      },
      default: 0,
    },
    taxPaise: {
      type: Number,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Order taxPaise must be an integer.",
      },
      default: 0,
    },
    totalPaise: {
      type: Number,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Order totalPaise must be an integer.",
      },
      default: undefined,
    },
    refundPaise: {
      type: Number,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Order refundPaise must be an integer.",
      },
      default: 0,
    },
    shippingAddress: {
      type: String,
      required: true,
      trim: true,
    },
    shippingAddressDetails: {
      type: shippingAddressDetailsSchema,
      default: () => ({}),
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    customerPhone: {
      type: String,
      default: "",
      trim: true,
    },
    paymentMethod: {
      type: String,
      required: true,
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "initiated", "paid", "failed", "cancelled"],
      default: "pending",
    },
    checkoutProvider: {
      type: String,
      default: "manual",
      trim: true,
    },
    checkoutSessionId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    paymentProviderPaymentId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    paymentCapturedAt: {
      type: Date,
      default: null,
    },
    paymentConfirmationStartedAt: {
      type: Date,
      default: null,
    },
    paymentConfirmationLockId: {
      type: String,
      default: "",
      trim: true,
    },
    checkoutUrl: {
      type: String,
      default: "",
      trim: true,
    },
    courierName: {
      type: String,
      default: "",
      trim: true,
    },
    trackingId: {
      type: String,
      default: "",
      trim: true,
    },
    trackingUrl: {
      type: String,
      default: "",
      trim: true,
    },
    orderStatus: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Packed",
        "Shipped",
        "Out for delivery",
        "Delivered",
        "Cancelled",
        "Returned",
      ],
      default: "Pending",
    },
    checkoutLogs: {
      type: [checkoutLogSchema],
      default: [],
    },
    inventoryReservationStatus: {
      type: String,
      enum: ["none", "reserved", "committed", "released"],
      default: "none",
    },
    inventoryReservationExpiresAt: {
      type: Date,
      default: null,
    },
    paymentReconciliationStartedAt: {
      type: Date,
      default: null,
    },
    paymentReconciliationResultCode: {
      type: String,
      default: "",
      trim: true,
    },
    paymentReconciliationLockId: {
      type: String,
      default: "",
      trim: true,
    },
    paymentReconciliationActorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        ret.orderNumber = ret.orderNumber || null;
        delete ret._id;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

orderSchema.pre("save", async function assignOrderNumber() {
  if (!this.isNew || this.orderNumber) {
    return;
  }

  const counter = await Counter.findOneAndUpdate(
    { key: "orders" },
    { $inc: { value: 1 } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  this.orderNumber = counter.value;
});

orderSchema.pre("validate", function normalizeMoneyFields() {
  this.products = (this.products || []).map((item) => {
    if (item.pricePaise === undefined || item.pricePaise === null) {
      item.pricePaise = rupeesToPaise(item.price);
    } else {
      item.price = paiseToRupees(item.pricePaise);
    }
    return item;
  });

  if (this.totalPaise === undefined || this.totalPaise === null) {
    this.totalPaise = rupeesToPaise(this.totalAmount);
  } else {
    this.totalAmount = paiseToRupees(this.totalPaise);
  }

  if (this.subtotalPaise === undefined || this.subtotalPaise === null) {
    this.subtotalPaise = this.products.reduce(
      (sum, item) => sum + Number(item.pricePaise || 0) * Number(item.quantity || 0),
      0
    );
  }
});

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });
orderSchema.index({ customerEmail: 1, createdAt: -1 });
orderSchema.index({ inventoryReservationStatus: 1, inventoryReservationExpiresAt: 1 });
orderSchema.index({ paymentReconciliationResultCode: 1, createdAt: -1 });
orderSchema.index({ paymentReconciliationStartedAt: 1 });
orderSchema.index({ paymentConfirmationStartedAt: 1 });
orderSchema.index({ totalPaise: 1 });

module.exports = mongoose.model("Order", orderSchema);
