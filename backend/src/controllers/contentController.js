const SiteContent = require("../models/SiteContent");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { hasAdminPermission } = require("../config/adminRoles");
const { recordAuditLog } = require("../utils/auditLog");
let homepageBannerCache = null;
const HOMEPAGE_BANNER_CACHE_TTL = 2 * 60 * 1000;

const CURRENT_HOMEPAGE_BANNER = Object.freeze({
  announcementText: "DISPATCHES IN 1–3 BUSINESS DAYS · 7-DAY RETURNS",
  eyebrow: "Elevated Everyday",
  title: "Defined Quietly",
  description:
    "Everyday uniforms with clear proportions, honest materials, and repeat-wear construction.",
  primaryCtaLabel: "Shop Collection",
  primaryCtaHref: "/shop",
  secondaryCtaLabel: "Read the Story",
  secondaryCtaHref: "/story",
  imageUrl: "",
  mediaType: "image",
  mediaUrl: "",
  posterImage: "",
});

const PUBLIC_WEBSITE_SETTINGS_DEFAULTS = Object.freeze({
  brandName: "HRUSHE",
  contactEmail: "team@hrushe.in",
  contactPhone: "+91 91128 54988",
  supportWhatsapp: "+91 91128 54988",
  instagramUrl: "https://instagram.com/hrushe.in",
  facebookUrl: "",
  pinterestUrl: "",
});

const LEGACY_HOMEPAGE_BANNER = Object.freeze({
  eyebrow: "Home page banner",
  title: "Minimal. Bold. Ready for launch.",
  description:
    "A clean black-and-white storefront with red accent moments that draw attention exactly where you want it: active navigation, campaign messaging, and purchase actions.",
});

const LEGACY_STORE_COPY = Object.freeze({
  eyebrow: "New season, everyday essentials",
  title: "Elevated basics for everyday dressing.",
  description:
    "Discover modern silhouettes, premium fabrics, and versatile staples designed to feel effortless every day.",
  primaryCtaLabel: "Shop the drop",
  secondaryCtaLabel: "View collection",
});

const LEGACY_WORKSPACE_SUBTITLES = new Map([
  [
    "Launch premium hero stories across desktop and mobile with the same quiet luxury tone as the storefront.",
    "A considered edit of modern layers, calm colour, and everyday ease.",
  ],
  [
    "Use scheduling to line up drops, campaigns, and editorial homepage swaps without touching code.",
    "Relaxed proportions and understated essentials for off-duty dressing.",
  ],
]);

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
  const rawMediaUrl = String(banner.mediaUrl || legacyImage).trim();
  const placeholderMedia = /^\/uploads\/banners\/banner[12]\.png$/i.test(rawMediaUrl);
  const mediaUrl = hasEmbeddedMedia(rawMediaUrl) || placeholderMedia ? "" : rawMediaUrl;
  const inferredMediaType =
    banner.mediaType === "video" || /^data:video\//i.test(mediaUrl) || /\.(mp4|webm|ogg)(\?|#|$)/i.test(mediaUrl)
      ? "video"
      : "image";

  return {
    id: String(banner.id || "").trim(),
    label: String(banner.label || "").trim(),
    title: String(banner.title || "").trim(),
    subtitle:
      LEGACY_WORKSPACE_SUBTITLES.get(String(banner.subtitle || "").trim()) ||
      String(banner.subtitle || "").trim(),
    ctaText: String(banner.ctaText || "").trim(),
    ctaLink: String(banner.ctaLink || "").trim(),
    mediaType: inferredMediaType,
    mediaUrl,
    posterImage: hasEmbeddedMedia(banner.posterImage)
      ? ""
      : String(banner.posterImage || "").trim(),
    desktopImage: String(banner.desktopImage || mediaUrl).trim(),
    mobileImage: String(banner.mobileImage || mediaUrl).trim(),
    enabled: !placeholderMedia && banner.enabled !== false,
    scheduleStart: banner.scheduleStart || null,
    scheduleEnd: banner.scheduleEnd || null,
  };
}

function hasEmbeddedMedia(value) {
  return /^data:/i.test(String(value || ""));
}

