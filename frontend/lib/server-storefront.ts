import "server-only";
import {
  defaultAdminWorkspace,
  normalizeAdminWorkspace,
  type HomeManagement,
} from "@/lib/admin-workspace";
import type { Product } from "@/lib/catalog";
import { isPersistedMediaSource } from "@/lib/image-source";
import {
  defaultHomepageBanner,
  type HomepageBanner,
} from "@/lib/storefront-data";

const BACKEND_API_URL = (
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001"
).replace(/\/+$/, "");

async function storefrontFetch<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${BACKEND_API_URL}${path}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      return fallback;
    }

    return (await response.json()) as T;
  } catch {
    return fallback;
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

export async function getStorefrontProduct(id: string) {
  const product = await storefrontFetch<Product | null>(
    `/products/${encodeURIComponent(id)}`,
    null
  );
  return product ? normalizeProductSummary(product) : null;
}

export async function getHomepageContent() {
  const homepage = await storefrontFetch<HomepageBanner>("/content/homepage", defaultHomepageBanner);
  const mediaUrl = isPersistedMediaSource(homepage.mediaUrl) ? homepage.mediaUrl : "";
  const imageUrl = isPersistedMediaSource(homepage.imageUrl) ? homepage.imageUrl : "";
  const posterImage = isPersistedMediaSource(homepage.posterImage) ? homepage.posterImage : "";
  return { ...homepage, mediaUrl, imageUrl, posterImage };
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
