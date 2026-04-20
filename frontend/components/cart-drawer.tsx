"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart-provider";

export function CartDrawer() {
  const {
    items,
    subtotal,
    itemCount,
    isCartOpen,
    closeCart,
    removeItem,
    updateQuantity,
  } = useCart();
  const pathname = usePathname();

  useEffect(() => {
    closeCart();
  }, [pathname, closeCart]);

  if (!isCartOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close cart drawer"
        className="absolute inset-0 bg-black/35"
        onClick={closeCart}
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-[var(--border)] bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow text-[var(--muted)]">Cart drawer</p>
            <h2 className="mt-2 text-2xl font-semibold">Your bag</h2>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)]"
          >
            ×
          </button>
        </div>

        <div className="mt-6 flex-1 space-y-4 overflow-y-auto">
          {items.length === 0 ? (
            <div className="empty-shell rounded-[2rem] p-6">
              <p className="text-lg font-semibold">Your cart is empty.</p>
              <p className="mt-3 text-sm text-[var(--muted)]">
                Add a few pieces and come back here for a quick checkout jump.
              </p>
              <Link
                href="/shop"
                className="button-primary mt-5 inline-flex rounded-full px-5 py-3 transition"
              >
                Shop now
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={`${item.productId}-${item.size}-${item.color}-${item.fit || ""}`}
                className="grain-card rounded-[1.75rem] p-4"
              >
                <div className="flex gap-4">
                  <div className="relative h-20 w-20 overflow-hidden rounded-[1rem] bg-[#f6f6f6]">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full" style={{ background: item.accent }} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{item.name}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {item.size || "Default"} · {item.color || "Default"}
                      {item.fit ? ` · ${item.fit}` : ""}
                    </p>
                    <p className="mt-2 text-sm font-semibold">Rs. {item.price}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.size,
                            item.color,
                            item.quantity - 1,
                            item.fit
                          )
                        }
                        className="h-8 w-8 rounded-full border border-[var(--border)]"
                      >
                        -
                      </button>
                      <span className="min-w-4 text-center text-sm">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.size,
                            item.color,
                            item.quantity + 1,
                            item.fit
                          )
                        }
                        className="h-8 w-8 rounded-full border border-[var(--border)]"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId, item.size, item.color, item.fit)}
                        className="ml-auto text-sm text-[var(--accent)]"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-[var(--border)] pt-5">
          <div className="flex items-center justify-between text-sm text-[var(--muted)]">
            <span>{itemCount} items</span>
            <span>Subtotal Rs. {subtotal.toLocaleString("en-IN")}</span>
          </div>
          <div className="mt-4 grid gap-3">
            <Link
              href="/checkout"
              className="button-primary inline-flex justify-center rounded-full px-5 py-3 transition"
            >
              Checkout
            </Link>
            <Link
              href="/cart"
              className="button-secondary inline-flex justify-center rounded-full px-5 py-3 transition"
            >
              View cart
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