function isSafeContentUrl(value, { navigation = false } = {}) {
  const url = String(value || "").trim();
  if (!url) return true;
  if (url.startsWith("/") && !url.startsWith("//")) return true;
  if (!navigation) return /^https:\/\//i.test(url);
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

function assertBannerIsValid(banner = {}) {
  const mediaUrls = [
    banner.mediaUrl,
    banner.imageUrl,
    banner.desktopImage,
    banner.mobileImage,
    banner.posterImage,
  ].filter(Boolean);
  if (mediaUrls.some((url) => !isSafeContentUrl(url))) {
    throw new AppError("Banner media must use an HTTPS or site-relative URL.", 400);
  }

  const ctaLinks = [banner.ctaLink, banner.primaryCtaHref, banner.secondaryCtaHref].filter(Boolean);
  if (ctaLinks.some((url) => !isSafeContentUrl(url, { navigation: true }))) {
    throw new AppError("Banner links must use an HTTPS or site-relative URL.", 400);
  }

  const textLimits = [
    [banner.label || banner.eyebrow, 80, "overline"],
    [banner.title, 160, "title"],
    [banner.subtitle || banner.description, 600, "description"],
    [banner.ctaText || banner.primaryCtaLabel, 80, "CTA label"],
  ];
  for (const [value, limit, label] of textLimits) {
    if (String(value || "").length > limit) {
      throw new AppError(`Banner ${label} must be ${limit} characters or fewer.`, 400);
    }
  }

  const startsAt = banner.scheduleStart ? new Date(banner.scheduleStart).getTime() : null;
  const endsAt = banner.scheduleEnd ? new Date(banner.scheduleEnd).getTime() : null;
  if ((banner.scheduleStart && !Number.isFinite(startsAt)) || (banner.scheduleEnd && !Number.isFinite(endsAt))) {
    throw new AppError("Banner schedule contains an invalid date.", 400);
  }
  if (Number.isFinite(startsAt) && Number.isFinite(endsAt) && endsAt <= startsAt) {
    throw new AppError("Banner end date must be after its start date.", 400);
  }
  if (banner.enabled === true && !String(banner.mediaUrl || banner.imageUrl || banner.desktopImage || "").trim()) {
    throw new AppError("Enabled banners require uploaded media.", 400);
  }
}

const APPROVED_HOMEPAGE_SECTION_TYPES = new Set([
  "entry-cards",
  "audience-hero",
  "category-cards",
  "sale-banner",
]);
const APPROVED_HOMEPAGE_AUDIENCES = new Set(["home", "women", "men"]);
const APPROVED_TEXT_POSITIONS = new Set([
  "top-left",
  "top-center",
  "top-right",
  "center-left",
  "center",
  "center-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
]);
const APPROVED_TEXT_ALIGNMENTS = new Set(["left", "center", "right"]);
const APPROVED_FONT_SIZES = new Set(["small", "medium", "large"]);

function assertHomepageDateRange(record = {}, label = "section") {
  const startsAt = record.publishStart ? new Date(record.publishStart).getTime() : null;
  const endsAt = record.publishEnd ? new Date(record.publishEnd).getTime() : null;

  if ((record.publishStart && !Number.isFinite(startsAt)) || (record.publishEnd && !Number.isFinite(endsAt))) {
    throw new AppError(`Homepage ${label} schedule contains an invalid date.`, 400);
  }
  if (Number.isFinite(startsAt) && Number.isFinite(endsAt) && endsAt <= startsAt) {
    throw new AppError(`Homepage ${label} end date must be after its start date.`, 400);
  }
}

function assertHomepageCardIsValid(card = {}) {
  [
    card.image,
    card.mobileImage,
  ].filter(Boolean).forEach((url) => {
    if (hasEmbeddedMedia(url) || !isSafeContentUrl(url)) {
      throw new AppError("Homepage card images must use an HTTPS or site-relative URL.", 400);
    }
  });

  if (card.ctaLink && !isSafeContentUrl(card.ctaLink, { navigation: true })) {
    throw new AppError("Homepage card links must use an HTTPS or site-relative URL.", 400);
  }

  if (card.titleFontSize && !APPROVED_FONT_SIZES.has(card.titleFontSize)) {
    throw new AppError("Homepage card font size must use an approved preset.", 400);
  }
  if (card.titlePosition && !APPROVED_TEXT_POSITIONS.has(card.titlePosition)) {
    throw new AppError("Homepage card title position must use an approved preset.", 400);
  }
  if (card.textAlign && !APPROVED_TEXT_ALIGNMENTS.has(card.textAlign)) {
    throw new AppError("Homepage card alignment must use an approved preset.", 400);
  }

  for (const [value, limit, label] of [
    [card.title, 120, "title"],
    [card.subtitle, 160, "subtitle"],
    [card.ctaText, 80, "CTA label"],
    [card.imageAlt, 180, "image alt text"],
  ]) {
    if (String(value || "").length > limit) {
      throw new AppError(`Homepage card ${label} must be ${limit} characters or fewer.`, 400);
    }
  }
}

function assertHomepageSectionIsValid(section = {}) {
  if (section.sectionType && !APPROVED_HOMEPAGE_SECTION_TYPES.has(section.sectionType)) {
    throw new AppError("Homepage section type must use an approved preset.", 400);
  }
  if (section.audience && !APPROVED_HOMEPAGE_AUDIENCES.has(section.audience)) {
    throw new AppError("Homepage section audience must use an approved preset.", 400);
  }
  if (section.titleFontSize && !APPROVED_FONT_SIZES.has(section.titleFontSize)) {
    throw new AppError("Homepage section font size must use an approved preset.", 400);
  }
  if (section.titlePosition && !APPROVED_TEXT_POSITIONS.has(section.titlePosition)) {
    throw new AppError("Homepage section title position must use an approved preset.", 400);
  }
  if (section.textAlign && !APPROVED_TEXT_ALIGNMENTS.has(section.textAlign)) {
    throw new AppError("Homepage section alignment must use an approved preset.", 400);
  }

  [
    section.image,
    section.mobileImage,
  ].filter(Boolean).forEach((url) => {
    if (hasEmbeddedMedia(url) || !isSafeContentUrl(url)) {
      throw new AppError("Homepage section images must use an HTTPS or site-relative URL.", 400);
    }
  });

  [section.ctaLink, section.secondaryCtaLink].filter(Boolean).forEach((url) => {
    if (!isSafeContentUrl(url, { navigation: true })) {
      throw new AppError("Homepage section links must use an HTTPS or site-relative URL.", 400);
    }
  });

  for (const [value, limit, label] of [
    [section.label, 120, "label"],
    [section.title, 160, "title"],
    [section.subtitle, 240, "subtitle"],
    [section.description, 600, "description"],
    [section.ctaText, 80, "CTA label"],
    [section.secondaryCtaText, 80, "secondary CTA label"],
    [section.imageAlt, 180, "image alt text"],
  ]) {
    if (String(value || "").length > limit) {
      throw new AppError(`Homepage section ${label} must be ${limit} characters or fewer.`, 400);
    }
  }

  assertHomepageDateRange(section);

  if (Array.isArray(section.cards)) {
    if (section.cards.length > 24) {
      throw new AppError("A homepage card section can contain at most 24 cards.", 400);
    }
    section.cards.forEach(assertHomepageCardIsValid);
  }
}

function assertHomepageSectionsAreValid(sections = []) {
  if (!Array.isArray(sections)) {
    throw new AppError("Homepage sections must be an array.", 400);
  }
  if (sections.length > 40) {
    throw new AppError("Homepage management can contain at most 40 sections.", 400);
  }
  sections.forEach(assertHomepageSectionIsValid);
}

function assertWebsiteSettingsAreValid(settings = {}) {
  if (String(settings.brandName || "").trim().length > 80) {
    throw new AppError("Brand name must be 80 characters or fewer.", 400);
  }
  if (
    settings.contactEmail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(settings.contactEmail).trim())
  ) {
    throw new AppError("Enter a valid contact email address.", 400);
  }
  for (const [field, label] of [
    [settings.contactPhone, "contact phone"],
    [settings.supportWhatsapp, "WhatsApp number"],
  ]) {
    const digits = String(field || "").replace(/\D/g, "");
    if (field && (digits.length < 10 || digits.length > 15)) {
      throw new AppError(`Enter a valid ${label}.`, 400);
    }
  }
  for (const value of [settings.instagramUrl, settings.facebookUrl, settings.pinterestUrl]) {
    if (value && !isSafeContentUrl(value, { navigation: true })) {
      throw new AppError("Social links must use HTTPS.", 400);
    }
  }
}

