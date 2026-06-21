import type { ProductSizeMeasurement } from "@/lib/catalog";

export function resolveProductSizeGuide(
  rows?: ProductSizeMeasurement[]
): ProductSizeMeasurement[] {
  return (rows || []).filter((row) => row.size.trim());
}
