import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { getProductDisplayName } from "@/lib/product-presentation";

function formatPrice(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

export function ProductCard({ product }: { product: Product }) {
  const productName = getProductDisplayName(product);
  const productHref = `/product/${product.slug || product.id}`;
  const image = product.thumbnailUrl || product.images?.[0] || "";

  return (
    <article data-product-card className="min-w-0">
      <Link href={productHref} className="group block" aria-label={`View ${productName}`}>
        <div className="relative aspect-[18/25] overflow-hidden bg-[var(--surface-strong)]">
          {image ? (
            <Image
              src={image}
              alt={productName}
              fill
              loading="lazy"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover object-center transition-transform duration-300 motion-reduce:transition-none md:group-hover:scale-[1.015]"
            />
          ) : (
            <div className="flex h-full items-end p-4 text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
              Image being prepared
            </div>
          )}
        </div>
        <div className="pt-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[0.8rem] font-medium leading-5 text-[var(--foreground)] sm:text-[0.88rem]">
              {productName}
            </h3>
            <p className="shrink-0 text-[0.8rem] font-semibold text-[var(--foreground)] sm:text-[0.88rem]">
              {formatPrice(product.price)}
            </p>
          </div>
          {product.availability === "sold-out" || product.status === "Sold Out" ? (
            <p className="mt-2 text-[0.62rem] uppercase tracking-[0.14em] text-[var(--muted)]">
              Currently unavailable
            </p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
