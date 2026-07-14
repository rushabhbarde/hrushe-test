import type { MetadataRoute } from "next";
import { toCollectionSlug } from "@/lib/catalog";

const siteUrl = "https://hrushe.in";

const backendUrl = new URL(
  process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "/api/backend",
  siteUrl
).toString().replace(/\/+$/, "");

type SitemapProduct = {
  id: string;
  slug?: string;
  category?: string;
  categories?: string[];
  updatedAt?: string;
};

export const revalidate = 3600;

async function loadSitemapProducts() {
  const requestOptions = () => ({
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(8000),
  } as const);

  try {
    const response = await fetch(`${backendUrl}/products/sitemap`, requestOptions());

    if (response.ok) {
      return (await response.json()) as SitemapProduct[];
    }
  } catch {
    // The lightweight endpoint may not exist yet while frontend and backend deploy together.
  }

  try {
    const response = await fetch(`${backendUrl}/products`, requestOptions());

    if (response.ok) {
      return (await response.json()) as SitemapProduct[];
    }
  } catch {
    // Static routes still belong in the sitemap when the catalog API is temporarily unavailable.
  }

  return [];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

  const staticRoutes = [
    "",
    "/women",
    "/men",
    "/shop",
    "/story",
    "/contact",
    "/policies",
  ];

  const products = await loadSitemapProducts();

  const collectionRoutes = Array.from(
    new Set(
      products
        .flatMap((product) => product.categories || [product.category])
        .filter((category): category is string => Boolean(category))
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
    changeFrequency: path === "" || path === "/women" || path === "/men" ? "daily" : "weekly",
    priority: path === "" || path === "/women" || path === "/men" ? 1 : 0.7,
  }));

  return [...routeEntries, ...productRoutes];
}
