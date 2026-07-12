"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { useToast } from "@/components/toast-provider";
import { useStorefrontData } from "@/lib/use-storefront";
import { useWishlist } from "@/components/wishlist-provider";
import { shouldBypassImageOptimization } from "@/lib/image-source";
import { useDialogAccessibility } from "@/lib/use-dialog-accessibility";

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
  const { dialogRef, initialFocusRef } = useDialogAccessibility(isWishlistOpen, closeWishlist);

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
        aria-label="Close saved drawer"
        className="absolute inset-0 bg-black/35"
        onClick={closeWishlist}
      />
      <aside
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wishlist-drawer-title"
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-[var(--border)] bg-[var(--background)] p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow text-[var(--muted)]">Saved</p>
            <h2 id="wishlist-drawer-title" className="mt-2 text-2xl font-semibold">Saved pieces</h2>
          </div>
          <button
            type="button"
            ref={initialFocusRef}
            onClick={closeWishlist}
            aria-label="Close saved"
            className="flex h-10 w-10 items-center justify-center border border-[var(--border)]"
          >
            ×
          </button>
        </div>

        <div className="hide-scrollbar mt-6 flex-1 space-y-5 overflow-y-auto">
          {wishlistProducts.length === 0 ? (
            <div className="empty-shell p-6">
              <p className="text-lg font-semibold">No saved pieces yet.</p>
              <p className="mt-3 text-sm text-[var(--muted)]">
                Save pieces you love and find them here later.
              </p>
              <Link
                href="/shop"
                className="button-primary mt-5 inline-flex px-5 py-3 transition"
              >
                Explore collection
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
                  <div className="relative aspect-[0.86/1] overflow-hidden bg-[#f6f6f6]">
                    <Link
                      href={`/product/${product.slug || product.id}`}
                      className="relative block h-full"
                      aria-label={`View ${product.name}`}
                    >
                      {product.images[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          unoptimized={shouldBypassImageOptimization(product.images[0])}
                          className="object-cover"
                        />
                      ) : (
                        <div
                          className="h-full w-full"
                          style={{ background: product.accent }}
                        />
                      )}
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setRemovingIds((current) => [...current, product.id]);
                        window.setTimeout(() => {
                          removeWishlistItem(product.id);
                          setRemovingIds((current) => current.filter((id) => id !== product.id));
                          pushToast("Removed from saved", "error");
                        }, 220);
                      }}
                      aria-label={`Remove ${product.name} from saved`}
                      className="absolute bottom-3 right-3 z-10 flex h-11 w-11 items-center justify-center border border-[var(--border)] bg-white text-[var(--foreground)] transition hover:border-[var(--foreground)]"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        aria-hidden="true"
                      >
                        <path d="M7 4.5h10a1.5 1.5 0 0 1 1.5 1.5v13.6L12 15.5l-6.5 4.1V6A1.5 1.5 0 0 1 7 4.5Z" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="px-1 pb-1 pt-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
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
                    {Number(product.compareAtPrice) > product.price ? (
                      <p className="text-[0.88rem] text-[var(--muted)] line-through">
                        Rs.{Number(product.compareAtPrice).toLocaleString("en-IN")}.00
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-2">
                    {product.sizes.length === 1 ? (
                      <button
                        type="button"
                        onClick={() => {
                          addItem({
                            productId: product.id,
                            name: product.name,
                            price: product.price,
                            size: product.sizes[0],
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
                    ) : (
                      <Link
                        href={`/product/${product.slug || product.id}`}
                        className="lux-action w-full"
                      >
                        Choose size
                      </Link>
                    )}
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
              className="font-medium text-[var(--foreground)] underline underline-offset-4"
            >
              View in account
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
