"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
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

  useEffect(() => {
    closeCart();
  }, [pathname, closeCart]);

  if (!isCartOpen) {
    return null;
  }

  const total = subtotal;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close cart drawer"
        className="absolute inset-0 bg-black/38 backdrop-blur-[2px]"
        onClick={closeCart}
      />
      <aside
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className="absolute right-0 top-0 flex h-full w-full max-w-[34rem] flex-col border-l border-[var(--border)] bg-[var(--background)] shadow-[0_0_50px_rgba(0,0,0,0.16)]"
      >
        <header className="shrink-0 border-b border-[var(--border)] px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow text-[var(--muted)]">HRUSHE</p>
              <h2
                id="cart-drawer-title"
                className="mt-2 text-xl font-semibold uppercase leading-none tracking-normal"
              >
                Your cart
                {isReady && itemCount > 0 ? (
                  <sup className="ml-1 align-super text-[0.72rem]">{itemCount}</sup>
                ) : null}
              </h2>
            </div>
            <button
              type="button"
              ref={initialFocusRef}
              onClick={closeCart}
              aria-label="Close cart"
              className="flex h-11 w-11 items-center justify-center border border-transparent text-2xl leading-none transition hover:border-[var(--border)] hover:bg-[var(--surface)] focus-visible:border-[var(--foreground)] focus-visible:outline-none"
            >
              ×
            </button>
          </div>

          {isReady && items.length > 0 ? (
            <div className="mt-5">
              <div className="h-1.5 bg-[var(--foreground)]" aria-hidden="true" />
              <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
                Complimentary delivery unlocked. Dispatch within 1–3 business days.
              </p>
            </div>
          ) : null}
        </header>

        <div className="hide-scrollbar mt-6 flex-1 space-y-4 overflow-y-auto">
          {!isReady ? (
            <div className="loading-pulse space-y-0 px-4 sm:px-6">
              {[0, 1].map((item) => (
                <div key={item} className="grid grid-cols-[6.5rem_1fr] border-b border-[var(--border)] py-5">
                  <div className="aspect-[0.84/1] bg-[var(--surface-strong)]" />
                  <div className="px-4">
                    <div className="h-4 w-3/4 bg-[var(--surface-strong)]" />
                    <div className="mt-3 h-3 w-1/2 bg-[var(--surface-strong)]" />
                    <div className="mt-5 h-9 w-full bg-[var(--surface-strong)]" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="mx-4 empty-shell p-6 sm:mx-6">
              <p className="text-lg font-semibold uppercase tracking-normal">Your cart is empty.</p>
              <p className="mt-3 text-sm text-[var(--muted)]">
                Add pieces you are considering and return here for one clean checkout.
              </p>
              <Link
                href="/shop"
                className="button-primary mt-5 inline-flex px-5 py-3 transition"
              >
                Shop now
              </Link>
            </div>
          ) : (
            <div className="px-4 sm:px-6">
              <Link
                href="/policies?tab=returns"
                className="flex min-h-12 w-full items-center justify-between border-y border-[var(--border)] text-left text-sm font-semibold uppercase tracking-[0.08em] transition hover:text-[var(--accent)]"
              >
                <span>Shipping & returns</span>
                <span aria-hidden="true">›</span>
              </Link>

              <div className="divide-y divide-[var(--border)]">
                {items.map((item) => (
                  <article
                    key={`${item.productId}-${item.size}-${item.color}-${item.fit || ""}`}
                    className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-start gap-4 py-5 sm:grid-cols-[7.5rem_minmax(0,1fr)]"
                  >
                    <Link
                      href={`/product/${item.productId}`}
                      className="relative aspect-[0.84/1] overflow-hidden bg-[#f6f6f6]"
                    >
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          unoptimized={shouldBypassImageOptimization(item.image)}
                          sizes="120px"
                          className="object-contain p-2"
                        />
                      ) : (
                        <div className="h-full w-full" style={{ background: item.accent }} />
                      )}
                    </Link>

                    <div className="grid min-w-0 gap-4">
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
                        <div className="min-w-0">
                          <Link
                            href={`/product/${item.productId}`}
                            className="block text-sm font-semibold uppercase leading-5 transition hover:text-[var(--accent)]"
                          >
                            {item.name}
                          </Link>
                          <p className="mt-2 text-sm text-[var(--muted)]">
                            {item.size || "Default"} / {item.color || "Default"}
                            {item.fit ? ` / ${item.fit}` : ""}
                          </p>
                        </div>
                        <p className="whitespace-nowrap text-sm font-semibold">
                          {formatCartPrice(item.price * item.quantity)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <div className="inline-grid grid-cols-3 border border-[var(--border)] text-sm">
                          <button
                            type="button"
                            onClick={() => {
                              const nextQuantity = item.quantity - 1;
                              updateQuantity(
                                item.productId,
                                item.size,
                                item.color,
                                nextQuantity,
                                item.fit
                              );
                              pushToast(
                                nextQuantity <= 0 ? "Item removed from bag" : "Bag updated",
                                nextQuantity <= 0 ? "error" : "success"
                              );
                            }}
                            className="flex h-10 w-10 items-center justify-center transition hover:bg-[var(--hover-fill)]"
                            aria-label={`Decrease quantity of ${item.name}`}
                          >
                            -
                          </button>
                          <span className="flex h-10 w-10 items-center justify-center border-x border-[var(--border)]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              updateQuantity(
                                item.productId,
                                item.size,
                                item.color,
                                item.quantity + 1,
                                item.fit
                              );
                              pushToast("Bag updated");
                            }}
                            className="flex h-10 w-10 items-center justify-center transition hover:bg-[var(--hover-fill)]"
                            aria-label={`Increase quantity of ${item.name}`}
                          >
                            +
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              removeItem(item.productId, item.size, item.color, item.fit);
                              pushToast("Item removed from bag", "error");
                            }}
                            className="flex h-10 w-10 items-center justify-center text-xl text-[var(--muted)] transition hover:bg-[var(--hover-fill)] hover:text-[var(--danger)]"
                            aria-label={`Remove ${item.name}`}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>

        {isReady && items.length > 0 ? (
          <footer className="shrink-0 border-t border-[var(--border)] bg-[var(--background)] px-4 py-4 sm:px-6 sm:py-5">
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted)]">Subtotal</span>
                <span>{formatCartPrice(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted)]">Delivery</span>
                <span>Free</span>
              </div>
              <div className="flex items-center justify-between border-t border-[var(--border)] pt-4 text-base font-semibold">
                <span>Total</span>
                <span>{formatCartPrice(total)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="button-primary mt-5 inline-flex w-full justify-center px-5 py-3 text-xs font-semibold uppercase tracking-[0.1em] transition"
            >
              Secure checkout
            </Link>
            <Link
              href="/cart"
              className="button-secondary mt-3 inline-flex min-h-12 w-full items-center justify-center px-5 text-xs font-semibold uppercase tracking-[0.1em] transition"
            >
              View shopping bag
            </Link>
          </footer>
        ) : null}
      </aside>
    </div>
  );
}
