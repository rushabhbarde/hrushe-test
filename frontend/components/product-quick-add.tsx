"use client";

import { useState, type FocusEvent, type KeyboardEvent, type MouseEvent } from "react";
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
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M12 5v14M5 12h14" strokeLinecap="square" />
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

  const loadProductOptions = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (productDetail) {
      return productDetail;
    }

    if (loading) {
      return product;
    }

    setLoading(true);
    try {
      const detail = await apiRequest<Product>(`/products/${product.slug || product.id}`);
      setProductDetail(detail);
      return detail;
    } catch {
      if (!silent) {
        pushToast("Product options could not be loaded. Please try again.", "error");
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const prepareQuickAdd = async () => {
    const detail = await loadProductOptions();

    if (!detail) {
      return;
    }

    const sizes = getAvailableSizes(detail);
    if (sizes.length > 1) {
      setSelectingSize(true);
    } else {
      addProduct(detail, sizes[0] || "");
    }
  };
  const preventIconClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };
  const handleIconQuickAdd = (event: MouseEvent<HTMLButtonElement>) => {
    preventIconClick(event);
    void prepareQuickAdd();
  };
  const closeIconSelectorOnBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (variant !== "icon") {
      return;
    }

    const nextFocusedElement = event.relatedTarget;
    if (!(nextFocusedElement instanceof Node) || !event.currentTarget.contains(nextFocusedElement)) {
      setSelectingSize(false);
    }
  };
  const closeIconSelectorOnEscape = (event: KeyboardEvent<HTMLDivElement>) => {
    if (variant === "icon" && event.key === "Escape") {
      setSelectingSize(false);
    }
  };

  if (soldOut) {
    return null;
  }

  const wrapperClassName =
    variant === "icon"
      ? "absolute bottom-2 right-2 z-20 hidden h-11 w-11 opacity-0 transition-opacity duration-150 group-hover/card:opacity-100 group-focus-within/card:opacity-100 md:block"
      : "absolute inset-x-3 bottom-3 z-20 hidden md:block";
  const chooserClassName =
    variant === "icon"
      ? "absolute bottom-0 right-0 w-[min(17rem,calc(100vw-2rem))] border border-black/15 bg-[var(--surface)] px-3 py-2.5"
      : "border border-black/15 bg-[var(--surface)] px-3 py-2.5";
  const buttonClassName =
    variant === "icon"
      ? "flex h-11 w-11 items-center justify-center bg-transparent text-[var(--foreground)] transition duration-200 hover:text-[var(--muted)]"
      : "min-h-11 w-full translate-y-2 border border-black/10 bg-[var(--surface)] px-4 text-[0.68rem] font-semibold uppercase tracking-[0.12em] opacity-0 transition duration-200 group-hover/card:translate-y-0 group-hover/card:opacity-100 group-focus-within/card:translate-y-0 group-focus-within/card:opacity-100";

  return (
    <div
      className={wrapperClassName}
      onMouseLeave={variant === "icon" ? () => setSelectingSize(false) : undefined}
      onBlur={closeIconSelectorOnBlur}
      onKeyDown={closeIconSelectorOnEscape}
    >
      {selectingSize && availableSizes.length > 1 ? (
        <div className={chooserClassName} role="group" aria-label="Choose a size to add">
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {availableSizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => addProduct(activeProduct, size)}
                className="hrushe-inverse-hover grid min-h-11 min-w-14 place-items-center border border-[var(--border)] bg-[var(--surface)] px-4 text-[0.68rem] font-semibold uppercase"
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onMouseDown={variant === "icon" ? preventIconClick : undefined}
          onClick={variant === "icon" ? handleIconQuickAdd : () => void prepareQuickAdd()}
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
