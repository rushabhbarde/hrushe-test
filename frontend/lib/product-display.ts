import type { Product, ProductVariant } from "@/lib/catalog";
import { isPersistedMediaSource } from "@/lib/image-source";

export function normalizeColourName(value?: string) {
  const normalized = String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/begie/gi, "beige");

  return normalized.replace(/\b\w/g, (character) => character.toUpperCase());
}

export function normalizeProductForDisplay(product: Product): Product {
  const images = (product.images || (product.thumbnailUrl ? [product.thumbnailUrl] : []))
    .map((item) => String(item || "").trim())
    .filter(isPersistedMediaSource);
  const galleryImages = (product.galleryImages || [])
    .map((item) => String(item || "").trim())
    .filter(isPersistedMediaSource);

  return {
    ...product,
    name: product.displayName || product.name || "",
    slug: (product.slug || product.id).replace(/begie/gi, "beige"),
    colors: (product.colors || (product.colour ? [product.colour] : [])).map(normalizeColourName),
    colour: normalizeColourName(product.colour || product.colors?.[0] || ""),
    images,
    galleryImages,
    thumbnailUrl: isPersistedMediaSource(product.thumbnailUrl) ? product.thumbnailUrl : images[0] || "",
    status: product.status || (product.availability === "sold-out" ? "Sold Out" : "Active"),
  };
}

function sameOption(left?: string, right?: string) {
  return String(left || "").trim().toLowerCase() === String(right || "").trim().toLowerCase();
}

export function selectProductVariant(
  product: Pick<Product, "variants">,
  selection: { size?: string; color?: string; fit?: string }
): ProductVariant | undefined {
  return (product.variants || []).find(
    (variant) =>
      variant.active !== false &&
      sameOption(variant.size, selection.size) &&
      sameOption(variant.color, selection.color) &&
      (!variant.fit || !selection.fit || sameOption(variant.fit, selection.fit))
  );
}

export function isStockAvailable(
  product: Pick<Product, "trackInventory" | "variants">,
  selection: { size?: string; color?: string; fit?: string; quantity?: number } = {}
) {
  if (!product.trackInventory) {
    return true;
  }

  const variant = selectProductVariant(product, selection);
  return Boolean(variant?.active !== false && (variant?.stock || 0) >= (selection.quantity || 1));
}