function assertWorkspaceMediaIsStorable(patch = {}) {
  const banners = Array.isArray(patch?.homeManagement?.banners)
    ? patch.homeManagement.banners
    : [];
  const sections = Array.isArray(patch?.homeManagement?.sections)
    ? patch.homeManagement.sections
    : [];

  if (
    [
      patch?.homepageBanner?.mediaUrl,
      patch?.homepageBanner?.imageUrl,
      patch?.homepageBanner?.posterImage,
    ].some(hasEmbeddedMedia) ||
    banners.some((banner) =>
      [
        banner?.mediaUrl,
        banner?.desktopImage,
        banner?.mobileImage,
        banner?.posterImage,
      ].some(hasEmbeddedMedia)
    ) ||
    sections.some((section) =>
      [
        section?.image,
        section?.mobileImage,
        ...(Array.isArray(section?.cards)
          ? section.cards.flatMap((card) => [card?.image, card?.mobileImage])
          : []),
      ].some(hasEmbeddedMedia)
    )
  ) {
    throw new AppError(
      "Embedded base64/data URI media is not supported. Upload media first and save its URL.",
      400
    );
  }

  if (patch.homepageBanner) {
    assertBannerIsValid(patch.homepageBanner);
  }
  banners.forEach(assertBannerIsValid);
  if (Object.prototype.hasOwnProperty.call(patch?.homeManagement || {}, "sections")) {
    assertHomepageSectionsAreValid(sections);
  }
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

  const normalized = {
    ...CURRENT_HOMEPAGE_BANNER,
    ...banner,
    eyebrow:
      banner.eyebrow === LEGACY_HOMEPAGE_BANNER.eyebrow ||
      banner.eyebrow === "Everyday uniforms" ||
      banner.eyebrow === LEGACY_STORE_COPY.eyebrow
        ? CURRENT_HOMEPAGE_BANNER.eyebrow
        : (banner.eyebrow ?? CURRENT_HOMEPAGE_BANNER.eyebrow),
    title:
      banner.title === LEGACY_HOMEPAGE_BANNER.title ||
      banner.title === LEGACY_STORE_COPY.title
        ? CURRENT_HOMEPAGE_BANNER.title
        : (banner.title ?? CURRENT_HOMEPAGE_BANNER.title),
    description:
      banner.description === LEGACY_HOMEPAGE_BANNER.description ||
      banner.description ===
        "Everyday uniforms with clear proportions, honest materials, and repeat-wear construction." ||
      banner.description === LEGACY_STORE_COPY.description
        ? CURRENT_HOMEPAGE_BANNER.description
        : (banner.description ?? CURRENT_HOMEPAGE_BANNER.description),
    primaryCtaLabel:
      banner.primaryCtaLabel === LEGACY_STORE_COPY.primaryCtaLabel
        ? CURRENT_HOMEPAGE_BANNER.primaryCtaLabel
        : (banner.primaryCtaLabel ?? CURRENT_HOMEPAGE_BANNER.primaryCtaLabel),
    secondaryCtaLabel:
      banner.secondaryCtaLabel === LEGACY_STORE_COPY.secondaryCtaLabel
        ? CURRENT_HOMEPAGE_BANNER.secondaryCtaLabel
        : (banner.secondaryCtaLabel ?? CURRENT_HOMEPAGE_BANNER.secondaryCtaLabel),
    secondaryCtaHref:
      (banner.secondaryCtaLabel === LEGACY_STORE_COPY.secondaryCtaLabel ||
        banner.secondaryCtaLabel === CURRENT_HOMEPAGE_BANNER.secondaryCtaLabel) &&
      banner.secondaryCtaHref === "/shop"
        ? CURRENT_HOMEPAGE_BANNER.secondaryCtaHref
        : (banner.secondaryCtaHref ?? CURRENT_HOMEPAGE_BANNER.secondaryCtaHref),
  };

  ["imageUrl", "mediaUrl", "posterImage"].forEach((key) => {
    if (
      hasEmbeddedMedia(normalized[key]) ||
      /^\/uploads\/banners\/banner[12]\.png$/i.test(String(normalized[key] || ""))
    ) {
      normalized[key] = CURRENT_HOMEPAGE_BANNER[key];
    }
  });

  return normalized;
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

  let contentChanged = homepageBannerChanged;
  if (homepageBannerChanged) {
    content.homepageBanner = normalizedBanner;
  }

  const workspace = content.adminWorkspace || {};
  const rawWorkspaceBanners = Array.isArray(workspace?.homeManagement?.banners)
    ? workspace.homeManagement.banners
    : [];
  const normalizedWorkspaceBanners = rawWorkspaceBanners.map(normalizeWorkspaceBanner);
  if (JSON.stringify(rawWorkspaceBanners) !== JSON.stringify(normalizedWorkspaceBanners)) {
    content.adminWorkspace = {
      ...workspace,
      homeManagement: {
        ...(workspace.homeManagement || {}),
        banners: normalizedWorkspaceBanners,
      },
    };
    contentChanged = true;
  }

  if (contentChanged) {
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
    },
    timestamp: Date.now(),
  };
  res.set("Cache-Control", "public, max-age=120, stale-while-revalidate=600");
  return res.json(homepageBannerCache.data);
});

