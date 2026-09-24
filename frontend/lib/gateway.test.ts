import { describe, expect, it } from "vitest";
import type { HomepageCard } from "@/lib/admin-workspace";
import { getGatewayRedirectPath, toGatewayOption } from "@/lib/gateway";

const card = (overrides: Partial<HomepageCard>): HomepageCard => ({
  id: "card",
  title: "Shop Women",
  subtitle: "",
  ctaText: "",
  ctaLink: "/women",
  image: "https://media.hrushe.in/women.png",
  mobileImage: "",
  imageAlt: "",
  objectPosition: "center",
  titleFontSize: "large",
  titlePosition: "bottom-center",
  textAlign: "center",
  isVisible: true,
  ...overrides,
});

describe("gateway options", () => {
  it("derives the side and label from the entry card link", () => {
    expect(toGatewayOption(card({ ctaLink: "/women" }))).toMatchObject({ side: "women", label: "Women", href: "/women" });
    expect(toGatewayOption(card({ title: "Shop Men", ctaLink: "/men/" }))).toMatchObject({ side: "men", label: "Men" });
    expect(toGatewayOption(card({ ctaLink: "/men?ref=home" })).side).toBe("men");
  });

  it("falls back to the card title for other destinations", () => {
    const option = toGatewayOption(card({ title: "Shop Kids", ctaLink: "/collection/kids" }));

    expect(option.side).toBeNull();
    expect(option.label).toBe("Kids");
  });

  it("uses the card title as image alt text when none is set", () => {
    expect(toGatewayOption(card({ imageAlt: "" })).alt).toBe("Shop Women");
  });
});

describe("gateway returning-visitor redirect", () => {
  const base = {
    sideCookie: "men",
    referer: null,
    host: "hrushe.in",
    wantsGateway: false,
    isRscRequest: false,
  };

  it("sends returning visitors arriving from outside to their last side", () => {
    expect(getGatewayRedirectPath(base)).toBe("/men");
    expect(getGatewayRedirectPath({ ...base, sideCookie: "women", referer: "https://www.google.com/" })).toBe("/women");
  });

  it("keeps the gateway for internal navigation, explicit requests and client router fetches", () => {
    expect(getGatewayRedirectPath({ ...base, referer: "https://hrushe.in/men/shop" })).toBeNull();
    expect(getGatewayRedirectPath({ ...base, wantsGateway: true })).toBeNull();
    expect(getGatewayRedirectPath({ ...base, isRscRequest: true })).toBeNull();
  });

  it("ignores missing or tampered side cookies", () => {
    expect(getGatewayRedirectPath({ ...base, sideCookie: undefined })).toBeNull();
    expect(getGatewayRedirectPath({ ...base, sideCookie: "//evil.example" })).toBeNull();
  });
});
