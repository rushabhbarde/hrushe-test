const mongoose = require("mongoose");

const homepageBannerSchema = new mongoose.Schema(
  {
    announcementText: {
      type: String,
      default: "FREE SHIPPING ON SELECTED STYLES",
    },
    eyebrow: { type: String, default: "Home page banner" },
    title: { type: String, default: "Minimal. Bold. Ready for launch." },
    description: {
      type: String,
      default:
        "A clean black-and-white storefront with red accent moments that draw attention exactly where you want it: active navigation, campaign messaging, and purchase actions.",
    },
    primaryCtaLabel: { type: String, default: "Shop now" },
    primaryCtaHref: { type: String, default: "/shop" },
    secondaryCtaLabel: { type: String, default: "View collection" },
    secondaryCtaHref: { type: String, default: "/shop" },
    imageUrl: { type: String, default: "/uploads/banners/banner1.png" },
  },
  { _id: false }
);

const siteContentSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "main",
    },
    homepageBanner: {
      type: homepageBannerSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SiteContent", siteContentSchema);
