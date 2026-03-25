const SiteContent = require("../models/SiteContent");
const asyncHandler = require("../utils/asyncHandler");

const getSiteContent = async () => {
  let content = await SiteContent.findOne({ key: "main" });

  if (!content) {
    content = await SiteContent.create({ key: "main" });
  }

  return content;
};

const getHomepageBanner = asyncHandler(async (req, res) => {
  const content = await getSiteContent();
  return res.json(content.homepageBanner);
});

const updateHomepageBanner = asyncHandler(async (req, res) => {
  const content = await getSiteContent();
  content.homepageBanner = { ...content.homepageBanner.toObject(), ...req.body };
  await content.save();

  return res.json(content.homepageBanner);
});

module.exports = { getHomepageBanner, updateHomepageBanner };
