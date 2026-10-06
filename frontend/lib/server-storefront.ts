import "server-only";
import {
  defaultAdminWorkspace,
  normalizeAdminWorkspace,
  type HomeManagement,
} from "@/lib/admin-workspace";
import type { Product } from "@/lib/catalog";
import { isPersistedMediaSource } from "@/lib/image-source";

const BACKEND_API_URL = (
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001"
).replace(/\/+$/, "");

/** How long a built storefront page is reused before it is rebuilt in the background. */
export const STOREFRONT_REVALIDATE_SECONDS = 60;

const isBuilding = process.env.NEXT_PHASE === "phase-production-build";

/**
 * Storefront pages are built once and reused for a minute. If the backend is unreachable
 * when a page is rebuilt, throw: the last good page keeps being served instead of one
 * built from fallbacks. Only the build itself (which may have no backend) falls back.
 */
async function storefrontFetch<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${BACKEND_API_URL}${path}`, {
      next: { revalidate: STOREFRONT_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      throw new Error(`Storefront request ${path} failed with ${response.status}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (isBuilding || process.env.NODE_ENV !== "production") {
      return fallback;
    }
    throw error;
  }
}

function normalizeProductSummary(product: Product): Product {
  return {
    ...product,
    name: product.displayName || product.name || "",
    slug: (product.slug || product.id).replace(/begie/gi, "beige"),
    description: product.description || "",
    category: product.category || "",
    categories: product.categories || [],
    colors: product.colors || (product.colour ? [product.colour] : []),
    sizes: product.sizes || [],
    images: (product.images || (product.thumbnailUrl ? [product.thumbnailUrl] : [])).filter(isPersistedMediaSource),
    galleryImages: (product.galleryImages || []).filter(isPersistedMediaSource),
    videos: (product.videos || []).filter((video) => isPersistedMediaSource(video.url)),
    imageLabel: product.imageLabel || product.displayName || product.name || "Product",
    accent: product.accent || "#f6f6f6",
    status: product.status || (product.availability === "sold-out" ? "Sold Out" : "Active"),
  };
}

export async function getStorefrontProducts() {
  const products = await storefrontFetch<Product[]>("/products", []);
  return products.map(normalizeProductSummary);
}

export async function getHomepageManagement() {
  const fallback = {
    ...defaultAdminWorkspace.homeManagement,
    hasCustomSections: false,
  };
  const payload = await storefrontFetch<Partial<HomeManagement> & { hasCustomSections?: boolean }>(
    "/content/homepage-management",
    fallback
  );
  const { hasCustomSections, ...homeManagementPayload } = payload;
  const hasSectionsPayload = Array.isArray(payload.sections);
  const sectionsPayload =
    hasSectionsPayload && (hasCustomSections || payload.sections!.length > 0)
      ? payload.sections!
      : defaultAdminWorkspace.homeManagement.sections;

  return normalizeAdminWorkspace({
    homeManagement: {
      ...defaultAdminWorkspace.homeManagement,
      ...homeManagementPayload,
      sections: sectionsPayload,
    },
  }).homeManagement;
}
