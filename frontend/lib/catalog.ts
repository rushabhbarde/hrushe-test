export type ProductReview = {
  id?: string;
  reviewerName: string;
  quote: string;
  rating: number;
  photo?: string;
  createdAt?: string;
  status?: "pending" | "approved" | "rejected" | "hidden";
  verifiedPurchase?: boolean;
};

export type ProductVariant = {
  sku?: string;
  size: string;
  color: string;
  fit?: string;
  stock: number;
  reserved?: number;
  active: boolean;
};

export type ProductVideo = {
  id: string;
  title: string;
  url: string;
  posterUrl?: string;
};

export type ProductSizeMeasurement = {
  size: string;
  chest: string;
  length: string;
  shoulder: string;
  sleeve: string;
};

export type ProductStatus =
  | "Active"
  | "Draft"
  | "Hidden"
  | "Sold Out"
  | "active"
  | "draft"
  | "hidden"
  | "archived"
  | "sold_out";
export type ProductFitType = "Oversized" | "Regular";
export type ProductGender = "Men" | "Women" | "Unisex";
export type ProductCollectionLabel = "New In" | "Featured" | "Collection";

export type Product = {
  id: string;
  name: string;
  displayName?: string;
  colour?: string;
  thumbnailUrl?: string;
  availability?: "available" | "sold-out";
  slug?: string;
  description: string;
  price: number;
  category: string;
  categories?: string[];
  colors: string[];
  sizes: string[];
  imageLabel: string;
  accent: string;
  featured?: boolean;
  bestSeller?: boolean;
  newIn?: boolean;
  newArrival?: boolean;
  images: string[];
  videos?: ProductVideo[];
  compareAtPrice?: number;
  reviews?: ProductReview[];
  galleryImages?: string[];
  fabric?: string;
  gsm?: string;
  cottonType?: string;
  feel?: string;
  weight?: string;
  washCare?: string;
  qualityNote?: string;
  fitNote?: string;
  modelHeight?: string;
  modelWornSize?: string;
  returnEligible?: boolean;
  sizeGuide?: ProductSizeMeasurement[];
  fitType?: ProductFitType;
  gender?: ProductGender;
  collectionLabels?: ProductCollectionLabel[];
  status?: ProductStatus;
  trackInventory?: boolean;
  variants?: ProductVariant[];
  createdAt?: string;
  updatedAt?: string;
};

export const categories = [
  "T-Shirts",
  "Oversized",
  "Essential",
  "Outerwear",
  "Shirts",
  "Graphic Tees",
  "Polos",
  "Bottomwear",
  "Accessories",
];

export const brandHighlights = [
  "Clear proportions",
  "Honest materials",
  "Repeat-wear construction",
];

export function toCollectionSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function productCategoryList(product: Product) {
  return product.categories && product.categories.length > 0
    ? product.categories
    : [product.category].filter(Boolean);
}

export function isVisibleStorefrontProduct(product: Product) {
  return product.status !== "Draft" && product.status !== "Hidden";
}

export function productRecencyTime(product: Product) {
  const dateValue = product.createdAt || product.updatedAt || "";
  const parsedTime = dateValue ? new Date(dateValue).getTime() : 0;

  return Number.isNaN(parsedTime) ? 0 : parsedTime;
}

export function sortProductsByStorefrontPriority(products: Product[]) {
  return [...products].sort((left, right) => {
    const leftScore =
      Number(Boolean(left.newArrival || left.newIn)) * 4 +
      Number(Boolean(left.bestSeller)) * 3 +
      Number(Boolean(left.featured)) * 2 +
      productRecencyTime(left) / 1_000_000_000_000;
    const rightScore =
      Number(Boolean(right.newArrival || right.newIn)) * 4 +
      Number(Boolean(right.bestSeller)) * 3 +
      Number(Boolean(right.featured)) * 2 +
      productRecencyTime(right) / 1_000_000_000_000;

    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }

    return left.name.localeCompare(right.name);
  });
}

export function getNewInProducts(
  products: Product[],
  { limit, includeFallback = true }: { limit?: number; includeFallback?: boolean } = {}
) {
  const visibleProducts = products.filter(isVisibleStorefrontProduct);
  const flaggedProducts = visibleProducts.filter(
    (product) => product.newArrival || product.newIn
  );
  const selectedProducts =
    flaggedProducts.length > 0 || !includeFallback ? flaggedProducts : visibleProducts;
  const sortedProducts = sortProductsByStorefrontPriority(selectedProducts);

  return typeof limit === "number" ? sortedProducts.slice(0, limit) : sortedProducts;
}

function singularizeSlug(slug: string) {
  return slug.endsWith("s") ? slug.slice(0, -1) : slug;
}

function collectionFamilySlug(slug: string) {
  if (slug.includes("oversize")) {
    return "oversize";
  }

  if (slug.includes("essential")) {
    return "essential";
  }

  if (slug.includes("polo")) {
    return "polo";
  }

  if (slug.includes("tee") || slug.includes("t-shirt")) {
    return "tee";
  }

  return singularizeSlug(slug);
}

export function slugsMatch(left: string, right: string) {
  const leftSlug = toCollectionSlug(left);
  const rightSlug = toCollectionSlug(right);

  return (
    leftSlug === rightSlug ||
    singularizeSlug(leftSlug) === singularizeSlug(rightSlug) ||
    collectionFamilySlug(leftSlug) === collectionFamilySlug(rightSlug)
  );
}

export function getCollectionLabelFromSlug(slug: string, products: Product[]) {
  const knownCategories = Array.from(
    new Set([
      "Men",
      "Women",
      "Unisex",
      ...categories,
      ...products.flatMap((product) => productCategoryList(product)),
    ])
  ).filter(Boolean);

  return knownCategories.find((category) => slugsMatch(category, slug)) || "";
}

export function formatCollectionLabel(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getCollectionProducts(products: Product[], collectionLabel: string) {
  const collectionSlug = toCollectionSlug(collectionLabel);

  return sortProductsByStorefrontPriority(
    products
      .filter(isVisibleStorefrontProduct)
      .filter((product) =>
        productCategoryList(product).some((category) => slugsMatch(category, collectionLabel)) ||
        genderMatchesCollection(product.gender, collectionSlug)
      )
  );
}

function genderMatchesCollection(gender: ProductGender | undefined, collectionSlug: string) {
  const genderSlug = toCollectionSlug(gender || "");

  if (!genderSlug) {
    return false;
  }

  if (collectionSlug === "men") {
    return genderSlug === "men" || genderSlug === "unisex";
  }

  if (collectionSlug === "women") {
    return genderSlug === "women" || genderSlug === "unisex";
  }

  return slugsMatch(genderSlug, collectionSlug);
}
