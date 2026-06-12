"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

function CheckoutSuccessPageContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const orderId = searchParams.get("orderId");
  const trackingLookup = orderId ? `/track-order?orderId=${encodeURIComponent(orderId)}` : "/track-order";

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="lux-page py-10 sm:py-14">
        <section className="lux-container">
          <div className="lux-panel relative rounded-[2.4rem] px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-start">
            <div>
              <div className="loading-mark relative flex h-16 w-16 items-center justify-center rounded-full bg-black text-sm font-semibold uppercase tracking-[0.14em] text-white shadow-[0_18px_40px_rgba(17,17,17,0.16)]">
                <span className="loading-ring absolute inset-0 rounded-full border border-black/15" />
                Paid
              </div>
              <p className="eyebrow mt-6 text-[var(--accent)]">Payment successful</p>
              <h1 className="display-font mt-4 text-4xl sm:text-5xl lg:text-6xl">
                Your order is confirmed.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--muted)]">
                Payment was marked successful and your order has been added to your account.
                We will now begin confirmation, packing, and dispatch updates.
              </p>
              {orderId ? (
                <div className="mt-6 inline-flex rounded-full border border-[var(--border)] bg-white/65 px-5 py-3 text-sm font-medium text-[var(--foreground)] backdrop-blur-md">
                  Order #: <span className="ml-2 font-semibold">{orderId}</span>
                </div>
              ) : null}

              <div className="relative z-10 mt-8 flex flex-wrap gap-3">
                <Link href="/account#my-orders" className="button-primary inline-flex rounded-full px-5 py-3 transition">
                  View my orders
                </Link>
                <Link href={trackingLookup} className="button-secondary inline-flex rounded-full px-5 py-3 transition">
                  Track this order
                </Link>
                <Link href="/shop" className="button-secondary inline-flex rounded-full px-5 py-3 transition">
                  Continue shopping
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="relative rounded-[2rem] border border-[var(--border)] bg-white/60 p-6 backdrop-blur-md">
                <p className="text-sm uppercase tracking-[0.18em] text-[var(--accent)]">
                  Order summary
                </p>
                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                    <span className="text-[var(--muted)]">Payment</span>
                    <span>Successful</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                    <span className="text-[var(--muted)]">Order status</span>
                    <span>Confirmed</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--muted)]">Tracking</span>
                    <span>Available after dispatch</span>
                  </div>
                </div>
              </div>
              <div className="relative rounded-[2rem] border border-[var(--border)] bg-white/60 p-6 backdrop-blur-md">
                <p className="text-sm uppercase tracking-[0.18em] text-[var(--accent)]">
                  Need anything else
                </p>
                <div className="relative z-10 mt-5 grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/account"
                    className="block rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-4 transition hover:-translate-y-0.5"
                  >
                    <p className="font-semibold text-[var(--foreground)]">Update profile</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      Keep your contact and shipping details up to date.
                    </p>
                  </Link>
                  <Link
                    href="/contact"
                    className="block rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-4 transition hover:-translate-y-0.5"
                  >
                    <p className="font-semibold text-[var(--foreground)]">Contact support</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      Reach us for delivery, sizing, or refund assistance.
                    </p>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutSuccessPageContent />
    </Suspense>
  );
}
