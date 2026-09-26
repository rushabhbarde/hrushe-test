"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart, type CartLine } from "@/components/cart-provider";
import { useToast } from "@/components/toast-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
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


function CartPageSkeleton() {
  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="lux-page py-6 sm:py-10 lg:py-14">
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
  const [selectedKey, setSelectedKey] = useState("");
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
    updateQuantity(item.productId, item.size, item.color, nextQuantity, item.fit);
    pushToast(nextQuantity <= 0 ? "Item removed" : "Cart updated", nextQuantity <= 0 ? "error" : "success");
  };

  if (!isReady) {
    return <CartPageSkeleton />;
  }

  const activeItem = items.find((item) => lineKey(item) === selectedKey) || items[0];
  const savedView = activeCartTab === "favourites";

  const frame = (src: string | undefined, alt: string, accent?: string) => (
    <div className="fr-frame aspect-[3/4] w-full">
      <div className="fr-frame__layer is-active">
        {src ? (
          <Image src={src} alt={alt} fill unoptimized={shouldBypassImageOptimization(src)} sizes="(min-width: 1024px) 30vw, 100vw" />
        ) : (
          <div className="h-full w-full" style={{ background: accent || "#eeece8" }} />
        )}
      </div>
    </div>
  );

  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="px-5 pb-16 pt-6 lg:px-10 lg:pt-10">
        <h1 className="sr-only">Shopping bag</h1>
        <nav className="fr-mono mb-8 flex gap-6" aria-label="Bag or saved">
          <button
            type="button"
            onClick={() => setActiveCartTab("bag")}
            aria-pressed={!savedView}
            className={`fr-choice min-h-11 ${!savedView ? "is-active fr-link" : ""}`}
          >
            Bag · {String(itemCount).padStart(2, "0")}
          </button>
          <button
            type="button"
            onClick={() => setActiveCartTab("favourites")}
            aria-pressed={savedView}
            className={`fr-choice min-h-11 ${savedView ? "is-active fr-link" : ""}`}
          >
            Saved · {String(wishlistIds.length).padStart(2, "0")}
          </button>
        </nav>

        {!savedView ? (
          items.length === 0 ? (
            <section className="flex flex-col gap-5 py-16">
              <p className="fr-word text-[3rem] lg:text-[5rem]">Nothing here yet.</p>
              <p className="text-[var(--muted)]">
                {hasSavedProducts ? "Move a saved piece into your bag when you are ready." : "Pieces you add will wait here for one calm checkout."}
              </p>
              <div className="fr-mono flex gap-6">
                <Link href="/collection/men" className="fr-link">Shop men</Link>
                <Link href="/collection/women" className="fr-link">Shop women</Link>
              </div>
            </section>
          ) : (
            <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_min(30vw,440px)_minmax(0,1fr)] lg:items-center lg:gap-x-14">
              <ul className="order-2 flex flex-col lg:order-1 lg:items-end lg:text-right">
                {items.map((item) => {
                  const key = lineKey(item);
                  const removing = removingKeys.includes(key);
                  const isActive = activeItem ? lineKey(activeItem) === key : false;

                  return (
                    <li
                      key={key}
                      className={`flex w-full flex-col gap-2 border-b border-[var(--border)] py-4 transition-opacity duration-300 lg:items-end ${removing ? "opacity-0" : "opacity-100"}`}
                    >
                      <div className="flex w-full items-baseline justify-between gap-4 lg:justify-end">
                        <button
                          type="button"
                          onClick={() => setSelectedKey(key)}
                          onMouseEnter={() => setSelectedKey(key)}
                          className={`fr-choice fr-word text-[2rem]! lg:text-[clamp(2.25rem,3.6vw,3.5rem)]! ${isActive ? "is-active" : ""}`}
                        >
                          {item.name}
                        </button>
                        <span className="shrink-0 lg:hidden">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                      <span className="fr-mono fr-muted">
                        {[item.color, item.size ? `Size ${item.size}` : "", item.fit, formatPrice(item.price * item.quantity)].filter(Boolean).join(" · ")}
                      </span>
                      <div className="fr-mono flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => changeQuantity(item, item.quantity - 1)}
                          className="fr-choice is-active h-11 w-9"
                          aria-label={`Decrease quantity of ${item.name}`}
                        >
                          −
                        </button>
                        <span aria-label={`Quantity ${item.quantity}`}>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => changeQuantity(item, item.quantity + 1)}
                          className="fr-choice is-active h-11 w-9"
                          aria-label={`Increase quantity of ${item.name}`}
                        >
                          +
                        </button>
                        <button type="button" onClick={() => moveToWishlist(item)} className="fr-choice ml-4 min-h-11">
                          Save for later
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCartLine(item)}
                          className="fr-choice ml-4 min-h-11"
                          aria-label={`Remove ${item.name}`}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="order-1 flex flex-col gap-3 lg:order-2">
                {activeItem ? frame(activeItem.image, activeItem.name, activeItem.accent) : null}
                <span className="fr-mono fr-muted">Folded &amp; dispatched in 1–3 business days</span>
              </div>

              <aside className="order-3 flex w-full flex-col gap-4 lg:max-w-[320px] lg:justify-self-start">
                <div className="flex justify-between text-[0.95rem]">
                  <span className="text-[var(--muted)]">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[0.95rem]">
                  <span className="text-[var(--muted)]">Delivery</span>
                  <span>{shipping ? formatPrice(shipping) : "Free"}</span>
                </div>
                <div className="flex items-baseline justify-between border-t border-[var(--border)] pt-4">
                  <span className="fr-mono">Total</span>
                  <span className="fr-word text-[3rem]">{formatPrice(total)}</span>
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
                  className="fr-button"
                >
                  Checkout
                </Link>
                <span className="fr-mono fr-muted text-center text-[0.6rem]">Secure payment with Razorpay · tax included</span>
                <div className="fr-label flex flex-col gap-1">
                  <span className="fr-mono">One free size exchange</span>
                  <span className="text-[0.82rem] text-[var(--muted)]">
                    If the fit isn’t right, we swap it once.{" "}
                    <Link href="/policies?tab=returns" className="underline underline-offset-4">
                      Returns policy
                    </Link>
                  </span>
                </div>
              </aside>
            </div>
          )
        ) : wishlistProducts.length === 0 ? (
          <section className="flex flex-col gap-5 py-16">
            <p className="fr-word text-[3rem] lg:text-[5rem]">Nothing saved.</p>
            <p className="text-[var(--muted)]">Save a piece from its page and it will wait here.</p>
          </section>
        ) : (
          <ul className="flex flex-col">
            {wishlistProducts.map((product) => (
              <li key={product.id} className="flex items-center gap-5 border-b border-[var(--border)] py-4">
                <div className="w-20 shrink-0 lg:w-28">{frame(product.images[0], product.displayName || product.name, product.accent)}</div>
                <div className="flex flex-1 flex-col gap-2">
                  <Link href={`/product/${product.slug || product.id}`} className="fr-word text-[1.75rem] lg:text-[2.75rem]">
                    {product.displayName || product.name}
                  </Link>
                  <div className="fr-mono flex gap-5">
                    <Link href={`/product/${product.slug || product.id}`} className="fr-link">
                      Choose size
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        removeWishlistItem(product.id);
                        pushToast("Removed from saved.", "error");
                      }}
                      className="fr-choice min-h-11"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
