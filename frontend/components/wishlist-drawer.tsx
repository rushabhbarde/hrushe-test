"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { useToast } from "@/components/toast-provider";
import { getCompareAtPrice } from "@/lib/pricing";
import { useStorefrontData } from "@/lib/use-storefront";
import { useWishlist } from "@/components/wishlist-provider";

export function WishlistDrawer() {
  const {
    wishlistIds,
    itemCount,
    isWishlistOpen,
    closeWishlist,
    removeWishlistItem,
  } = useWishlist();
  const { addItem } = useCart();
  const { pushToast } = useToast();
  const { products } = useStorefrontData();
  const pathname = usePathname();
  const [removingIds, setRemovingIds] = useState<string[]>([]);

  useEffect(() => {
    closeWishlist();
  }, [pathname, closeWishlist]);

  const wishlistProducts = useMemo(
    () =>
      wishlistIds
        .map((id) => products.find((product) => product.id === id))
        .filter(
          (product): product is NonNullable<typeof product> => Boolean(product)
        ),
    [products, wishlistIds]
  );

  if (!isWishlistOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close wishlist drawer"
        className="absolute inset-0 bg-black/35"
        onClick={closeWishlist}
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-[var(--border)] bg-[var(--background)] p-5 shadow-2xl sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow text-[var(--accent)]">Favourites</p>
            <h2 className="mt-2 text-2xl font-semibold">Favourites</h2>
          </div>
          <button
            type="button"
            onClick={closeWishlist}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)]"
          >
            ×
          </button>
        </div>

        <div className="hide-scrollbar mt-6 flex-1 space-y-5 overflow-y-auto">
          {wishlistProducts.length === 0 ? (
            <div className="empty-shell rounded-[2rem] p-6">
              <p className="text-lg font-semibold">Your favourites are empty.</p>
              <p className="mt-3 text-sm text-[var(--muted)]">
                Tap the heart on any product to save it here for later.
              </p>
              <Link
                href="/shop"
                className="button-primary mt-5 inline-flex rounded-full px-5 py-3 transition"
              >
                Explore products
              </Link>
            </div>
          ) : (
            wishlistProducts.map((product) => (
              <div
                key={product.id}
                className={`lux-hover-lift border border-[var(--border)] bg-white/72 p-3 transition-all duration-300 ${
                  removingIds.includes(product.id) ? "-translate-y-2 scale-[0.98] opacity-0" : ""
                }`}
              >
                <div>
                  <Link
                    href={`/product/${product.slug || product.id}`}
                    className="relative block aspect-[0.86/1] overflow-hidden bg-[#f6f6f6]"
                  >
                    {product.images[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div
                        className="h-full w-full"
                        style={{ background: product.accent }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        setRemovingIds((current) => [...current, product.id]);
                        window.setTimeout(() => {
                          removeWishlistItem(product.id);
                          setRemovingIds((current) => current.filter((id) => id !== product.id));
                          pushToast("Removed from wishlist");
                        }, 220);
                      }}
                      aria-label={`Remove ${product.name} from wishlist`}
                      className="absolute bottom-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/92 text-[var(--accent)] shadow-sm transition hover:bg-white"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
                      </svg>
                    </button>
                  </Link>
                </div>

                <div className="px-1 pb-1 pt-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">
                    {product.category}
                  </p>
                  <Link
                    href={`/product/${product.slug || product.id}`}
                    className="mt-2 block text-[0.98rem] font-medium uppercase leading-6 tracking-[-0.01em]"
                  >
                    {product.name}
                  </Link>
                  <div className="mt-1.5 flex items-end gap-2">
                    <p className="text-[1.02rem] font-semibold leading-none">
                      Rs.{product.price.toLocaleString("en-IN")}.00
                    </p>
                    <p className="text-[0.88rem] text-[var(--muted)] line-through">
                      Rs.
                      {(
                        product.compareAtPrice || getCompareAtPrice(product.price)
                      ).toLocaleString("en-IN")}
                      .00
                    </p>
                  </div>

                  <div className="mt-4 grid gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        addItem({
                          productId: product.id,
                          name: product.name,
                          price: product.price,
                          size: product.sizes[0] || "M",
                          color: product.colors[0] || "Default",
                          accent: product.accent,
                          image: product.images[0],
                        });
                        removeWishlistItem(product.id);
                        pushToast("Moved to cart");
                      }}
                      className="lux-action w-full"
                    >
                      Move to cart
                    </button>
                    <Link
                      href={`/product/${product.slug || product.id}`}
                      className="lux-action-muted w-full"
                    >
                      View product
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-[var(--border)] pt-5">
          <div className="flex items-center justify-between text-sm text-[var(--muted)]">
            <span>{itemCount} saved</span>
            <Link
              href="/account#wishlist"
              className="font-medium text-[var(--accent)]"
            >
              View in account
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
