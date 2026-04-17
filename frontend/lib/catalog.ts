export type ProductReview = {
  id?: string;
  reviewerName: string;
  quote: string;
  rating: number;
  photo?: string;
  createdAt?: string;
};

export type Product = {
  id: string;
  name: string;
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
  compareAtPrice?: number;
  reviews?: ProductReview[];
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
  "Fast-launch fashion MVP",
  "Premium essentials and statement silhouettes",
  "Admin-ready catalog and order flow",
];

export function toCollectionSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
