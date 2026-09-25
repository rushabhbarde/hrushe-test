"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { shouldBypassImageOptimization } from "@/lib/image-source";
import { useDialogAccessibility } from "@/lib/use-dialog-accessibility";
import { useToast } from "@/components/toast-provider";

function formatCartPrice(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export function CartDrawer() {
  const {
    items,
    subtotal,
    itemCount,
    isCartOpen,
    isReady,
    closeCart,
    removeItem,
    updateQuantity,
  } = useCart();
  const { pushToast } = useToast();
  const pathname = usePathname();
  const { dialogRef, initialFocusRef } = useDialogAccessibility(isCartOpen, closeCart);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    closeCart();
  }, [pathname, closeCart]);

  if (!isCartOpen) {
    return null;
  }

  const activeIndex = Math.min(selected, Math.max(items.length - 1, 0));
  const activeItem = items[activeIndex];

  return (
    <div className="fixed inset-0 z-[115]">
      <button
        type="button"
        aria-label="Close bag"
        className="absolute inset-0 bg-black/30"
        onClick={closeCart}
      />
      <aside
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className="absolute right-0 top-0 flex h-[100dvh] w-full max-w-[30rem] flex-col bg-[var(--background)]"
      >
        <header className="flex shrink-0 items-center justify-between px-5 pb-3 pt-5 sm:px-8 sm:pt-7">
          <h2 id="cart-drawer-title" className="flex items-baseline gap-3">
            <span className="fr-word text-[2.75rem]">Bag</span>
            {isReady ? <span className="fr-mono fr-muted">{String(itemCount).padStart(2, "0")}</span> : null}
          </h2>
          <button
            type="button"
            ref={initialFocusRef}
            onClick={closeCart}
            className="fr-mono fr-choice is-active min-h-11"
          >
            Close
          </button>
        </header>

        <div className="hide-scrollbar flex-1 overflow-y-auto px-5 sm:px-8">
          {!isReady ? (
            <div className="loading-pulse flex flex-col gap-4 pt-4">
              <div className="aspect-[3/4] w-40 bg-[var(--surface-strong)]" />
              <div className="h-8 w-2/3 bg-[var(--surface-strong)]" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col gap-5 pt-10">
              <p className="fr-word text-[2.5rem]">Nothing here yet.</p>
              <p className="text-[0.9rem] text-[var(--muted)]">Pieces you add will wait here for one calm checkout.</p>
              <div className="fr-mono flex gap-6">
                <Link href="/collection/men" className="fr-link">Shop men</Link>
                <Link href="/collection/women" className="fr-link">Shop women</Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 pb-6 pt-2">
              {activeItem ? (
                <Link href={`/product/${activeItem.productId}`} className="fr-frame block aspect-[3/4] w-40 sm:w-48" aria-label={`View ${activeItem.name}`}>
                  <span className="fr-frame__layer is-active">
                    {activeItem.image ? (
                      <Image
                        src={activeItem.image}
                        alt={activeItem.name}
                        fill
                        unoptimized={shouldBypassImageOptimization(activeItem.image)}
                        sizes="200px"
                      />
                    ) : (
                      <span className="block h-full w-full" style={{ background: activeItem.accent }} />
                    )}
                  </span>
                </Link>
              ) : null}

              <ul className="flex flex-col">
                {items.map((item, index) => (
                  <li
                    key={`${item.productId}-${item.size}-${item.color}-${item.fit || ""}`}
                    className="flex flex-col gap-2 border-b border-[var(--border)] py-4"
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <button
                        type="button"
                        onClick={() => setSelected(index)}
                        className={`fr-choice fr-word text-left text-[1.75rem]! ${index === activeIndex ? "is-active" : ""}`}
                      >
                        {item.name}
                      </button>
                      <span className="shrink-0 text-[0.95rem]">{formatCartPrice(item.price * item.quantity)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="fr-mono fr-muted">
                        {[item.color, item.size ? `Size ${item.size}` : "", item.fit].filter(Boolean).join(" · ")}
                      </span>
                      <div className="fr-mono flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const nextQuantity = item.quantity - 1;
                            updateQuantity(item.productId, item.size, item.color, nextQuantity, item.fit);
                            pushToast(
                              nextQuantity <= 0 ? "Item removed from bag" : "Bag updated",
                              nextQuantity <= 0 ? "error" : "success"
                            );
                          }}
                          className="fr-choice is-active h-11 w-9 text-center"
                          aria-label={`Decrease quantity of ${item.name}`}
                        >
                          −
                        </button>
                        <span aria-label={`Quantity ${item.quantity}`}>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => {
                            updateQuantity(item.productId, item.size, item.color, item.quantity + 1, item.fit);
                            pushToast("Bag updated");
                          }}
                          className="fr-choice is-active h-11 w-9 text-center"
                          aria-label={`Increase quantity of ${item.name}`}
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            removeItem(item.productId, item.size, item.color, item.fit);
                            pushToast("Item removed from bag", "error");
                          }}
                          className="fr-choice ml-3 min-h-11"
                          aria-label={`Remove ${item.name}`}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {isReady && items.length > 0 ? (
          <footer className="flex shrink-0 flex-col gap-3 border-t border-[var(--border)] px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:px-8">
            <div className="flex items-baseline justify-between">
              <span className="fr-mono">Total · delivery free</span>
              <span className="fr-word text-[2rem]">{formatCartPrice(subtotal)}</span>
            </div>
            <Link href="/checkout" className="fr-button">
              Checkout
            </Link>
            <div className="flex items-center justify-between">
              <Link href="/cart" className="fr-mono fr-link">
                View bag
              </Link>
              <span className="fr-mono fr-muted">One free size exchange</span>
            </div>
          </footer>
        ) : null}
      </aside>
    </div>
  );
}
