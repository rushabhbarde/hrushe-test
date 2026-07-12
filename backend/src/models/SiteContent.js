const mongoose = require("mongoose");

const homepageBannerSchema = new mongoose.Schema(
  {
    announcementText: {
      type: String,
      default: "DISPATCHES IN 1–3 BUSINESS DAYS · 7-DAY RETURNS",
    },
    eyebrow: { type: String, default: "Elevated Everyday", maxlength: 80 },
    title: { type: String, default: "Defined Quietly" },
    description: {
      type: String,
      default:
        "Everyday uniforms with clear proportions, honest materials, and repeat-wear construction.",
    },
    primaryCtaLabel: { type: String, default: "Shop Collection" },
    primaryCtaHref: { type: String, default: "/shop" },
    secondaryCtaLabel: { type: String, default: "Read the Story" },
    secondaryCtaHref: { type: String, default: "/story" },
    imageUrl: { type: String, default: "" },
    mediaType: { type: String, enum: ["image", "video"], default: "image" },
    mediaUrl: { type: String, default: "" },
    posterImage: { type: String, default: "" },
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
    adminWorkspaceVersion: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SiteContent", siteContentSchema);
