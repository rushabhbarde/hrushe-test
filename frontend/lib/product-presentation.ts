import type { Product } from "@/lib/catalog";

export function getProductColour(product: Product) {
  const rawColour = product.colour || product.colors[0]?.trim() || "";
  const correctedColour = rawColour.replace(/\bBegie\b/gi, "Beige");
  return correctedColour
    ? correctedColour.charAt(0).toUpperCase() + correctedColour.slice(1).toLowerCase()
    : "";
}

export function getProductDisplayName(product: Product) {
  return (product.displayName || product.name || "").replace(/\bBegie\b/gi, "Beige");
}

export function getProductFabricLine(product: Product) {
  const fabric = product.fabric || product.cottonType || "";
  const gsm = product.gsm?.trim();
  return [fabric, gsm].filter(Boolean).join(" · ");
}

export function getProductFitLine(product: Product) {
  if (!product.fitType) {
    return "";
  }

  return product.fitNote || `${product.fitType} fit`;
}
