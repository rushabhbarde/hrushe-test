"use client";

import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { useToast } from "@/components/toast-provider";
import { apiRequest } from "@/lib/api";
import type { Product } from "@/lib/catalog";
import { getProductDisplayName } from "@/lib/product-presentation";

function getAvailableSizes(product: Product) {
  const sizes = product.sizes || [];

  if (!product.trackInventory) {
    return sizes;
  }

  return sizes.filter((size) =>
    product.variants?.some(
      (variant) =>
        variant.active &&
        variant.stock > 0 &&
        variant.size.toLowerCase() === size.toLowerCase()
    )
  );
}

function QuickAddBagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M7 9V7a5 5 0 0 1 10 0v2" strokeLinecap="square" />
      <path d="M5.5 8.5h13l-1 11h-11l-1-11Z" />
    </svg>
  );
}

export function ProductQuickAdd({
  product,
  variant = "bar",
}: {
  product: Product;
  variant?: "bar" | "icon";
}) {
  const { addItem, openCart } = useCart();
  const { pushToast } = useToast();
  const [selectingSize, setSelectingSize] = useState(false);
  const [loading, setLoading] = useState(false);
  const [productDetail, setProductDetail] = useState<Product | null>(null);
  const activeProduct = productDetail || product;
  const availableSizes = getAvailableSizes(activeProduct);
  const soldOut =
    product.status === "Sold Out" ||
    product.availability === "sold-out" ||
    (product.trackInventory && !product.variants?.some((variant) => variant.active && variant.stock > 0));

  const addProduct = (source: Product, size = "") => {
    const productName = getProductDisplayName(source);
    addItem({
      productId: source.id,
      name: productName,
      price: source.price,
      size,
      color: source.colour || source.colors?.[0] || "",
      quantity: 1,
      accent: source.accent,
      image: source.thumbnailUrl || source.images?.[0],
    });
    setSelectingSize(false);
    pushToast(`${productName} added to bag`);
    openCart();
  };

  const prepareQuickAdd = async () => {
    if (productDetail) {
      const sizes = getAvailableSizes(productDetail);
      if (sizes.length > 1) {
        setSelectingSize(true);
      } else {
        addProduct(productDetail, sizes[0] || "");
      }
      return;
    }

    setLoading(true);
    try {
      const detail = await apiRequest<Product>(`/products/${product.slug || product.id}`);
      const sizes = getAvailableSizes(detail);
      setProductDetail(detail);
      if (sizes.length > 1) {
        setSelectingSize(true);
      } else {
        addProduct(detail, sizes[0] || "");
      }
    } catch {
      pushToast("Product options could not be loaded. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (soldOut) {
    return null;
  }

  const wrapperClassName =
    variant === "icon"
      ? "absolute bottom-12 right-4 z-20 hidden md:block"
      : "absolute inset-x-3 bottom-3 z-20 hidden md:block";
  const chooserClassName =
    variant === "icon"
      ? "w-[min(18rem,calc(100vw-2rem))] border border-black/15 bg-[var(--surface)] p-2"
      : "border border-black/15 bg-[var(--surface)] p-2";
  const buttonClassName =
    variant === "icon"
      ? "flex h-6 w-6 items-center justify-center bg-[var(--surface)] text-[var(--foreground)] opacity-0 transition duration-200 hover:bg-white group-hover/card:opacity-100 group-focus-within/card:opacity-100"
      : "min-h-11 w-full translate-y-2 border border-black/10 bg-[var(--surface)] px-4 text-[0.68rem] font-semibold uppercase tracking-[0.12em] opacity-0 transition duration-200 group-hover/card:translate-y-0 group-hover/card:opacity-100 group-focus-within/card:translate-y-0 group-focus-within/card:opacity-100";

  return (
    <div className={wrapperClassName}>
      {selectingSize && availableSizes.length > 1 ? (
        <div className={chooserClassName} role="group" aria-label="Choose a size to add">
          <div className="grid grid-cols-4 gap-1.5">
            {availableSizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => addProduct(activeProduct, size)}
                className="min-h-10 border border-[var(--border)] bg-[var(--surface)] text-[0.68rem] font-semibold uppercase hover:border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)]"
              >
                {size}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSelectingSize(false)}
            className="mt-2 min-h-9 w-full text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => void prepareQuickAdd()}
          disabled={loading}
          className={buttonClassName}
          aria-label={`Quick add ${getProductDisplayName(product)}`}
        >
          {variant === "icon" ? (
            loading ? (
              <span aria-hidden="true">…</span>
            ) : (
              <QuickAddBagIcon />
            )
          ) : loading ? (
            "Loading options…"
          ) : (
            "Quick add"
          )}
        </button>
      )}
    </div>
  );
}