const getHomepageManagement = asyncHandler(async (req, res) => {
  const content = await getSiteContent();
  const homeManagement =
    content.adminWorkspace?.homeManagement && typeof content.adminWorkspace.homeManagement === "object"
      ? content.adminWorkspace.homeManagement
      : {};
  const hasCustomSections = Array.isArray(homeManagement.sections);
  const sections = hasCustomSections ? homeManagement.sections : [];

  res.set("Cache-Control", "public, max-age=120, stale-while-revalidate=600");
  return res.json({
    sections,
    lastPublishedAt: homeManagement.lastPublishedAt || null,
    hasCustomSections,
  });
});

const getPublicWebsiteSettings = asyncHandler(async (req, res) => {
  const content = await getSiteContent();
  const settings = content.adminWorkspace?.websiteSettings || {};
  const safeHttpsUrl = (value) => {
    try {
      const url = new URL(String(value || ""));
      return url.protocol === "https:" ? url.toString() : "";
    } catch {
      return "";
    }
  };
  const safePhone = (value, fallback) => {
    const normalized = String(value || "").trim();
    const digits = normalized.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 15 && digits !== "919000000000"
      ? normalized
      : fallback;
  };

  res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=1800");
  return res.json({
    brandName: String(settings.brandName || PUBLIC_WEBSITE_SETTINGS_DEFAULTS.brandName).slice(0, 80),
    contactEmail: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(settings.contactEmail || ""))
      ? String(settings.contactEmail).toLowerCase()
      : PUBLIC_WEBSITE_SETTINGS_DEFAULTS.contactEmail,
    contactPhone: safePhone(settings.contactPhone, PUBLIC_WEBSITE_SETTINGS_DEFAULTS.contactPhone).slice(0, 30),
    supportWhatsapp: safePhone(settings.supportWhatsapp, PUBLIC_WEBSITE_SETTINGS_DEFAULTS.supportWhatsapp).slice(0, 30),
    instagramUrl:
      String(settings.instagramUrl || "").replace(/\/$/, "") === "https://instagram.com/hrushe"
        ? PUBLIC_WEBSITE_SETTINGS_DEFAULTS.instagramUrl
        : safeHttpsUrl(settings.instagramUrl) || PUBLIC_WEBSITE_SETTINGS_DEFAULTS.instagramUrl,
    facebookUrl: safeHttpsUrl(settings.facebookUrl),
    pinterestUrl: safeHttpsUrl(settings.pinterestUrl),
  });
});

