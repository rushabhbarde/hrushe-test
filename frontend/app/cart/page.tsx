"use client";

import Image from "next/image";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { useCart } from "@/components/cart-provider";
import { useToast } from "@/components/toast-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function CartPage() {
  const { items, subtotal, itemCount, removeItem, updateQuantity } = useCart();
  const { pushToast } = useToast();

  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
          <section>
            <p className="eyebrow text-[var(--accent)]">Cart</p>
            <h1 className="display-font mt-3 text-3xl sm:text-4xl lg:text-5xl">Your selected pieces.</h1>
            <p className="mt-4 max-w-xl text-[var(--muted)]">
              Keep the first checkout flow simple: review products, adjust quantity, and move to
              checkout.
            </p>

            <div className="mt-8 space-y-4">
              {items.length === 0 ? (
                <EmptyState
                  title="Your cart is empty."
                  description="Start with a few essential pieces and come back here to review your order before checkout."
                  ctaHref="/shop"
                  ctaLabel="Start shopping"
                />
              ) : (
                items.map((item) => (
                  <div
                    key={`${item.productId}-${item.size}-${item.color}-${item.fit || ""}`}
                    className="grain-card rounded-[2rem] p-5 sm:p-6"
                  >
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="relative h-[5.5rem] w-20 shrink-0 overflow-hidden rounded-[1.25rem] bg-[#f5f1ea] sm:h-24 sm:w-24 sm:rounded-[1.5rem]">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          ) : (
                            <div
                              className="h-full w-full rounded-[1.5rem]"
                              style={{ background: item.accent }}
                            />
                          )}
                        </div>
                        <div>
                          <p className="text-lg font-semibold sm:text-xl">{item.name}</p>
                          <p className="mt-1 text-sm text-[var(--muted)]">Size: {item.size}</p>
                          <p className="mt-1 text-sm text-[var(--muted)]">
                            Color: {item.color || "Default"}
                          </p>
                          {item.fit ? (
                            <p className="mt-1 text-sm text-[var(--muted)]">Fit: {item.fit}</p>
                          ) : null}
                          <p className="mt-2 text-sm font-semibold">Rs. {item.price}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center overflow-hidden rounded-full border border-[var(--border)] bg-white">
                          <button
                            type="button"
                            onClick={() => {
                              updateQuantity(
                                item.productId,
                                item.size,
                                item.color,
                                item.quantity - 1,
                                item.fit
                              );
                              pushToast("Cart updated");
                            }}
                            className="min-h-11 px-4 py-2"
                          >
                            -
                          </button>
                          <span className="min-w-10 text-center text-sm font-medium">
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
                              pushToast("Cart updated");
                            }}
                            className="min-h-11 px-4 py-2"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            removeItem(item.productId, item.size, item.color, item.fit);
                            pushToast("Item removed", "error");
                          }}
                          className="rounded-full px-4 py-2.5 text-sm text-[var(--accent)]"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 ? (
              <Link
                href="/shop"
                className="button-secondary mt-8 inline-flex rounded-full px-5 py-3 transition"
              >
                Continue shopping
              </Link>
            ) : null}
          </section>

          <aside className="grain-card h-fit rounded-[2rem] p-5 sm:sticky sm:top-24 sm:p-8">
            <p className="eyebrow text-[var(--accent)]">Summary</p>
            <div className="mt-6 space-y-3 text-[var(--muted)]">
              <div className="flex items-center justify-between">
                <span>Total items</span>
                <span>{itemCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>Rs. {subtotal}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Shipping</span>
                <span>Free launch offer</span>
              </div>
            </div>
            <div className="section-divider mt-6" />
            <div className="mt-6 flex items-center justify-between text-lg font-semibold">
              <span>Total</span>
              <span>Rs. {subtotal}</span>
            </div>
            <Link
              href="/checkout"
              className="button-primary mt-8 inline-flex w-full justify-center rounded-full px-5 py-3 transition"
            >
              Proceed to checkout
            </Link>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
