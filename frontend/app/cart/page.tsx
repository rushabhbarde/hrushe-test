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
import { TrustBadges } from "@/components/trust-badges";
import { useWishlist } from "@/components/wishlist-provider";
import type { Product } from "@/lib/catalog";
import { shouldBypassImageOptimization } from "@/lib/image-source";
import { useStorefrontData } from "@/lib/use-storefront";

const shipping = 0;
const freeShippingThreshold = 1499;

function formatPrice(value: number) {
  return `Rs. ${value.toLocaleString("en-IN")}`;
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
      className={`inline-grid overflow-hidden border border-[var(--border)] bg-white/70 text-center transition ${
        active ? "scale-105 shadow-[0_10px_24px_rgba(17,17,17,0.1)]" : ""
      }`}
      aria-label={`Quantity for ${item.name}`}
    >
      <button
        type="button"
        onClick={() => onChange(item.quantity + 1)}
        className="flex h-8 w-8 items-center justify-center text-sm transition hover:bg-[var(--hover-fill)]"
        aria-label="Increase quantity"
      >
        +
      </button>
      <span className="flex h-8 w-8 items-center justify-center border-y border-[var(--border)] text-sm">
        {item.quantity}
      </span>
      <button
        type="button"
        onClick={() => onChange(item.quantity - 1)}
        className="flex h-8 w-8 items-center justify-center text-sm transition hover:bg-[var(--hover-fill)]"
        aria-label="Decrease quantity"
      >
        -
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
          <div className="mt-10 grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-12">
            <div className="grid gap-6 md:grid-cols-2">
              {[0, 1].map((item) => (
                <div key={item} className="border border-[var(--border)] p-4">
                  <div className="aspect-[0.84/1] bg-[var(--surface-strong)]" />
                  <div className="mt-4 h-4 w-3/4 bg-[var(--surface-strong)]" />
                  <div className="mt-3 h-3 w-1/2 bg-[var(--surface-strong)]" />
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
  const { items, subtotal, itemCount, isReady, addItem, removeItem, updateQuantity } = useCart();
  const { wishlistIds, isWishlisted, toggleWishlist, removeWishlistItem } = useWishlist();
  const { products } = useStorefrontData();
  const { pushToast } = useToast();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [activeCartTab, setActiveCartTab] = useState<"bag" | "favourites">("bag");
  const [removingKeys, setRemovingKeys] = useState<string[]>([]);
  const [bumpedKey, setBumpedKey] = useState("");
  const total = subtotal + shipping;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const hasSavedProducts = wishlistIds.length > 0;
  const canCheckout = acceptedTerms && items.length > 0;
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

    removeCartLine(item, "Moved to wishlist");
  };

  const changeQuantity = (item: CartLine, nextQuantity: number) => {
    const key = lineKey(item);
    setBumpedKey(key);
    window.setTimeout(() => setBumpedKey(""), 220);
    updateQuantity(item.productId, item.size, item.color, nextQuantity, item.fit);
    pushToast(nextQuantity <= 0 ? "Item removed" : "Cart updated", nextQuantity <= 0 ? "error" : "success");
  };

  const moveFavouriteToBag = (product: Product) => {
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
    removeWishlistItem(product.id);
    setActiveCartTab("bag");
    pushToast("Moved favourite to bag.");
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
              <EmptyState
                title="Your shopping bag is empty."
                description="Your bag is waiting. Add everyday pieces you will actually reach for."
                ctaHref="/shop"
                ctaLabel="Explore collection"
              />
            </section>
          ) : (
            <>
              <div className="reveal-up flex flex-col gap-5 border-b border-[var(--border)] pb-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="eyebrow text-[var(--accent)]">
                    {activeCartTab === "bag" ? "Shopping bag" : "Favourites"}
                  </p>
                  <h1 className="display-font mt-3 text-4xl tracking-[-0.06em] sm:text-5xl lg:text-6xl">
                    {activeCartTab === "bag" ? "Selected pieces." : "Saved pieces."}
                  </h1>
                </div>
                <div className="inline-flex w-fit items-center border border-[var(--border)] bg-white/62 p-1 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                  <button
                    type="button"
                    onClick={() => setActiveCartTab("bag")}
                    className={`px-4 py-2 transition hover:text-[var(--foreground)] ${
                      activeCartTab === "bag" ? "bg-white text-[var(--foreground)]" : ""
                    }`}
                    aria-pressed={activeCartTab === "bag"}
                  >
                    Bag
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 transition hover:text-[var(--foreground)] ${
                      activeCartTab === "favourites" ? "bg-white text-[var(--foreground)]" : ""
                    }`}
                    onClick={() => setActiveCartTab("favourites")}
                    aria-pressed={activeCartTab === "favourites"}
                  >
                    Favourites
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-12">
                {activeCartTab === "bag" ? (
                  <section className="reveal-up grid min-w-0 gap-x-10 gap-y-8 md:grid-cols-2 xl:gap-y-10">
                    {items.length === 0 ? (
                      <div className="md:col-span-2">
                        <EmptyState
                          title="Your bag is still empty."
                          description="Move one of your favourites into the bag when you are ready to checkout."
                          ctaHref="/shop"
                          ctaLabel="Explore products"
                        />
                      </div>
                    ) : (
                      items.map((item) => {
                        const key = lineKey(item);
                        const removing = removingKeys.includes(key);

                        return (
                          <article
                            key={key}
                            className={`lux-panel lux-hover-lift group min-w-0 overflow-hidden p-0 transition-all duration-300 ${
                              removing ? "-translate-y-2 scale-[0.98] opacity-0" : "opacity-100"
                            }`}
                          >
                            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_4.25rem] sm:grid-cols-[minmax(0,1fr)_4.75rem]">
                              <div className="min-w-0">
                                <div className="relative aspect-[0.84/1] overflow-hidden border-b border-[var(--border)] bg-[#f4f4f4]">
                                  {item.image ? (
                                    <Image
                                      src={item.image}
                                      alt={item.name}
                                      fill
                                      unoptimized={shouldBypassImageOptimization(item.image)}
                                      sizes="(max-width: 768px) 74vw, 34vw"
                                      className="object-cover transition duration-500 group-hover:scale-[1.025]"
                                    />
                                  ) : (
                                    <div className="h-full w-full" style={{ background: item.accent }} />
                                  )}
                                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/18 to-transparent opacity-0 transition group-hover:opacity-100" />
                                  <button
                                    type="button"
                                    onClick={() => moveToWishlist(item)}
                                    className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center border border-white/50 bg-white/92 text-lg text-[var(--muted)] shadow-[0_12px_28px_rgba(17,17,17,0.12)] transition hover:-translate-y-0.5 hover:bg-[var(--foreground)] hover:text-[var(--background)]"
                                    aria-label={`Save ${item.name} for later`}
                                  >
                                    ♡
                                  </button>
                                </div>

                                <div className="bg-[color-mix(in_srgb,var(--surface)_76%,transparent)] p-4 sm:p-5">
                                  <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4">
                                    <div className="min-w-0">
                                      <p className="text-sm leading-none text-[var(--muted)]">
                                        {item.fit || "Cotton T Shirt"}
                                      </p>
                                      <Link
                                        href={`/product/${item.productId}`}
                                        className="mt-2 block text-lg font-semibold uppercase leading-[1.05] tracking-[-0.045em] transition hover:text-[var(--accent)] sm:text-xl"
                                      >
                                        {item.name}
                                      </Link>
                                    </div>
                                    <p className="whitespace-nowrap text-lg font-semibold leading-none">
                                      {formatPrice(item.price)}
                                    </p>
                                  </div>
                                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--border)] pt-3 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                                    <button
                                      type="button"
                                      onClick={() => moveToWishlist(item)}
                                      className="underline underline-offset-4 transition hover:text-[var(--foreground)]"
                                    >
                                      Save for later
                                    </button>
                                    <span>Ships in 3-5 days</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col items-center justify-between border-l border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-strong)_72%,transparent)] px-2 py-3 sm:px-3 sm:py-4">
                                <button
                                  type="button"
                                  onClick={() => removeCartLine(item)}
                                  className="flex h-8 w-8 items-center justify-center text-xl leading-none text-[var(--muted)] transition hover:bg-[var(--hover-fill)] hover:text-[var(--danger)]"
                                  aria-label={`Remove ${item.name}`}
                                >
                                  ×
                                </button>
                                <div className="flex flex-col items-center gap-4 text-center">
                                  <div>
                                    <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--muted)]">
                                      Size
                                    </p>
                                    <p className="mt-1 text-base font-semibold uppercase">
                                      {item.size || "OS"}
                                    </p>
                                  </div>
                                  <span
                                    className="block h-8 w-8 border border-[var(--border)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]"
                                    style={{ background: item.accent || item.color || "#111" }}
                                    aria-label={`Color ${item.color || "default"}`}
                                  />
                                  <QuantityControl
                                    item={item}
                                    active={bumpedKey === key}
                                    onChange={(nextQuantity) => changeQuantity(item, nextQuantity)}
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => moveToWishlist(item)}
                                  className="flex h-8 w-8 items-center justify-center text-lg text-[var(--muted)] transition hover:rotate-180 hover:bg-[var(--hover-fill)] hover:text-[var(--foreground)]"
                                  aria-label={`Move ${item.name} to wishlist`}
                                >
                                  ↻
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      })
                    )}
                  </section>
                ) : (
                  <section className="reveal-up grid min-w-0 gap-x-10 gap-y-9 md:grid-cols-2 xl:gap-y-10">
                    {wishlistProducts.length === 0 ? (
                      <div className="md:col-span-2">
                        <EmptyState
                          title="No favourite pieces yet."
                          description="Use the heart on any product card to save it here, then move it into your bag whenever you are ready."
                          ctaHref="/shop"
                          ctaLabel="Browse products"
                        />
                      </div>
                    ) : (
                      wishlistProducts.map((product) => (
                        <article key={product.id} className="min-w-0">
                          <ProductCard product={product} />
                          <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            <button
                              type="button"
                              onClick={() => moveFavouriteToBag(product)}
                              className="lux-action w-full"
                            >
                              Move to bag
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                removeWishlistItem(product.id);
                                pushToast("Removed from favourites.", "error");
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

                <aside className="reveal-up-delayed xl:sticky xl:top-28 xl:self-start">
                  <div className="lux-panel p-6 sm:p-7">
                    <p className="eyebrow text-[var(--accent)]">Order summary</p>
                    <div className="mt-6 space-y-3 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[var(--muted)]">Subtotal</span>
                        <span>{formatPrice(subtotal)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[var(--muted)]">Shipping</span>
                        <span>{shipping ? formatPrice(shipping) : "Free"}</span>
                      </div>
                      <div className="border-t border-[var(--border)] pt-5">
                        <div className="flex items-center justify-between gap-4 text-xl font-semibold">
                          <span>
                            Total <span className="text-xs font-normal uppercase tracking-[0.14em] text-[var(--muted)]">(tax incl.)</span>
                          </span>
                          <span>{formatPrice(total)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 border border-[var(--border)] bg-white/48 p-4">
                      <p className="text-sm font-semibold uppercase tracking-[0.12em]">Estimated delivery</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                        India-wide delivery in 3-5 business days. Tracking appears after dispatch.
                      </p>
                      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                        {remainingForFreeShipping > 0
                          ? `Add ${formatPrice(remainingForFreeShipping)} more to unlock free shipping.`
                          : "Free shipping is active on this bag."}
                      </p>
                    </div>

                    <label className="mt-6 flex items-start gap-3 text-sm text-[var(--muted)]">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(event) => setAcceptedTerms(event.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded-none border-[var(--border)]"
                      />
                      <span>I agree to the Terms and Conditions.</span>
                    </label>

                    <Link
                      href={canCheckout ? "/checkout" : "#"}
                      aria-disabled={!canCheckout}
                      onClick={(event) => {
                        if (!items.length) {
                          event.preventDefault();
                          pushToast("Move a favourite to your bag before checkout.", "error");
                          return;
                        }

                        if (!acceptedTerms) {
                          event.preventDefault();
                          pushToast("Please accept the terms to continue.", "error");
                        }
                      }}
                      className={`lux-action mt-5 w-full ${canCheckout ? "" : "pointer-events-auto opacity-45"}`}
                    >
                      Continue
                    </Link>
                    <Link href="/shop" className="lux-action-muted mt-3 w-full">
                      Continue shopping
                    </Link>
                    <div className="mt-5">
                      <TrustBadges compact />
                    </div>
                    <p className="mt-5 text-center text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                      {itemCount} item{itemCount === 1 ? "" : "s"} in bag
                    </p>
                  </div>
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
