import type { Product } from "@/lib/catalog";
import type { AdminBanner } from "@/lib/admin-workspace";

export type HomepageBanner = {
  announcementText: string;
  eyebrow: string;
  title: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  imageUrl: string;
  mediaType?: "image" | "video";
  mediaUrl?: string;
  posterImage?: string;
  banners?: AdminBanner[];
};

export const defaultProducts: Product[] = [];

export const defaultHomepageBanner: HomepageBanner = {
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
  banners: [],
};
