import type {
  HomepageCard,
  HomepageSection,
  MediaAsset,
} from "@/lib/admin-workspace";

const LEGACY_MISSING_BANNER_PATHS = new Set([
  "/uploads/banners/banner1.png",
  "/uploads/banners/banner2.png",
  "/uploads/banners/shopwomen.png",
  "/uploads/banners/shopmen.png",
]);

export const HOMEPAGE_MEDIA_ASPECT_RATIOS = {
  entryDesktop: "1 / 1",
  entryMobile: "9 / 16",
  heroDesktop: "16 / 9",
  heroMobile: "9 / 16",
  cardDesktop: "3 / 4",
  cardMobile: "1 / 1",
} as const;

export type HomepageMediaIssue = {
  id: string;
  label: string;
  field: "section.image" | "card.image";
  reason: "missing" | "invalid" | "deleted";
};

function stripUrlNoise(value: string) {
  return value.split("#")[0]?.split("?")[0] || value;
}

export function normalizeHomepageMediaUrl(value?: string) {
  return String(value || "").trim();
}

export function isLegacyMissingHomepageMedia(value?: string) {
  return LEGACY_MISSING_BANNER_PATHS.has(stripUrlNoise(normalizeHomepageMediaUrl(value)).toLowerCase());
}

export function isSafeHomepageMediaUrl(value?: string) {
  const url = normalizeHomepageMediaUrl(value);

  if (!url || isLegacyMissingHomepageMedia(url)) {
    return false;
  }

  if (/^(data:|blob:|javascript:)/i.test(url) || url.startsWith("//")) {
    return false;
  }

  if (url.startsWith("/")) {
    return true;
  }

  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

function mediaLibraryContains(url: string, mediaLibrary?: readonly MediaAsset[]) {
  if (!mediaLibrary) {
    return true;
  }

  const normalizedUrl = stripUrlNoise(url);
  return mediaLibrary.some((asset) => stripUrlNoise(asset.url) === normalizedUrl);
}

export function resolveHomepageMediaUrl(
  value?: string,
  { mediaLibrary }: { mediaLibrary?: readonly MediaAsset[] } = {}
) {
  const url = normalizeHomepageMediaUrl(value);

  if (!isSafeHomepageMediaUrl(url)) {
    return "";
  }

  if (url.startsWith("/uploads/") && !mediaLibraryContains(url, mediaLibrary)) {
    return "";
  }

  return url;
}

export function resolveHomepageMediaSource({
  src,
  mobileSrc,
  fallbackSrc,
  mediaLibrary,
}: {
  src?: string;
  mobileSrc?: string;
  fallbackSrc?: string;
  mediaLibrary?: readonly MediaAsset[];
}) {
  const desktopSrc =
    resolveHomepageMediaUrl(src, { mediaLibrary }) ||
    resolveHomepageMediaUrl(fallbackSrc, { mediaLibrary });

  if (!desktopSrc) {
    return null;
  }

  return {
    desktopSrc,
    mobileSrc: resolveHomepageMediaUrl(mobileSrc, { mediaLibrary }) || desktopSrc,
  };
}

function getMediaIssueReason(value?: string, mediaLibrary?: readonly MediaAsset[]): HomepageMediaIssue["reason"] {
  const url = normalizeHomepageMediaUrl(value);

  if (!url) {
    return "missing";
  }

  if (!isSafeHomepageMediaUrl(url)) {
    return "invalid";
  }

  if (url.startsWith("/uploads/") && !mediaLibraryContains(url, mediaLibrary)) {
    return "deleted";
  }

  return "missing";
}

function addCardIssue(
  issues: HomepageMediaIssue[],
  section: HomepageSection,
  card: HomepageCard,
  mediaLibrary?: readonly MediaAsset[]
) {
  if (!card.isVisible || resolveHomepageMediaUrl(card.image, { mediaLibrary })) {
    return;
  }

  issues.push({
    id: `${section.id}:${card.id}:image`,
    label: `${section.label || section.title}: ${card.title}`,
    field: "card.image",
    reason: getMediaIssueReason(card.image, mediaLibrary),
  });
}

export function getHomepageRequiredMediaIssues(
  sections: readonly HomepageSection[],
  { mediaLibrary }: { mediaLibrary?: readonly MediaAsset[] } = {}
) {
  const issues: HomepageMediaIssue[] = [];

  sections.forEach((section) => {
    if (!section.isVisible) {
      return;
    }

    if (section.sectionType === "entry-cards" || section.sectionType === "category-cards") {
      section.cards.forEach((card) => addCardIssue(issues, section, card, mediaLibrary));
      return;
    }

    if (resolveHomepageMediaUrl(section.image, { mediaLibrary })) {
      return;
    }

    issues.push({
      id: `${section.id}:image`,
      label: section.label || section.title,
      field: "section.image",
      reason: getMediaIssueReason(section.image, mediaLibrary),
    });
  });

  return issues;
}
