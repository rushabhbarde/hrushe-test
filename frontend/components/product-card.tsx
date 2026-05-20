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

  return (
    <article className="group/product block min-w-0">
      <div
        className="shop-card-image relative aspect-[18/25] overflow-hidden"
        style={{ backgroundColor: "var(--surface-strong)" }}
      >
        <Link href={productHref} className="absolute inset-0" aria-label={product.name} />
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover object-top transition duration-500 md:group-hover/product:scale-[1.012]"
            loading="lazy"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{ backgroundColor: product.accent || "var(--surface-strong)" }}
          />
        )}
        <WishlistButton
          productId={product.id}
          label={`Save ${product.name}`}
          className="absolute bottom-2.5 right-2.5 z-10 flex h-8 w-8 items-center justify-center text-[var(--foreground)] transition md:bottom-3 md:right-3"
        />
      </div>

      <Link href={productHref} className="block px-0 pb-1 pt-1">
        <p className="line-clamp-2 text-[0.84rem] font-medium uppercase leading-[1.12] tracking-[-0.015em] text-[var(--foreground)] sm:text-[0.88rem]">
          {product.name}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <p className="text-[0.94rem] font-semibold leading-none text-[var(--foreground)] sm:text-[0.98rem]">
            Rs.{product.price.toLocaleString("en-IN")}.00
          </p>
          {hasDiscount ? (
            <p className="text-[0.74rem] leading-none text-[var(--accent)] line-through sm:text-[0.78rem]">
              Rs.{compareAtPrice.toLocaleString("en-IN")}.00
            </p>
          ) : null}
        </div>
        <div className="mt-0.75 flex min-h-3 items-center gap-1">
          {product.colors.slice(0, 4).map((color) => (
            <span
              key={color}
              className="h-2.5 w-2.5 rounded-[1px] border border-[var(--border)] sm:h-2.5 sm:w-2.5"
              style={{
                backgroundColor:
                  swatchColors[color.toLowerCase().trim()] ||
                  product.accent ||
                  "#d9d9d9",
              }}
            />
          ))}
          {product.colors.length > 4 ? (
            <span className="ml-0.5 text-[0.74rem] text-[var(--muted)]">
              +{product.colors.length - 4}
            </span>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
