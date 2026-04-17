const SiteContent = require("../models/SiteContent");
const asyncHandler = require("../utils/asyncHandler");
let homepageBannerCache = null;
const HOMEPAGE_BANNER_CACHE_TTL = 2 * 60 * 1000;

const getSiteContent = async () => {
  let content = await SiteContent.findOne({ key: "main" });

  if (!content) {
    content = await SiteContent.create({ key: "main" });
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
