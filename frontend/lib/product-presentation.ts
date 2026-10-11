import type { Product } from "@/lib/catalog";

export function getProductDisplayName(product: Product) {
  return (product.displayName || product.name || "").replace(/\bBegie\b/gi, "Beige");
}

/** Fabric weight with its unit: "240" becomes "240 GSM"; a value that already names it is kept. */
export function formatGsm(gsm?: string) {
  const value = String(gsm || "").trim();
  if (!value) return "";
  return /gsm/i.test(value) ? value : `${value} GSM`;
}

export function getProductFabricLine(product: Product) {
  const fabric = product.fabric || product.cottonType || "";
  return [fabric, formatGsm(product.gsm)].filter(Boolean).join(" · ");
}

export function getProductFitLine(product: Product) {
  if (!product.fitType) {
    return "";
  }

  return product.fitNote || `${product.fitType} fit`;
}
