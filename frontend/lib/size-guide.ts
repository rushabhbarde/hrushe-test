import type { ProductSizeMeasurement } from "@/lib/catalog";

export const defaultOversizedTeeSizeGuide: ProductSizeMeasurement[] = [
  { size: "S", chest: "40", length: "27", shoulder: "18", sleeve: "8.5" },
  { size: "M", chest: "42", length: "28", shoulder: "19", sleeve: "9" },
  { size: "L", chest: "44", length: "29", shoulder: "20", sleeve: "9.5" },
  { size: "XL", chest: "46", length: "30", shoulder: "21", sleeve: "10" },
  { size: "XXL", chest: "48", length: "31", shoulder: "22", sleeve: "10.5" },
];

export function resolveProductSizeGuide(
  rows?: ProductSizeMeasurement[]
): ProductSizeMeasurement[] {
  const validRows = (rows || []).filter((row) => row.size.trim());
  return validRows.length > 0 ? validRows : defaultOversizedTeeSizeGuide;
}
