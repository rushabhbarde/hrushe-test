const SiteContent = require("../models/SiteContent");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { hasAdminPermission } = require("../config/adminRoles");
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
  mediaType: "image",
  mediaUrl: "/uploads/banners/banner1.png",
  posterImage: "",
});

const LEGACY_HOMEPAGE_BANNER = Object.freeze({
  eyebrow: "Home page banner",
  title: "Minimal. Bold. Ready for launch.",
  description:
    "A clean black-and-white storefront with red accent moments that draw attention exactly where you want it: active navigation, campaign messaging, and purchase actions.",
});

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function mergePlainObjects(baseValue, nextValue) {
  if (nextValue === undefined) {
    return baseValue;
  }

  if (Array.isArray(nextValue)) {
    return nextValue;
  }

  if (!isPlainObject(baseValue) || !isPlainObject(nextValue)) {
    return nextValue;
  }

  const merged = { ...baseValue };

  Object.entries(nextValue).forEach(([key, value]) => {
    merged[key] = mergePlainObjects(baseValue[key], value);
  });

  return merged;
}

function normalizeWorkspaceBanner(banner = {}) {
  const legacyImage = String(banner.desktopImage || banner.mobileImage || "").trim();
  const mediaUrl = String(banner.mediaUrl || legacyImage).trim();
  const inferredMediaType =
    banner.mediaType === "video" || /^data:video\//i.test(mediaUrl) || /\.(mp4|webm|ogg)(\?|#|$)/i.test(mediaUrl)
      ? "video"
      : "image";

  return {
    id: String(banner.id || "").trim(),
    label: String(banner.label || "").trim(),
    title: String(banner.title || "").trim(),
    subtitle: String(banner.subtitle || "").trim(),
    ctaText: String(banner.ctaText || "").trim(),
    ctaLink: String(banner.ctaLink || "").trim(),
    mediaType: inferredMediaType,
    mediaUrl,
    posterImage: String(banner.posterImage || "").trim(),
    desktopImage: String(banner.desktopImage || mediaUrl).trim(),
    mobileImage: String(banner.mobileImage || mediaUrl).trim(),
    enabled: banner.enabled !== false,
    scheduleStart: banner.scheduleStart || null,
    scheduleEnd: banner.scheduleEnd || null,
  };
}

function isBannerScheduledForNow(banner) {
  const now = Date.now();
  const startsAt = banner.scheduleStart ? new Date(banner.scheduleStart).getTime() : null;
  const endsAt = banner.scheduleEnd ? new Date(banner.scheduleEnd).getTime() : null;

  if (Number.isFinite(startsAt) && startsAt > now) {
    return false;
  }

  if (Number.isFinite(endsAt) && endsAt < now) {
    return false;
  }

  return true;
}

function getPublishedWorkspaceBanners(adminWorkspace) {
  const rawBanners = Array.isArray(adminWorkspace?.homeManagement?.banners)
    ? adminWorkspace.homeManagement.banners
    : [];

  return rawBanners
    .map(normalizeWorkspaceBanner)
    .filter((banner) => banner.enabled && isBannerScheduledForNow(banner) && banner.mediaUrl);
}

const adminWorkspacePermissionByKey = {
  homeManagement: "home.manage",
  catalogCategories: "products.edit",
  productMeta: "products.edit",
  orderMeta: "orders.manage",
  customerMeta: "customers.manage",
  coupons: "coupons.manage",
  contentPages: "content.manage",
  mediaLibrary: "media.manage",
  reviewModeration: "reviews.manage",
  websiteSettings: "settings.manage",
  roles: "roles.manage",
  shipping: "shipping.manage",
};

function assertCanUpdateAdminWorkspace(user, patch = {}) {
  Object.keys(patch).forEach((key) => {
    const permission = adminWorkspacePermissionByKey[key] || "settings.manage";

    if (!hasAdminPermission(user, permission)) {
      throw new AppError(`Missing permission: ${permission}`, 403);
    }
  });
}

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
  const publishedBanners = getPublishedWorkspaceBanners(content.adminWorkspace);
  const activeWorkspaceBanner = publishedBanners[0] || null;
  const normalizedHomepageBanner = normalizeHomepageBanner(content.homepageBanner);

  homepageBannerCache = {
    data: {
      ...normalizedHomepageBanner,
      ...(activeWorkspaceBanner
        ? {
            announcementText:
              activeWorkspaceBanner.label || normalizedHomepageBanner.announcementText,
            title: activeWorkspaceBanner.title || normalizedHomepageBanner.title,
            description:
              activeWorkspaceBanner.subtitle || normalizedHomepageBanner.description,
            primaryCtaLabel:
              activeWorkspaceBanner.ctaText || normalizedHomepageBanner.primaryCtaLabel,
            primaryCtaHref:
              activeWorkspaceBanner.ctaLink || normalizedHomepageBanner.primaryCtaHref,
            imageUrl:
              activeWorkspaceBanner.mediaType === "image"
                ? activeWorkspaceBanner.mediaUrl
                : activeWorkspaceBanner.posterImage || normalizedHomepageBanner.imageUrl,
            mediaType: activeWorkspaceBanner.mediaType,
            mediaUrl: activeWorkspaceBanner.mediaUrl,
            posterImage: activeWorkspaceBanner.posterImage,
          }
        : {}),
      banners: publishedBanners,
    },
    timestamp: Date.now(),
  };
  res.set("Cache-Control", "public, max-age=120, stale-while-revalidate=600");
  return res.json(homepageBannerCache.data);
});

const updateHomepageBanner = asyncHandler(async (req, res) => {
  const content = await getSiteContent();
  content.homepageBanner = { ...content.homepageBanner.toObject(), ...req.body };
  await content.save();
  homepageBannerCache = null;

  return res.json(content.homepageBanner);
});

const getAdminWorkspace = asyncHandler(async (req, res) => {
  const content = await getSiteContent();
  return res.json(content.adminWorkspace || {});
});

const updateAdminWorkspace = asyncHandler(async (req, res) => {
  assertCanUpdateAdminWorkspace(req.user, req.body || {});

  const content = await getSiteContent();
  const currentWorkspace =
    content.adminWorkspace && typeof content.adminWorkspace === "object"
      ? content.adminWorkspace
      : {};

  content.adminWorkspace = mergePlainObjects(currentWorkspace, req.body || {});
  await content.save();
  homepageBannerCache = null;

  return res.json(content.adminWorkspace || {});
});

module.exports = {
  getHomepageBanner,
  updateHomepageBanner,
  getAdminWorkspace,
  updateAdminWorkspace,
};
