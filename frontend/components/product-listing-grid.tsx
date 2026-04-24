import type { Product } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";

export function ProductListingGrid({
  products,
}: {
  products: Product[];
}) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 sm:gap-y-10 md:grid-cols-3 lg:gap-x-5 xl:grid-cols-4 xl:gap-x-6 2xl:grid-cols-5 2xl:gap-x-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export function ProductListingSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 sm:gap-y-10 md:grid-cols-3 lg:gap-x-5 xl:grid-cols-4 xl:gap-x-6 2xl:grid-cols-5 2xl:gap-x-6">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="animate-pulse">
          <div className="aspect-[4/5] bg-[#f3f3f3]" />
          <div className="mt-3 h-3 w-4/5 bg-[#eeeeee]" />
          <div className="mt-2 h-3 w-1/2 bg-[#eeeeee]" />
          <div className="mt-3 h-2.5 w-12 bg-[#eeeeee]" />
        </div>
      ))}
    </div>
  );
}
