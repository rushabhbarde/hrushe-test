const SiteContent = require("../models/SiteContent");
const asyncHandler = require("../utils/asyncHandler");
let homepageBannerCache = null;
const HOMEPAGE_BANNER_CACHE_TTL = 2 * 60 * 1000;

const CURRENT_HOMEPAGE_BANNER = Object.freeze({
  announcementText: "FREE SHIPPING ON SELECTED STYLES",
  eyebrow: "New season, everyday essentials",
  title: "Elevated basics for everyday dressing.",
  description:
    "Discover modern silhouettes, premium fabrics, and versatile staples designed to feel effortless every day.",
  primaryCtaLabel: "Shop the drop",
  primaryCtaHref: "/shop",
  secondaryCtaLabel: "View collection",
  secondaryCtaHref: "/shop",
  imageUrl: "/uploads/banners/banner1.png",
});

const LEGACY_HOMEPAGE_BANNER = Object.freeze({
  eyebrow: "Home page banner",
  title: "Minimal. Bold. Ready for launch.",
  description:
    "A clean black-and-white storefront with red accent moments that draw attention exactly where you want it: active navigation, campaign messaging, and purchase actions.",
});

function normalizeHomepageBanner(homepageBanner) {
  const banner = homepageBanner?.toObject ? homepageBanner.toObject() : homepageBanner || {};

  return {
    ...CURRENT_HOMEPAGE_BANNER,
    ...banner,
    eyebrow:
      banner.eyebrow === LEGACY_HOMEPAGE_BANNER.eyebrow
        ? CURRENT_HOMEPAGE_BANNER.eyebrow
        : (banner.eyebrow ?? CURRENT_HOMEPAGE_BANNER.eyebrow),
    title:
      banner.title === LEGACY_HOMEPAGE_BANNER.title
        ? CURRENT_HOMEPAGE_BANNER.title
        : (banner.title ?? CURRENT_HOMEPAGE_BANNER.title),
    description:
      banner.description === LEGACY_HOMEPAGE_BANNER.description
        ? CURRENT_HOMEPAGE_BANNER.description
        : (banner.description ?? CURRENT_HOMEPAGE_BANNER.description),
  };
}

const getSiteContent = async () => {
  let content = await SiteContent.findOne({ key: "main" });

  if (!content) {
    content = await SiteContent.create({ key: "main" });
  }

  const existingBanner = content.homepageBanner?.toObject
    ? content.homepageBanner.toObject()
    : {};
  const normalizedBanner = normalizeHomepageBanner(existingBanner);
  const homepageBannerChanged = Object.keys(normalizedBanner).some(
    (key) => normalizedBanner[key] !== existingBanner[key]
  );

  if (homepageBannerChanged) {
    content.homepageBanner = normalizedBanner;
    await content.save();
  }

  return content;
};

const getHomepageBanner = asyncHandler(async (req, res) => {
  if (
    homepageBannerCache &&
    Date.now() - homepageBannerCache.timestamp < HOMEPAGE_BANNER_CACHE_TTL
  ) {
    res.set("Cache-Control", "public, max-age=120, stale-while-revalidate=600");
    return res.json(homepageBannerCache.data);
  }

  const content = await getSiteContent();
  homepageBannerCache = {
    data: content.homepageBanner,
    timestamp: Date.now(),
  };
  res.set("Cache-Control", "public, max-age=120, stale-while-revalidate=600");
  return res.json(content.homepageBanner);
});

const updateHomepageBanner = asyncHandler(async (req, res) => {
  const content = await getSiteContent();
  content.homepageBanner = { ...content.homepageBanner.toObject(), ...req.body };
  await content.save();
  homepageBannerCache = {
    data: content.homepageBanner,
    timestamp: Date.now(),
  };

  return res.json(content.homepageBanner);
});

module.exports = { getHomepageBanner, updateHomepageBanner };
