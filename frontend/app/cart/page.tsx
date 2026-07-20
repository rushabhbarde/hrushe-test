"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { useCart, type CartLine } from "@/components/cart-provider";
import { ProductCard } from "@/components/product-card";
import { useToast } from "@/components/toast-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ServicePromise } from "@/components/service-promise";
import { useWishlist } from "@/components/wishlist-provider";
import type { Product } from "@/lib/catalog";
import { shouldBypassImageOptimization } from "@/lib/image-source";
import { useStorefrontData } from "@/lib/use-storefront";

const shipping = 0;

function formatPrice(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function lineKey(item: Pick<CartLine, "productId" | "size" | "color" | "fit">) {
  return `${item.productId}-${item.size}-${item.color}-${item.fit || ""}`;
}

function QuantityControl({
  item,
  active,
  onChange,
}: {
  item: CartLine;
  active: boolean;
  onChange: (nextQuantity: number) => void;
}) {
  return (
    <div
      className={`inline-grid grid-cols-3 overflow-hidden border border-[var(--border)] bg-white/70 text-center transition ${
        active ? "scale-105 shadow-[0_10px_24px_rgba(17,17,17,0.1)]" : ""
      }`}
      aria-label={`Quantity for ${item.name}`}
    >
      <button
        type="button"
        onClick={() => onChange(item.quantity - 1)}
        className="flex h-11 w-11 items-center justify-center text-sm transition hover:bg-[var(--hover-fill)]"
        aria-label="Decrease quantity"
      >
        -
      </button>
      <span className="flex h-11 w-11 items-center justify-center border-x border-[var(--border)] text-sm">
        {item.quantity}
      </span>
      <button
        type="button"
        onClick={() => onChange(item.quantity + 1)}
        className="flex h-11 w-11 items-center justify-center text-sm transition hover:bg-[var(--hover-fill)]"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}

function CartPageSkeleton() {
  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="lux-page py-8 sm:py-10 lg:py-14">
        <div className="lux-container loading-pulse">
          <div className="h-3 w-24 bg-[var(--surface-strong)]" />
          <div className="mt-4 h-12 w-64 max-w-full bg-[var(--surface-strong)]" />
          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-8">
            <div className="grid gap-0">
              {[0, 1].map((item) => (
                <div key={item} className="grid grid-cols-[8rem_1fr] border border-b-0 border-[var(--border)]">
                  <div className="aspect-[0.84/1] bg-[var(--surface-strong)]" />
                  <div className="p-5">
                    <div className="h-4 w-3/4 bg-[var(--surface-strong)]" />
                    <div className="mt-3 h-3 w-1/2 bg-[var(--surface-strong)]" />
                  </div>
                </div>
              ))}
            </div>
            <div className="h-72 border border-[var(--border)] bg-[rgba(255,255,255,0.5)] p-5">
              <div className="h-4 w-32 bg-[var(--surface-strong)]" />
              <div className="mt-8 h-3 w-full bg-[var(--surface-strong)]" />
              <div className="mt-4 h-3 w-4/5 bg-[var(--surface-strong)]" />
              <div className="mt-10 h-12 w-full bg-[var(--surface-strong)]" />
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export default function CartPage() {
  const { items, subtotal, itemCount, isReady, removeItem, updateQuantity } = useCart();
  const { wishlistIds, isWishlisted, toggleWishlist, removeWishlistItem } = useWishlist();
  const { products } = useStorefrontData();
  const { pushToast } = useToast();
  const [activeCartTab, setActiveCartTab] = useState<"bag" | "favourites">("bag");
  const [removingKeys, setRemovingKeys] = useState<string[]>([]);
  const [bumpedKey, setBumpedKey] = useState("");
  const total = subtotal + shipping;
  const hasSavedProducts = wishlistIds.length > 0;
  const canCheckout = items.length > 0;
  const wishlistProducts = useMemo<Product[]>(
    () =>
      wishlistIds
        .map((productId) => products.find((product) => product.id === productId))
        .filter((product): product is Product => Boolean(product)),
    [products, wishlistIds]
  );
  const recommendedProducts = useMemo(
    () =>
      products
        .filter((product) => !items.some((item) => item.productId === product.id))
        .slice(0, 4),
    [items, products]
  );

  const removeCartLine = (item: CartLine, toast = "Item removed") => {
    const key = lineKey(item);
    setRemovingKeys((current) => (current.includes(key) ? current : [...current, key]));
    window.setTimeout(() => {
      removeItem(item.productId, item.size, item.color, item.fit);
      setRemovingKeys((current) => current.filter((itemKey) => itemKey !== key));
      pushToast(toast, toast.includes("removed") ? "error" : "success");
    }, 240);
  };

  const moveToWishlist = (item: CartLine) => {
    if (!isWishlisted(item.productId)) {
      toggleWishlist(item.productId);
    }

    removeCartLine(item, "Moved to saved");
  };

  const changeQuantity = (item: CartLine, nextQuantity: number) => {
    const key = lineKey(item);
    setBumpedKey(key);
    window.setTimeout(() => setBumpedKey(""), 220);
    updateQuantity(item.productId, item.size, item.color, nextQuantity, item.fit);
    pushToast(nextQuantity <= 0 ? "Item removed" : "Cart updated", nextQuantity <= 0 ? "error" : "success");
  };

  if (!isReady) {
    return <CartPageSkeleton />;
  }

  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="lux-page py-8 sm:py-10 lg:py-14">
        <div className="lux-container">
          {items.length === 0 && !hasSavedProducts ? (
            <section className="mx-auto max-w-3xl py-10">
              <h1 className="sr-only">Shopping bag</h1>
              <EmptyState
                title="Your shopping bag is empty."
                description="Your bag is waiting. Add everyday pieces you will actually reach for."
                ctaHref="/shop"
                ctaLabel="Explore collection"
              />
            </section>
          ) : (
            <>
              <div className="reveal-up mx-auto max-w-3xl text-center">
                <p className="eyebrow text-[var(--accent)]">Cart</p>
                <h1 className="mt-4 text-3xl font-semibold uppercase leading-none tracking-normal sm:text-4xl">
                  Shopping bag
                </h1>
                <div className="mt-8 inline-flex max-w-full flex-wrap items-center justify-center gap-x-6 gap-y-3 border-b border-[var(--border)] pb-3 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                  <button
                    type="button"
                    onClick={() => setActiveCartTab("bag")}
                    className={`transition hover:text-[var(--foreground)] ${
                      activeCartTab === "bag" ? "text-[var(--foreground)]" : ""
                    }`}
                    aria-pressed={activeCartTab === "bag"}
                  >
                    Shopping bag ({itemCount})
                  </button>
                  <button
                    type="button"
                    className={`transition hover:text-[var(--foreground)] ${
                      activeCartTab === "favourites" ? "text-[var(--foreground)]" : ""
                    }`}
                    onClick={() => setActiveCartTab("favourites")}
                    aria-pressed={activeCartTab === "favourites"}
                  >
                    Saved ({wishlistIds.length})
                  </button>
                </div>
              </div>

              <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start xl:gap-10">
                {activeCartTab === "bag" ? (
                  <section className="reveal-up min-w-0">
                    {items.length === 0 ? (
                      <EmptyState
                        title="Your bag is still empty."
                        description="Move one of your saved pieces into the bag when you are ready to checkout."
                        ctaHref="/shop"
                        ctaLabel="Explore products"
                      />
                    ) : (
                      <div className="border border-b-0 border-[var(--border)]">
                        {items.map((item) => {
                          const key = lineKey(item);
                          const removing = removingKeys.includes(key);

                          return (
                            <article
                              key={key}
                              className={`grid min-w-0 grid-cols-[7rem_minmax(0,1fr)] items-start border-b border-[var(--border)] bg-[var(--surface)] transition-all duration-300 sm:grid-cols-[11rem_minmax(0,1fr)] ${
                                removing ? "-translate-y-2 scale-[0.98] opacity-0" : "opacity-100"
                              }`}
                            >
                              <Link
                                href={`/product/${item.productId}`}
                                className="relative aspect-[0.84/1] overflow-hidden bg-[#f4f4f4]"
                              >
                                {item.image ? (
                                  <Image
                                    src={item.image}
                                    alt={item.name}
                                    fill
                                    unoptimized={shouldBypassImageOptimization(item.image)}
                                    sizes="(max-width: 640px) 112px, 176px"
                                    className="object-contain p-2 sm:p-3"
                                  />
                                ) : (
                                  <div className="h-full w-full" style={{ background: item.accent }} />
                                )}
                              </Link>

                              <div className="grid min-w-0 gap-4 border-l border-[var(--border)] p-4 sm:p-5">
                                <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                                  <div className="min-w-0">
                                    <Link
                                      href={`/product/${item.productId}`}
                                      className="block text-sm font-semibold uppercase leading-5 transition hover:text-[var(--accent)] sm:text-base"
                                    >
                                      {item.name}
                                    </Link>
                                    <p className="mt-2 text-sm text-[var(--muted)]">
                                      {item.color || "Default"} / {item.size || "OS"}
                                      {item.fit ? ` / ${item.fit}` : ""}
                                    </p>
                                  </div>
                                  <p className="whitespace-nowrap text-sm font-semibold sm:text-base">
                                    {formatPrice(item.price * item.quantity)}
                                  </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-4">
                                  <QuantityControl
                                    item={item}
                                    active={bumpedKey === key}
                                    onChange={(nextQuantity) => changeQuantity(item, nextQuantity)}
                                  />
                                  <div className="flex min-h-11 items-center gap-2 border border-[var(--border)] px-3 text-xs uppercase tracking-[0.1em] text-[var(--muted)]">
                                    <span>Size</span>
                                    <span className="font-semibold text-[var(--foreground)]">
                                      {item.size || "OS"}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => moveToWishlist(item)}
                                    className="flex min-h-11 items-center justify-center border border-[var(--border)] px-3 text-xs font-semibold uppercase tracking-[0.1em] transition hover:bg-[var(--foreground)] hover:text-[var(--background)]"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeCartLine(item)}
                                    className="ml-auto flex min-h-11 min-w-11 items-center justify-center text-xl text-[var(--muted)] transition hover:bg-[var(--hover-fill)] hover:text-[var(--danger)]"
                                    aria-label={`Remove ${item.name}`}
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </section>
                ) : (
                  <section className="reveal-up grid min-w-0 gap-x-10 gap-y-9 md:grid-cols-2 xl:gap-y-10">
                    {wishlistProducts.length === 0 ? (
                      <div className="md:col-span-2">
                        <EmptyState
                          title="No saved pieces yet."
                          description="Use the save icon on any product card to keep it here, then move it into your bag whenever you are ready."
                          ctaHref="/shop"
                          ctaLabel="Browse products"
                        />
                      </div>
                    ) : (
                      wishlistProducts.map((product) => (
                        <article key={product.id} className="min-w-0">
                          <ProductCard product={product} />
                          <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            <Link
                              href={`/product/${product.slug || product.id}`}
                              className="lux-action w-full"
                            >
                              Choose size
                            </Link>
                            <button
                              type="button"
                              onClick={() => {
                                removeWishlistItem(product.id);
                                pushToast("Removed from saved.", "error");
                              }}
                              className="lux-action-muted w-full"
                            >
                              Remove
                            </button>
                          </div>
                        </article>
                      ))
                    )}
                  </section>
                )}

                <aside className="reveal-up-delayed lg:sticky lg:top-28 lg:self-start">
                  <div className="border border-[var(--border)] bg-[var(--surface)]">
                    <div className="border-b border-[var(--border)] px-5 py-5 sm:px-6">
                      <p className="text-sm font-semibold uppercase leading-6 tracking-[0.08em]">
                        Checkout securely with Razorpay. Delivery is complimentary on HRUSHE orders.
                      </p>
                    </div>
                    <div className="px-5 py-5 sm:px-6">
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[var(--muted)]">Subtotal</span>
                          <span>{formatPrice(subtotal)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[var(--muted)]">Delivery</span>
                          <span>{shipping ? formatPrice(shipping) : "Free"}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[var(--muted)]">Estimated tax</span>
                          <span>Included</span>
                        </div>
                        <div className="border-t border-[var(--foreground)] pt-5">
                          <div className="flex items-center justify-between gap-4 text-xl font-semibold">
                            <span>Total</span>
                            <span>{formatPrice(total)}</span>
                          </div>
                        </div>
                      </div>

                      <Link
                        href={canCheckout ? "/checkout" : "#"}
                        aria-disabled={!canCheckout}
                        onClick={(event) => {
                          if (!items.length) {
                            event.preventDefault();
                            pushToast("Move a saved piece to your bag before checkout.", "error");
                          }
                        }}
                        className={`lux-action mt-6 w-full ${canCheckout ? "" : "pointer-events-auto opacity-45"}`}
                      >
                        Secure checkout
                      </Link>
                      <Link href="/shop" className="lux-action-muted mt-3 w-full">
                        Continue shopping
                      </Link>
                      <p className="mt-5 text-center text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                        {itemCount} item{itemCount === 1 ? "" : "s"} in bag
                      </p>
                    </div>
                    <div className="border-t border-[var(--border)]">
                      <ServicePromise compact />
                    </div>
                  </div>
                  <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
                    Terms and return eligibility are reviewed once at payment. See our{" "}
                    <Link href="/policies?tab=returns" className="underline underline-offset-4">
                      returns policy
                    </Link>.
                  </p>
                </aside>
              </div>
              {recommendedProducts.length > 0 ? (
                <section className="mt-12">
                  <p className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--muted)]">
                    You may also like
                  </p>
                  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4 xl:gap-6">
                    {recommendedProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
