"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { useToast } from "@/components/toast-provider";
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
  const { addItem, openCart } = useCart();
  const { pushToast } = useToast();
  const hasImage = Boolean(product.images[0]);
  const compareAtPrice = product.compareAtPrice || getCompareAtPrice(product.price);
  const productHref = `/product/${product.slug || product.id}`;
  const hasDiscount = compareAtPrice > product.price;
  const quickAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      size: product.sizes[0] || "S",
      color: product.colors[0] || "Default",
      fit: product.category,
      quantity: 1,
      accent: product.accent,
      image: product.images[0],
    });
    pushToast(`${product.name} added to bag.`);
    openCart();
  };

  return (
    <article data-product-card className="group/product reveal-up-soft block min-w-0">
      <div
        className="shop-card-image relative aspect-[18/25] overflow-hidden bg-[#f6f6f3]"
        style={{ backgroundColor: "var(--surface-strong)" }}
      >
        <Link href={productHref} className="absolute inset-0" aria-label={product.name} />
        {hasDiscount ? (
          <span className="absolute left-2 top-2 z-10 bg-[var(--foreground)] px-2 py-[5px] text-[0.56rem] font-medium uppercase tracking-[0.14em] text-[var(--background)] md:left-2.5 md:top-2.5">
            -{Math.round(((compareAtPrice - product.price) / compareAtPrice) * 100)}%
          </span>
        ) : null}
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover object-center transition duration-700 md:group-hover/product:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{ backgroundColor: product.accent || "var(--surface-strong)" }}
          />
        )}
      </div>

      <div className="shop-card-copy block px-0 pb-1 pt-1">
        <Link href={productHref} className="block">
          <p className="line-clamp-2 text-[1rem] font-medium uppercase leading-[1.04] tracking-[-0.03em] text-[var(--foreground)] sm:text-[1.04rem]">
            {product.name}
          </p>
        </Link>
        <div className="mt-1 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <p className="text-[0.99rem] font-semibold leading-none text-[var(--foreground)] sm:text-[1rem]">
                Rs.{product.price.toLocaleString("en-IN")}.00
              </p>
              {hasDiscount ? (
                <p className="text-[0.74rem] leading-none text-[var(--accent)] line-through sm:text-[0.78rem]">
                  Rs.{compareAtPrice.toLocaleString("en-IN")}.00
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <WishlistButton
              productId={product.id}
              label={`Save ${product.name}`}
              className="flex h-8 w-8 items-center justify-center border border-[var(--border)] bg-white/88 text-[var(--foreground)] transition hover:bg-[var(--foreground)] hover:text-[var(--background)]"
              iconClassName="h-[17px] w-[17px]"
            />
            <button
              type="button"
              onClick={quickAddToCart}
              className="flex h-8 items-center justify-center border border-[var(--foreground)] bg-[var(--foreground)] px-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[var(--background)] transition hover:bg-transparent hover:text-[var(--foreground)]"
              aria-label={`Add ${product.name} to cart`}
            >
              Add
            </button>
          </div>
        </div>
        <div className="mt-1.5 flex min-h-3 items-center gap-1">
          {product.colors.slice(0, 4).map((color) => (
            <span
              key={color}
              className="h-2.5 w-2.5 rounded-none border border-[var(--border)]"
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
      </div>
    </article>
  );
}
