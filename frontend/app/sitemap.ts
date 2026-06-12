import type { MetadataRoute } from "next";
import type { Product } from "@/lib/catalog";
import { toCollectionSlug } from "@/lib/catalog";

const siteUrl = "https://hrushe.in";

const backendUrl = (
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001"
).replace(/\/+$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

  const staticRoutes = [
    "",
    "/shop",
    "/new-in",
    "/story",
    "/contact",
    "/policies",
  ];

  let products: Product[] = [];
  try {
    const response = await fetch(`${backendUrl}/products`, { next: { revalidate: 3600 } });
    if (response.ok) {
      products = (await response.json()) as Product[];
    }
  } catch {
    products = [];
  }

  const collectionRoutes = Array.from(
    new Set(
      products.flatMap((product) => product.categories || [product.category]).filter(Boolean)
    )
  ).map((category) => `/collection/${toCollectionSlug(category)}`);

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${siteUrl}/product/${product.slug || product.id}`,
    lastModified: product.updatedAt ? new Date(product.updatedAt) : undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const routeEntries: MetadataRoute.Sitemap = [...staticRoutes, ...collectionRoutes].map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  return [...routeEntries, ...productRoutes];
}
