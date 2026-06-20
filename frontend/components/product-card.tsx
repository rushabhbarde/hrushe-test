"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { useToast } from "@/components/toast-provider";
import type { Product } from "@/lib/catalog";
import { shouldBypassImageOptimization } from "@/lib/image-source";
import { getCompareAtPrice, getDiscountPercent } from "@/lib/pricing";
import { WishlistButton } from "@/components/wishlist-button";
import { useState } from "react";

function CartIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6.5 8.5h11l-.7 10h-9.6l-.7-10Z" />
      <path d="M9.5 8.5a2.5 2.5 0 0 1 5 0" />
      <path d="M9.5 11.5v.01" />
      <path d="M14.5 11.5v.01" />
    </svg>
  );
}

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

function formatPrice(value: number) {
  return `Rs. ${value.toLocaleString("en-IN")}`;
}

export function ProductCard({ product }: { product: Product }) {
  const { addItem, openCart } = useCart();
  const { pushToast } = useToast();
  const [showQuickSizes, setShowQuickSizes] = useState(false);
  const hasImage = Boolean(product.images[0]);
  const hoverImage = product.images[1] || product.galleryImages?.[0] || "";
  const hasHoverImage = Boolean(hoverImage && hoverImage !== product.images[0]);
  const compareAtPrice = product.compareAtPrice || getCompareAtPrice(product.price);
  const productHref = `/product/${product.slug || product.id}`;
  const colorHint = product.colors.length > 0 ? product.colors.join(", ") : "HRUSHE";
  const productMeta = product.fitType || product.category || "Everyday essential";
  const hasDiscount = compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? getDiscountPercent(product.price, compareAtPrice)
    : 0;
  const availableSizes = product.sizes.filter(
    (size) =>
      !product.trackInventory ||
      product.variants?.some(
        (variant) =>
          variant.active && variant.stock > 0 && variant.size.toLowerCase() === size.toLowerCase()
      )
  );
  const addSelectedSize = (size: string) => {
    const availableVariant = product.variants?.find(
      (variant) =>
        variant.active &&
        variant.stock > 0 &&
        variant.size.toLowerCase() === size.toLowerCase()
    );
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      size,
      color: availableVariant?.color || product.colors[0] || "Default",
      fit: product.fitType === "Oversized" ? "Oversize" : product.fitType || "",
      quantity: 1,
      accent: product.accent,
      image: product.images[0],
    });
    pushToast(`${product.name} added to bag.`);
    setShowQuickSizes(false);
    openCart();
  };
  const quickAddToCart = () => {
    if (availableSizes.length === 1) {
      addSelectedSize(availableSizes[0]);
      return;
    }

    setShowQuickSizes((current) => !current);
  };
  const labels = [
    product.newIn || product.newArrival ? "New" : "",
    product.featured ? "Featured" : "",
  ].filter(Boolean).slice(0, 2);
  const visibleSizes = availableSizes.slice(0, 4);

  return (
    <article data-product-card className="group/product reveal-up-soft block min-w-0">
      <div
        className="shop-card-image relative aspect-[18/25] overflow-hidden bg-[#f6f6f3]"
        style={{ backgroundColor: "var(--surface-strong)" }}
      >
        <Link href={productHref} className="absolute inset-0 z-10" aria-label={product.name} />
        {labels.length || hasDiscount ? (
          <div className="pointer-events-none absolute left-2 top-2 z-20 flex max-w-[calc(100%-1rem)] flex-wrap gap-1.5 md:left-2.5 md:top-2.5">
            {labels.map((label) => (
              <span
                key={label}
                className="border border-[rgba(17,17,17,0.16)] bg-white/92 px-2 py-[5px] text-[0.54rem] font-semibold uppercase tracking-[0.14em] text-[var(--foreground)]"
              >
                {label}
              </span>
            ))}
            {hasDiscount ? (
              <span className="border border-[var(--danger)] bg-white/92 px-2 py-[5px] text-[0.54rem] font-semibold uppercase tracking-[0.14em] text-[var(--danger)]">
                -{discountPercent}%
              </span>
            ) : null}
          </div>
        ) : null}
        {hasImage ? (
          <Image
            src={product.images[0]}
            alt={`${product.name} in ${colorHint}`}
            fill
            loading="lazy"
            unoptimized={shouldBypassImageOptimization(product.images[0])}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`pointer-events-none object-cover object-center transition duration-700 md:group-hover/product:scale-[1.02] ${
              hasHoverImage ? "md:group-hover/product:opacity-0" : ""
            }`}
          />
        ) : (
          <div
            className="pointer-events-none h-full w-full"
            style={{ backgroundColor: product.accent || "var(--surface-strong)" }}
          />
        )}
        {hasHoverImage ? (
          <Image
            src={hoverImage}
            alt={`${product.name} alternate product view`}
            fill
            loading="lazy"
            unoptimized={shouldBypassImageOptimization(hoverImage)}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="pointer-events-none object-cover object-center opacity-0 transition duration-700 md:group-hover/product:scale-[1.02] md:group-hover/product:opacity-100"
          />
        ) : null}
        {!showQuickSizes ? (
          <button
            type="button"
            onClick={quickAddToCart}
            disabled={availableSizes.length === 0}
            className="absolute inset-x-2 bottom-2 z-20 flex min-h-11 translate-y-1 items-center justify-between border border-white/45 bg-white/92 px-3 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--foreground)] opacity-100 shadow-[0_12px_30px_rgba(17,17,17,0.1)] backdrop-blur-md transition hover:border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] disabled:cursor-not-allowed disabled:border-white/35 disabled:bg-white/72 disabled:text-[var(--muted)] md:opacity-0 md:group-hover/product:translate-y-0 md:group-hover/product:opacity-100"
            aria-label={
              availableSizes.length ? `Quick add ${product.name}` : `${product.name} is sold out`
            }
          >
            <span>{availableSizes.length ? "Quick add" : "Sold out"}</span>
            <span aria-hidden="true">{availableSizes.length > 1 ? "Size" : "+"}</span>
          </button>
        ) : null}
        {showQuickSizes ? (
          <div className="absolute inset-x-2 bottom-2 z-30 border border-[var(--border)] bg-white/95 p-3 shadow-[0_10px_30px_rgba(17,17,17,0.12)] backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em]">Choose size</p>
              <button
                type="button"
                onClick={() => setShowQuickSizes(false)}
                className="h-8 w-8 text-lg"
                aria-label="Close size selection"
              >
                ×
              </button>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {availableSizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => addSelectedSize(size)}
                  className="min-h-10 border border-[var(--border)] text-xs font-semibold uppercase transition hover:border-black hover:bg-black hover:text-white"
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="shop-card-copy block px-0 pb-1 pt-1">
        <Link href={productHref} className="block">
          <p className="line-clamp-2 text-[0.95rem] font-semibold uppercase leading-[1.08] tracking-[0] text-[var(--foreground)] sm:text-[1rem]">
            {product.name}
          </p>
        </Link>
        <p className="mt-1 truncate text-[0.66rem] uppercase tracking-[0.14em] text-[var(--muted)]">
          {productMeta}
        </p>
        <div className="mt-1 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <p className="text-[0.99rem] font-semibold leading-none text-[var(--foreground)] sm:text-[1rem]">
                {formatPrice(product.price)}
              </p>
              {hasDiscount ? (
                <p className="text-[0.74rem] leading-none text-[var(--danger)] line-through decoration-[1.5px] sm:text-[0.78rem]">
                  {formatPrice(compareAtPrice)}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <WishlistButton
              productId={product.id}
              label={`Save ${product.name}`}
              className="flex h-10 w-10 items-center justify-center border border-[var(--border)] bg-white/88 text-[var(--foreground)] transition hover:bg-[var(--foreground)] hover:text-[var(--background)]"
              iconClassName="h-[17px] w-[17px]"
            />
            <button
              type="button"
              onClick={quickAddToCart}
              disabled={availableSizes.length === 0}
              title={availableSizes.length ? "Choose size" : "Sold out"}
              className="flex h-10 w-10 items-center justify-center border border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] transition hover:bg-transparent hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:border-[var(--border)] disabled:bg-[var(--surface-strong)] disabled:text-[var(--muted)]"
              aria-label={availableSizes.length ? `Choose a size for ${product.name}` : `${product.name} is sold out`}
            >
              <CartIcon className="h-[17px] w-[17px]" />
            </button>
          </div>
        </div>
        <div className="mt-1.5 flex min-h-5 flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <div className="flex items-center gap-1">
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
              <span className="ml-0.5 text-[0.72rem] text-[var(--muted)]">
                +{product.colors.length - 4}
              </span>
            ) : null}
          </div>
          <p className="truncate text-[0.66rem] uppercase tracking-[0.14em] text-[var(--muted)]">
            {visibleSizes.length ? visibleSizes.join(" ") : "Sold out"}
          </p>
        </div>
      </div>
    </article>
  );
}
