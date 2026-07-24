import { describe, expect, it } from "vitest";
import type { Product } from "@/lib/catalog";
import {
  isStockAvailable,
  normalizeColourName,
  normalizeProductForDisplay,
  selectProductVariant,
} from "@/lib/product-display";

const product: Product = {
  id: "p1",
  name: "Oversized Tee",
  displayName: "Quiet Tee",
  colour: "begie",
  slug: "begie-tee",
  description: "",
  price: 1299,
  category: "T-Shirts",
  colors: ["begie", "Black"],
  sizes: ["S", "M"],
  imageLabel: "Tee",
  accent: "#111111",
  images: ["/uploads/products/tee.png", "data:image/png;base64,bad"],
  galleryImages: ["https://media.hrushe.in/tee-2.webp", "blob:test"],
  trackInventory: true,
  variants: [
    { sku: "TEE-BEI-S", size: "S", color: "Beige", stock: 0, active: true },
    { sku: "TEE-BLK-M", size: "M", color: "Black", fit: "Regular", stock: 4, active: true },
  ],
};

describe("product display helpers", () => {
  it("normalizes product copy, colors, slug, and persisted media", () => {
    const normalized = normalizeProductForDisplay(product);

    expect(normalized.name).toBe("Quiet Tee");
    expect(normalized.slug).toBe("beige-tee");
    expect(normalized.colour).toBe("Beige");
    expect(normalized.colors).toEqual(["Beige", "Black"]);
    expect(normalized.images).toEqual(["/uploads/products/tee.png"]);
    expect(normalized.galleryImages).toEqual(["https://media.hrushe.in/tee-2.webp"]);
  });

  it("normalizes colour spelling and casing", () => {
    expect(normalizeColourName("  begie marl ")).toBe("Beige Marl");
  });

  it("selects active variants by size, color, and fit", () => {
    expect(selectProductVariant(product, { size: "m", color: "black", fit: "regular" })?.sku).toBe("TEE-BLK-M");
    expect(selectProductVariant(product, { size: "s", color: "black" })).toBeUndefined();
  });

  it("reports stock availability by selected variant", () => {
    expect(isStockAvailable(product, { size: "M", color: "Black", quantity: 2 })).toBe(true);
    expect(isStockAvailable(product, { size: "S", color: "Beige", quantity: 1 })).toBe(false);
    expect(isStockAvailable({ trackInventory: false, variants: [] })).toBe(true);
  });
});
