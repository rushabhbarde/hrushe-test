"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { useCart, type CartLine } from "@/components/cart-provider";
import { useToast } from "@/components/toast-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useWishlist } from "@/components/wishlist-provider";

const shipping = 0;

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

export default function CartPage() {
  const { items, subtotal, itemCount, removeItem, updateQuantity } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { pushToast } = useToast();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [removingKeys, setRemovingKeys] = useState<string[]>([]);
  const [bumpedKey, setBumpedKey] = useState("");
  const total = subtotal + shipping;

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

  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="lux-page py-8 sm:py-10 lg:py-14">
        <div className="lux-container">
          {items.length === 0 ? (
            <section className="mx-auto max-w-3xl py-10">
              <EmptyState
                title="Your shopping bag is empty."
                description="Save a few premium everyday pieces here, then return to finish checkout in one clean flow."
                ctaHref="/shop"
                ctaLabel="Explore products"
              />
            </section>
          ) : (
            <>
              <div className="reveal-up flex flex-col gap-5 border-b border-[var(--border)] pb-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="eyebrow text-[var(--accent)]">Shopping bag</p>
                  <h1 className="display-font mt-3 text-4xl tracking-[-0.06em] sm:text-5xl lg:text-6xl">
                    Selected pieces.
                  </h1>
                </div>
                <div className="inline-flex w-fit items-center border border-[var(--border)] bg-white/62 p-1 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                  <span className="bg-white px-4 py-2 text-[var(--foreground)]">Bag</span>
                  <button
                    type="button"
                    className="px-4 py-2 transition hover:text-[var(--foreground)]"
                    onClick={() => pushToast("Wishlist is available from the heart icon.")}
                  >
                    Favourites
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-12">
                <section className="reveal-up grid min-w-0 gap-x-10 gap-y-8 md:grid-cols-2 xl:gap-y-10">
                  {items.map((item) => {
                    const key = lineKey(item);
                    const removing = removingKeys.includes(key);

                    return (
                      <article
                        key={key}
                        className={`lux-hover-lift grid min-w-0 grid-cols-[minmax(0,1fr)_3.75rem] gap-3 border-b border-[var(--border)] pb-8 transition-all duration-300 ${
                          removing ? "-translate-y-2 scale-[0.98] opacity-0" : "opacity-100"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="relative aspect-[0.84/1] overflow-hidden border border-[var(--border)] bg-[#f4f4f4]">
                            {item.image ? (
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                unoptimized
                                sizes="(max-width: 768px) 72vw, 34vw"
                                className="object-cover"
                              />
                            ) : (
                              <div className="h-full w-full" style={{ background: item.accent }} />
                            )}
                            <button
                              type="button"
                              onClick={() => moveToWishlist(item)}
                              className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center bg-white/90 text-[var(--muted)] shadow-sm transition hover:text-[var(--accent)]"
                              aria-label={`Save ${item.name} for later`}
                            >
                              ♡
                            </button>
                          </div>

                          <div className="mt-3 grid grid-cols-[1fr_auto] gap-4">
                            <div className="min-w-0">
                              <p className="text-sm text-[var(--muted)]">Cotton T Shirt</p>
                              <Link
                                href={`/product/${item.productId}`}
                                className="mt-1 block text-lg font-semibold uppercase leading-tight tracking-[-0.04em]"
                              >
                                {item.name}
                              </Link>
                            </div>
                            <p className="whitespace-nowrap text-base font-semibold">
                              {formatPrice(item.price)}
                            </p>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
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

                        <div className="flex flex-col items-center justify-start gap-5 pt-1">
                          <button
                            type="button"
                            onClick={() => removeCartLine(item)}
                            className="flex h-8 w-8 items-center justify-center text-xl leading-none text-[var(--muted)] transition hover:text-[var(--accent)]"
                            aria-label={`Remove ${item.name}`}
                          >
                            ×
                          </button>
                          <div className="text-center">
                            <p className="text-sm font-semibold uppercase">{item.size || "OS"}</p>
                            <span
                              className="mt-4 block h-7 w-7 border border-[var(--border)]"
                              style={{ background: item.accent || item.color || "#111" }}
                              aria-label={`Color ${item.color || "default"}`}
                            />
                          </div>
                          <QuantityControl
                            item={item}
                            active={bumpedKey === key}
                            onChange={(nextQuantity) => changeQuantity(item, nextQuantity)}
                          />
                          <button
                            type="button"
                            onClick={() => moveToWishlist(item)}
                            className="text-lg text-[var(--muted)] transition hover:rotate-180 hover:text-[var(--foreground)]"
                            aria-label={`Move ${item.name} to wishlist`}
                          >
                            ↻
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </section>

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
                      href={acceptedTerms ? "/checkout" : "#"}
                      aria-disabled={!acceptedTerms}
                      onClick={(event) => {
                        if (!acceptedTerms) {
                          event.preventDefault();
                          pushToast("Please accept the terms to continue.", "error");
                        }
                      }}
                      className={`lux-action mt-5 w-full ${acceptedTerms ? "" : "pointer-events-auto opacity-45"}`}
                    >
                      Continue
                    </Link>
                    <Link href="/shop" className="lux-action-muted mt-3 w-full">
                      Continue shopping
                    </Link>
                    <p className="mt-5 text-center text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                      {itemCount} item{itemCount === 1 ? "" : "s"} in bag
                    </p>
                  </div>
                </aside>
              </div>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
