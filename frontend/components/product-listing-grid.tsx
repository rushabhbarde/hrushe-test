import type { Product } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";

export function ProductListingGrid({
  products,
}: {
  products: Product[];
}) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 sm:gap-y-11 md:grid-cols-3 lg:gap-x-6 xl:grid-cols-4 xl:gap-x-7 2xl:gap-x-8">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export function ProductListingSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 sm:gap-y-11 md:grid-cols-3 lg:gap-x-6 xl:grid-cols-4 xl:gap-x-7 2xl:gap-x-8">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="animate-pulse">
          <div className="aspect-square bg-[#f3f3f3]" />
          <div className="mt-4 h-3 w-4/5 bg-[#eeeeee]" />
          <div className="mt-3 h-3 w-1/2 bg-[#eeeeee]" />
          <div className="mt-4 h-2.5 w-12 bg-[#eeeeee]" />
        </div>
      ))}
    </div>
  );
}
