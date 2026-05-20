import type { Product } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";

export function ProductListingGrid({
  products,
}: {
  products: Product[];
}) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 sm:gap-y-10 md:grid-cols-3 lg:gap-x-5 xl:grid-cols-4 xl:gap-x-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export function ProductListingSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 sm:gap-y-10 md:grid-cols-3 lg:gap-x-5 xl:grid-cols-4 xl:gap-x-6">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="animate-pulse">
          <div className="aspect-[3/4]" style={{ backgroundColor: "var(--surface-strong)" }} />
          <div className="mt-2.5 h-3 w-4/5" style={{ backgroundColor: "var(--surface-strong)" }} />
          <div className="mt-1.5 h-3 w-1/2" style={{ backgroundColor: "var(--surface-strong)" }} />
          <div className="mt-2.5 h-2.5 w-12" style={{ backgroundColor: "var(--surface-strong)" }} />
        </div>
      ))}
    </div>
  );
}
