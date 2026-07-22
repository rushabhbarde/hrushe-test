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
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M7 8.5h10l1 10.5H6L7 8.5Z" strokeLinejoin="round" />
      <path d="M9.5 8.5V7a2.5 2.5 0 0 1 5 0v1.5" strokeLinecap="round" />
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
  const hasMultipleSizes = availableSizes.length > 1;
  const showHoverSizeSelector = variant === "icon" && hasMultipleSizes;
  const showSizeSelector = selectingSize || showHoverSizeSelector;
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
      ? `absolute bottom-2 right-2 z-20 flex min-h-11 max-w-[calc(100%-1rem)] items-end justify-end opacity-100 transition-opacity duration-150 md:pointer-events-none md:opacity-0 md:group-hover/card:pointer-events-auto md:group-hover/card:opacity-100 md:group-focus-within/card:pointer-events-auto md:group-focus-within/card:opacity-100 ${
          showSizeSelector ? "md:left-2 md:max-w-none" : "h-11 w-11"
        }`
      : "absolute inset-x-3 bottom-3 z-20 hidden md:block";
  const chooserClassName =
    variant === "icon"
      ? "max-w-full bg-[var(--surface)] px-1.5 py-1.5 text-[var(--foreground)]"
      : "border border-black/15 bg-[var(--surface)] px-3 py-2.5";
  const chooserVisibilityClassName =
    variant === "icon" && !selectingSize ? "hidden md:flex" : "flex";
  const buttonClassName =
    variant === "icon"
      ? "flex h-11 w-11 items-center justify-center bg-[var(--surface)] text-[var(--foreground)] transition duration-200 hover:bg-white hover:text-[var(--foreground)] disabled:opacity-60"
      : "min-h-11 w-full translate-y-2 border border-black/10 bg-[var(--surface)] px-4 text-[0.68rem] font-semibold uppercase tracking-[0.12em] opacity-0 transition duration-200 group-hover/card:translate-y-0 group-hover/card:opacity-100 group-focus-within/card:translate-y-0 group-focus-within/card:opacity-100";
  const sizeButtonClassName =
    variant === "icon"
      ? "hrushe-inverse-hover grid h-11 min-w-11 place-items-center bg-[var(--surface)] px-3 text-[0.68rem] font-semibold uppercase tracking-[0.08em]"
      : "hrushe-inverse-hover grid min-h-11 min-w-14 place-items-center border border-[var(--border)] bg-[var(--surface)] px-4 text-[0.68rem] font-semibold uppercase";

  return (
    <div
      className={wrapperClassName}
      onMouseLeave={variant === "icon" ? () => setSelectingSize(false) : undefined}
      onMouseEnter={variant === "icon" ? () => void loadProductOptions({ silent: true }) : undefined}
      onFocus={variant === "icon" ? () => void loadProductOptions({ silent: true }) : undefined}
      onBlur={closeIconSelectorOnBlur}
      onKeyDown={closeIconSelectorOnEscape}
    >
      {showSizeSelector ? (
        <div className={`${chooserClassName} ${chooserVisibilityClassName}`} role="group" aria-label="Choose a size to add">
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {availableSizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => addProduct(activeProduct, size)}
                className={sizeButtonClassName}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {!showSizeSelector || (variant === "icon" && hasMultipleSizes && !selectingSize) ? (
        <button
          type="button"
          onMouseDown={variant === "icon" ? preventIconClick : undefined}
          onClick={variant === "icon" ? handleIconQuickAdd : () => void prepareQuickAdd()}
          disabled={loading}
          className={`${buttonClassName} ${variant === "icon" && hasMultipleSizes ? "md:hidden" : ""}`}
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
      ) : null}
    </div>
  );
}
