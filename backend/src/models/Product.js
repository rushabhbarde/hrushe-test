const mongoose = require("mongoose");
const { getPaiseValue, paiseToRupees, rupeesToPaise } = require("../utils/money");

const slugify = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewerName: {
      type: String,
      required: true,
      trim: true,
    },
    quote: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    photo: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "hidden"],
      default: undefined,
    },
    verifiedPurchase: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const productVariantSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
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
      default: "",
      trim: true,
    },
    stock: {
      type: Number,
      min: 0,
      default: 0,
    },
    reserved: {
      type: Number,
      min: 0,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const productVideoSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: "",
      trim: true,
    },
    title: {
      type: String,
      default: "",
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    posterUrl: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const productSizeMeasurementSchema = new mongoose.Schema(
  {
    size: {
      type: String,
      required: true,
      trim: true,
    },
    chest: {
      type: String,
      default: "",
      trim: true,
    },
    length: {
      type: String,
      default: "",
      trim: true,
    },
    shoulder: {
      type: String,
      default: "",
      trim: true,
    },
    sleeve: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
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
        message: "Product pricePaise must be an integer.",
      },
      default: undefined,
    },
    compareAtPrice: {
      type: Number,
      min: 0,
    },
    compareAtPricePaise: {
      type: Number,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Product compareAtPricePaise must be an integer.",
      },
      default: undefined,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    categories: {
      type: [String],
      default: [],
    },
    sizes: {
      type: [String],
      default: [],
    },
    colors: {
      type: [String],
      default: [],
    },
    images: {
      type: [String],
      default: [],
    },
    galleryImages: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: [
        "Active",
        "Draft",
        "Hidden",
        "Sold Out",
        "active",
        "draft",
        "hidden",
        "archived",
        "sold_out",
      ],
      default: undefined,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
    archivedFromStatus: {
      type: String,
      default: "",
      trim: true,
    },
    fitType: {
      type: String,
      enum: ["Oversized", "Regular", ""],
      default: "",
    },
    gender: {
      type: String,
      enum: ["Men", "Women", "Unisex", ""],
      default: "Unisex",
    },
    collectionLabels: {
      type: [String],
      default: [],
    },
    trackInventory: {
      type: Boolean,
      default: false,
    },
    variants: {
      type: [productVariantSchema],
      default: [],
    },
    fabric: {
      type: String,
      default: "",
      trim: true,
    },
    gsm: {
      type: String,
      default: "",
      trim: true,
    },
    cottonType: {
      type: String,
      default: "",
      trim: true,
    },
    feel: {
      type: String,
      default: "",
      trim: true,
    },
    weight: {
      type: String,
      default: "",
      trim: true,
    },
    washCare: {
      type: String,
      default: "",
      trim: true,
    },
    qualityNote: {
      type: String,
      default: "",
      trim: true,
    },
    fitNote: {
      type: String,
      default: "",
      trim: true,
    },
    modelHeight: {
      type: String,
      default: "",
      trim: true,
    },
    modelWornSize: {
      type: String,
      default: "",
      trim: true,
    },
    returnEligible: {
      type: Boolean,
      default: false,
    },
    sizeGuide: {
      type: [productSizeMeasurementSchema],
      default: [],
    },
    videos: {
      type: [productVideoSchema],
      default: [],
    },
    featured: {
      type: Boolean,
      default: false,
    },
    bestSeller: {
      type: Boolean,
      default: false,
    },
    newIn: {
      type: Boolean,
      default: false,
    },
    newArrival: {
      type: Boolean,
      default: false,
    },
    reviews: {
      type: [reviewSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

productSchema.index({
  name: "text",
  description: "text",
  category: "text",
  categories: "text",
  colors: "text",
  fabric: "text",
  gsm: "text",
  cottonType: "text",
  feel: "text",
  weight: "text",
  washCare: "text",
  qualityNote: "text",
});

productSchema.pre("validate", function productPreValidate() {
  if (this.name && (!this.slug || this.isModified("name"))) {
    this.slug = slugify(this.slug || this.name);
  } else if (this.slug) {
    this.slug = slugify(this.slug);
  }

  if (this.trackInventory) {
    const skus = this.variants.map((variant) => variant.sku).filter(Boolean);
    if (new Set(skus).size !== skus.length) {
      this.invalidate("variants", "Variant SKUs must be unique within a product");
    }
  }

  if (this.pricePaise === undefined || this.pricePaise === null) {
    this.pricePaise = rupeesToPaise(this.price);
  } else {
    this.price = paiseToRupees(this.pricePaise);
  }

  if (
    this.compareAtPrice !== undefined &&
    this.compareAtPrice !== null &&
    (this.compareAtPricePaise === undefined || this.compareAtPricePaise === null)
  ) {
    this.compareAtPricePaise = rupeesToPaise(this.compareAtPrice);
  } else if (this.compareAtPricePaise !== undefined && this.compareAtPricePaise !== null) {
    this.compareAtPrice = paiseToRupees(this.compareAtPricePaise);
  }

  if (
    this.compareAtPricePaise !== undefined &&
    this.compareAtPricePaise !== null &&
    this.compareAtPricePaise <= getPaiseValue(this, "pricePaise", "price")
  ) {
    this.compareAtPrice = undefined;
    this.compareAtPricePaise = undefined;
  }
});

productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ category: 1, status: 1, createdAt: -1 });
productSchema.index({ featured: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Product", productSchema);
