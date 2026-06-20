import type { Product } from "@/lib/catalog";

const colourNames: Record<string, string> = {
  beige: "Sand",
  begie: "Sand",
  black: "Black",
  white: "Chalk",
  green: "Forest",
  maroon: "Oxblood",
  coffee: "Cocoa",
  brown: "Cocoa",
  cream: "Ecru",
  grey: "Slate",
  gray: "Slate",
};

export function getProductColour(product: Product) {
  const rawColour = product.colors[0]?.trim() || product.name.split(" ")[0] || "Core";
  return colourNames[rawColour.toLowerCase()] ||
    rawColour.charAt(0).toUpperCase() + rawColour.slice(1).toLowerCase();
}

export function getProductDisplayName(product: Product) {
  const searchable = `${product.name} ${product.category}`.toLowerCase();

  if (searchable.includes("oversize")) {
    return `The Oversized Tee — ${getProductColour(product)}`;
  }

  return product.name
    .replace(/\bBegie\b/gi, "Beige")
    .toLowerCase()
    .replace(/(^|\s|—|-)([a-z])/g, (_, prefix: string, letter: string) =>
      `${prefix}${letter.toUpperCase()}`
    );
}

export function getProductFabricLine(product: Product) {
  const fabric = product.fabric || product.cottonType || "Cotton jersey";
  const gsm = product.gsm?.trim();
  return [fabric, gsm].filter(Boolean).join(" · ");
}

export function getProductFitLine(product: Product) {
  return product.fitType === "Regular" ? "Regular fit" : "Relaxed oversized fit";
}