const updateHomepageBanner = asyncHandler(async (req, res) => {
  assertWorkspaceMediaIsStorable({ homepageBanner: req.body });
  assertBannerIsValid(req.body);

  const content = await getSiteContent();
  content.homepageBanner = { ...content.homepageBanner.toObject(), ...req.body };
  await content.save();
  homepageBannerCache = null;
  await recordAuditLog(req, "homepage.publish", { type: "site-content", id: content._id });

  return res.json(content.homepageBanner);
});

const getAdminWorkspace = asyncHandler(async (req, res) => {
  const content = await getSiteContent();
  return res.json(content.adminWorkspace || {});
});

const updateAdminWorkspace = asyncHandler(async (req, res) => {
  assertCanUpdateAdminWorkspace(req.user, req.body || {});
  assertWorkspaceMediaIsStorable(req.body || {});
  if (req.body?.websiteSettings) {
    assertWebsiteSettingsAreValid(req.body.websiteSettings);
  }

  const content = await getSiteContent();
  const currentWorkspace =
    content.adminWorkspace && typeof content.adminWorkspace === "object"
      ? content.adminWorkspace
      : {};

  content.adminWorkspace = mergePlainObjects(currentWorkspace, req.body || {});
  await content.save();
  homepageBannerCache = null;

  if (Object.prototype.hasOwnProperty.call(req.body || {}, "homeManagement")) {
    await recordAuditLog(req, "homepage.publish", { type: "site-content", id: content._id });
  }

  return res.json(content.adminWorkspace || {});
});

module.exports = {
  getHomepageBanner,
  getHomepageManagement,
  getPublicWebsiteSettings,
  updateHomepageBanner,
  getAdminWorkspace,
  updateAdminWorkspace,
};
