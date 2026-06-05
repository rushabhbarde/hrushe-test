import type { MetadataRoute } from "next";
import { categories, toCollectionSlug } from "@/lib/catalog";

const siteUrl = "https://hrushe.in";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes = [
    "",
    "/shop",
    "/new-in",
    "/story",
    "/contact",
    "/policies",
  ];

  const collectionRoutes = Array.from(
    new Set(categories.map((category) => `/collection/${toCollectionSlug(category)}`))
  );

  return [...staticRoutes, ...collectionRoutes].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
