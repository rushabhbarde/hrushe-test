import { describe, expect, it } from "vitest";
import {
  HOMEPAGE_MEDIA_ASPECT_RATIOS,
  getHomepageRequiredMediaIssues,
  isLegacyMissingHomepageMedia,
  resolveHomepageMediaSource,
  resolveHomepageMediaUrl,
} from "@/lib/homepage-media";
import {
  defaultHomepageSections,
  type HomepageSection,
  type MediaAsset,
} from "@/lib/admin-workspace";

const mediaLibrary: MediaAsset[] = [
  {
    id: "hero",
    name: "Hero",
    url: "/uploads/home/hero.png",
    folder: "homepage",
    tags: [],
    createdAt: "2026-07-24T00:00:00.000Z",
  },
];

function buildSection(patch: Partial<HomepageSection> = {}): HomepageSection {
  return {
    id: "section",
    audience: "women",
    sectionType: "audience-hero",
    label: "Women hero",
    title: "Women hero",
    subtitle: "",
    description: "",
    ctaText: "",
    ctaLink: "",
    secondaryCtaText: "",
    secondaryCtaLink: "",
    image: "/uploads/home/hero.png",
    mobileImage: "",
    imageAlt: "Hero",
    objectPosition: "center",
    backgroundColor: "dark",
    textColor: "light",
    titleFontSize: "large",
    titlePosition: "bottom-center",
    textAlign: "center",
    cards: [],
    displayOrder: 10,
    isVisible: true,
    publishStart: null,
    publishEnd: null,
    ...patch,
  };
}

describe("homepage media selection", () => {
  it("accepts valid uploaded media", () => {
    expect(resolveHomepageMediaUrl("/uploads/home/hero.png", { mediaLibrary })).toBe("/uploads/home/hero.png");
    expect(resolveHomepageMediaUrl("https://media.hrushe.in/hero.webp")).toBe("https://media.hrushe.in/hero.webp");
  });

  it("returns no source for missing image values", () => {
    expect(resolveHomepageMediaSource({ src: "", mobileSrc: "" })).toBeNull();
  });

  it("rejects invalid media URLs", () => {
    expect(resolveHomepageMediaUrl("javascript:alert(1)")).toBe("");
    expect(resolveHomepageMediaUrl("http://example.com/image.jpg")).toBe("");
    expect(resolveHomepageMediaUrl("//example.com/image.jpg")).toBe("");
  });

  it("treats deleted uploaded media as unavailable when the media library is known", () => {
    expect(resolveHomepageMediaUrl("/uploads/home/deleted.png", { mediaLibrary })).toBe("");
  });

  it("does not preserve missing legacy banner defaults", () => {
    expect(isLegacyMissingHomepageMedia("/uploads/banners/banner1.png")).toBe(true);
    expect(resolveHomepageMediaUrl("/uploads/banners/shopwomen.png")).toBe("");
    expect(
      defaultHomepageSections.some((section) =>
        [section.image, section.mobileImage, ...section.cards.flatMap((card) => [card.image, card.mobileImage])]
          .some(isLegacyMissingHomepageMedia)
      )
    ).toBe(false);
  });

  it("allows an empty workspace to render without media issues", () => {
    expect(getHomepageRequiredMediaIssues([], { mediaLibrary })).toEqual([]);
  });

  it("reports draft workspace media warnings without mutating sections", () => {
    const draftSection = buildSection({ image: "" });
    const issues = getHomepageRequiredMediaIssues([draftSection], { mediaLibrary });

    expect(issues).toEqual([
      {
        id: "section:image",
        label: "Women hero",
        field: "section.image",
        reason: "missing",
      },
    ]);
    expect(draftSection.image).toBe("");
  });

  it("accepts published workspace media when every visible section has media", () => {
    expect(getHomepageRequiredMediaIssues([buildSection()], { mediaLibrary })).toEqual([]);
  });

  it("preserves desktop and mobile aspect-ratio contracts", () => {
    expect(HOMEPAGE_MEDIA_ASPECT_RATIOS.heroDesktop).toBe("16 / 9");
    expect(HOMEPAGE_MEDIA_ASPECT_RATIOS.heroMobile).toBe("9 / 16");
    expect(HOMEPAGE_MEDIA_ASPECT_RATIOS.cardDesktop).toBe("3 / 4");
    expect(HOMEPAGE_MEDIA_ASPECT_RATIOS.cardMobile).toBe("1 / 1");
  });
});
