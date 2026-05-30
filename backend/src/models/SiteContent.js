const mongoose = require("mongoose");

const homepageBannerSchema = new mongoose.Schema(
  {
    announcementText: {
      type: String,
      default: "FREE SHIPPING ON SELECTED STYLES",
    },
    eyebrow: { type: String, default: "New season, everyday essentials" },
    title: { type: String, default: "Elevated basics for everyday dressing." },
    description: {
      type: String,
      default:
        "Discover modern silhouettes, premium fabrics, and versatile staples designed to feel effortless every day.",
    },
    primaryCtaLabel: { type: String, default: "Shop the drop" },
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
    adminWorkspace: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SiteContent", siteContentSchema);
