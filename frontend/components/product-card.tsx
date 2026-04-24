import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { getCompareAtPrice } from "@/lib/pricing";
import { WishlistButton } from "@/components/wishlist-button";

const swatchColors: Record<string, string> = {
  black: "#111111",
  white: "#f5f5f5",
  offwhite: "#f1efe8",
  "off white": "#f1efe8",
  coffee: "#6f5847",
  bone: "#ded8cc",
  beige: "#d8cbb6",
  begie: "#d8cbb6",
  cream: "#ede2d2",
  stone: "#c8c7c2",
  brown: "#6b4f3a",
  maroon: "#74263f",
  burgundy: "#6f2137",
  red: "#a63131",
  green: "#3f6a4a",
  forest: "#465742",
  sage: "#9aa28d",
  ink: "#2c3440",
  midnight: "#181a20",
  navy: "#24344d",
  slate: "#7f8794",
  sand: "#d7c6a8",
  olive: "#767863",
  charcoal: "#3c3c3c",
  grey: "#7a7a7a",
  gray: "#7a7a7a",
  ash: "#90949b",
  silver: "#b7bcc3",
};

export function ProductCard({ product }: { product: Product }) {
  const hasImage = Boolean(product.images[0]);
  const compareAtPrice = product.compareAtPrice || getCompareAtPrice(product.price);
  const productHref = `/product/${product.slug || product.id}`;
  const hasDiscount = compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((compareAtPrice - product.price) / compareAtPrice) * 100)
    : 0;

  return (
    <article className="group/product block min-w-0">
      <div className="shop-card-image relative aspect-[4/5] overflow-hidden bg-[#f5f5f5]">
        <Link href={productHref} className="absolute inset-0" aria-label={product.name} />
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover object-center transition duration-500 md:group-hover/product:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full" style={{ backgroundColor: product.accent || "#f5f5f5" }} />
        )}
        {hasDiscount ? (
          <span className="absolute left-0 top-0 z-10 bg-black px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white sm:text-[11px]">
            -{discountPercent}%
          </span>
        ) : null}
        <WishlistButton
          productId={product.id}
          label={`Save ${product.name}`}
          className="absolute bottom-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/96 text-black shadow-[0_6px_18px_rgba(17,17,17,0.1)] transition md:bottom-4 md:right-4"
        />
      </div>

      <Link href={productHref} className="block px-0 pb-1 pt-2 sm:pt-2.5">
        <p className="line-clamp-2 min-h-[1.85rem] text-[0.76rem] font-medium uppercase leading-[1.1] tracking-[-0.015em] sm:min-h-[2rem] sm:text-[0.86rem]">
          {product.name}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-[0.9rem] font-semibold leading-none sm:text-[0.98rem]">
            Rs.{product.price.toLocaleString("en-IN")}.00
          </p>
          {hasDiscount ? (
            <p className="text-[0.76rem] text-[var(--muted)] line-through sm:text-[0.84rem]">
              Rs.{compareAtPrice.toLocaleString("en-IN")}.00
            </p>
          ) : null}
        </div>
        <div className="mt-2 flex min-h-4 items-center gap-1">
          {product.colors.slice(0, 4).map((color) => (
            <span
              key={color}
              className="h-2.5 w-2.5 rounded-[1px] border border-black/25 sm:h-2.5 sm:w-2.5"
              style={{
                backgroundColor:
                  swatchColors[color.toLowerCase().trim()] ||
                  product.accent ||
                  "#d9d9d9",
              }}
            />
          ))}
          {product.colors.length > 4 ? (
            <span className="ml-1 text-[0.82rem] text-[var(--muted)]">
              +{product.colors.length - 4}
            </span>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
