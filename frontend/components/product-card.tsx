"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { useToast } from "@/components/toast-provider";
import type { Product } from "@/lib/catalog";
import { shouldBypassImageOptimization } from "@/lib/image-source";
import {
  getProductDisplayName,
  getProductFabricLine,
} from "@/lib/product-presentation";
import { useState } from "react";

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
  return `₹${value.toLocaleString("en-IN")}`;
}

export function ProductCard({ product }: { product: Product }) {
  const { addItem, openCart } = useCart();
  const { pushToast } = useToast();
  const [showQuickSizes, setShowQuickSizes] = useState(false);
  const hasImage = Boolean(product.images[0]);
  const hoverImage = product.images[1] || product.galleryImages?.[0] || "";
  const hasHoverImage = Boolean(hoverImage && hoverImage !== product.images[0]);
  const productHref = `/product/${product.slug || product.id}`;
  const colorHint = product.colors.length > 0 ? product.colors.join(", ") : "HRUSHE";
  const productName = getProductDisplayName(product);
  const productMeta = getProductFabricLine(product);
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
      name: productName,
      price: product.price,
      size,
      color: availableVariant?.color || product.colors[0] || "Default",
      fit: product.fitType === "Oversized" ? "Oversize" : product.fitType || "",
      quantity: 1,
      accent: product.accent,
      image: product.images[0],
    });
    pushToast(`${productName} added to bag.`);
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
  return (
    <article data-product-card className="group/product reveal-up-soft flex min-w-0 flex-col">
      <div
        className="shop-card-image relative aspect-[18/25] overflow-hidden bg-[#f6f6f3]"
        style={{ backgroundColor: "var(--surface-strong)" }}
      >
        <Link href={productHref} className="absolute inset-0 z-10" aria-label={productName} />
        {hasImage ? (
          <Image
            src={product.images[0]}
            alt={`${productName} in ${colorHint}`}
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
            alt={`${productName} alternate product view`}
            fill
            loading="lazy"
            unoptimized={shouldBypassImageOptimization(hoverImage)}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="pointer-events-none object-cover object-center opacity-0 transition duration-700 md:group-hover/product:scale-[1.02] md:group-hover/product:opacity-100"
          />
        ) : null}
        {showQuickSizes ? (
          <div className="absolute inset-x-3 bottom-3 z-30 border border-[var(--border)] bg-[var(--surface)] p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em]">Choose size</p>
              <button
                type="button"
                onClick={() => setShowQuickSizes(false)}
                className="h-11 w-11 text-lg"
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
                  className="min-h-11 border border-[var(--border)] text-xs font-semibold uppercase transition hover:border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)]"
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {!showQuickSizes ? (
          <button
            type="button"
            onClick={quickAddToCart}
            disabled={availableSizes.length === 0}
            className="absolute inset-x-3 bottom-3 z-20 min-h-11 translate-y-2 bg-[rgba(252,251,248,0.96)] px-4 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[var(--foreground)] opacity-0 transition duration-200 hover:bg-[var(--foreground)] hover:text-[var(--background)] disabled:cursor-not-allowed md:group-hover/product:translate-y-0 md:group-hover/product:opacity-100"
            aria-label={availableSizes.length ? `Choose a size for ${productName}` : `${productName} is sold out`}
          >
            {availableSizes.length ? "Choose size" : "Sold out"}
          </button>
        ) : null}
      </div>

      <div className="shop-card-copy flex flex-1 flex-col px-0 pb-1 pt-3">
        <Link href={productHref} className="block">
          <p className="line-clamp-2 text-[0.78rem] font-medium leading-[1.35] text-[var(--foreground)] sm:text-[0.88rem]">
            {productName}
          </p>
        </Link>
        <p className="mt-1.5 truncate text-[0.62rem] uppercase tracking-[0.12em] text-[var(--muted)] sm:text-[0.66rem]">
          {productMeta}
        </p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-[0.82rem] font-semibold leading-none text-[var(--foreground)] sm:text-[0.9rem]">
            {formatPrice(product.price)}
          </p>
          <div className="flex items-center gap-1">
            {product.colors.slice(0, 4).map((color) => (
              <span
                key={color}
                className="h-2 w-2 border border-[var(--border)]"
                style={{
                  backgroundColor:
                    swatchColors[color.toLowerCase().trim()] ||
                    product.accent ||
                    "#d9d9d9",
                }}
              />
            ))}
          </div>
        </div>
        <div className="mt-auto pt-3 md:hidden">
          <button
            type="button"
            onClick={quickAddToCart}
            disabled={availableSizes.length === 0}
            className="min-h-11 w-full border border-[var(--border)] text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--foreground)] disabled:text-[var(--muted)]"
            aria-label={availableSizes.length ? `Quick add ${productName}` : `${productName} is sold out`}
          >
            {availableSizes.length ? "Choose size" : "Sold out"}
          </button>
        </div>
      </div>
    </article>
  );
}
