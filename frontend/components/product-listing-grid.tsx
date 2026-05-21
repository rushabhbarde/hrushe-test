import type { Product } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";

export function ProductListingGrid({
  products,
}: {
  products: Product[];
}) {
  return (
    <div className="catalog-shell grid grid-cols-2 gap-x-2.5 gap-y-8 pt-2 sm:gap-x-3 sm:gap-y-10 md:grid-cols-3 lg:gap-x-4 lg:gap-y-11 xl:grid-cols-4 xl:gap-x-5 xl:gap-y-12">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export function ProductListingSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="catalog-shell grid grid-cols-2 gap-x-2.5 gap-y-8 pt-2 sm:gap-x-3 sm:gap-y-10 md:grid-cols-3 lg:gap-x-4 lg:gap-y-11 xl:grid-cols-4 xl:gap-x-5 xl:gap-y-12">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="loading-pulse">
          <div className="aspect-[18/25]" style={{ backgroundColor: "var(--surface-strong)" }} />
          <div className="mt-1.5 h-3 w-4/5" style={{ backgroundColor: "var(--surface-strong)" }} />
          <div className="mt-1 h-3 w-1/2" style={{ backgroundColor: "var(--surface-strong)" }} />
          <div className="mt-1 h-2.5 w-12" style={{ backgroundColor: "var(--surface-strong)" }} />
        </div>
      ))}
    </div>
  );
}
