import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { getCompareAtPrice } from "@/lib/pricing";
import { WishlistButton } from "@/components/wishlist-button";

const swatchColors: Record<string, string> = {
  coffee: "#6f5847",
  bone: "#ded8cc",
  stone: "#c8c7c2",
  ink: "#2c3440",
  midnight: "#181a20",
  slate: "#7f8794",
  sand: "#d7c6a8",
  olive: "#767863",
};

export function ProductCard({ product }: { product: Product }) {
  const hasImage = Boolean(product.images[0]);
  const compareAtPrice = product.compareAtPrice || getCompareAtPrice(product.price);
  const productHref = `/product/${product.slug || product.id}`;

  return (
    <div className="group block">
      <div
        className="shop-card-image relative flex aspect-[0.9/1.14] items-end overflow-hidden bg-[#f3f3f0]"
        style={{
          backgroundImage: hasImage ? `url(${product.images[0]})` : undefined,
          backgroundSize: hasImage ? "cover" : undefined,
          backgroundPosition: hasImage ? "center" : undefined,
          backgroundColor: !hasImage ? product.accent : undefined,
        }}
      >
        <Link href={productHref} className="absolute inset-0" aria-label={product.name} />
        <WishlistButton
          productId={product.id}
          label={`Save ${product.name}`}
          className="absolute bottom-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/92 text-black transition group-hover:bg-white"
        />
      </div>

      <Link href={productHref} className="block px-0 pb-1 pt-3">
        <p className="text-[0.98rem] font-medium uppercase leading-6 tracking-[-0.01em]">
          {product.name}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          <p className="text-[0.98rem] font-semibold leading-none">
            Rs.{product.price.toLocaleString("en-IN")}.00
          </p>
          <p className="text-[0.88rem] text-[var(--muted)] line-through">
            Rs.{compareAtPrice.toLocaleString("en-IN")}.00
          </p>
        </div>
        <div className="mt-3 flex items-center gap-1">
          {product.colors.slice(0, 4).map((color) => (
            <span
              key={color}
              className="h-2.5 w-2.5 border border-black/30"
              style={{
                backgroundColor:
                  swatchColors[color.toLowerCase()] || product.accent || "#d9d9d9",
              }}
            />
          ))}
          {product.colors.length > 4 ? (
            <span className="ml-1 text-[0.92rem] text-[var(--muted)]">
              +{product.colors.length - 4}
            </span>
          ) : null}
        </div>
      </Link>
    </div>
  );
}
