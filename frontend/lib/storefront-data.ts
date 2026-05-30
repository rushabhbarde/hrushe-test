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
  banners?: AdminBanner[];
};

export const defaultProducts: Product[] = [];

export const defaultHomepageBanner: HomepageBanner = {
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
  banners: [],
};
