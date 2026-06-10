const mongoose = require("mongoose");

const slugify = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const reviewSchema = new mongoose.Schema(
  {
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
  },
  {
    timestamps: true,
  }
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
    compareAtPrice: {
      type: Number,
      min: 0,
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
});

module.exports = mongoose.model("Product", productSchema);
