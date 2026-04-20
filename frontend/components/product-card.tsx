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

  return (
    <article className="group/product block min-w-0">
      <div
        className="shop-card-image relative flex aspect-[3/4] items-end overflow-hidden rounded-[1.15rem] bg-[#f3f3f0] sm:rounded-[1.35rem] lg:rounded-[1.55rem]"
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
          className="absolute bottom-3 right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/94 text-black shadow-[0_8px_20px_rgba(17,17,17,0.12)] transition md:h-10 md:w-10"
        />
      </div>

      <Link href={productHref} className="block px-0 pb-1 pt-3 sm:pt-4">
        <p className="line-clamp-2 min-h-[2.9rem] text-[0.88rem] font-medium uppercase leading-5 tracking-[-0.01em] sm:min-h-[3.2rem] sm:text-[0.96rem] sm:leading-6">
          {product.name}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-[0.96rem] font-semibold leading-none sm:text-[1rem]">
            Rs.{product.price.toLocaleString("en-IN")}.00
          </p>
          <p className="text-[0.8rem] text-[var(--muted)] line-through sm:text-[0.88rem]">
            Rs.{compareAtPrice.toLocaleString("en-IN")}.00
          </p>
        </div>
        <div className="mt-3 flex min-h-4 items-center gap-1">
          {product.colors.slice(0, 4).map((color) => (
            <span
              key={color}
              className="h-2.5 w-2.5 rounded-[2px] border border-black/30 sm:h-3 sm:w-3"
              style={{
                backgroundColor:
                  swatchColors[color.toLowerCase().trim()] ||
                  product.accent ||
                  "#d9d9d9",
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
    </article>
  );
}
