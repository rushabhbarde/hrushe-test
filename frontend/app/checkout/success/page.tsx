"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function CheckoutSuccessPage() {
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
      <main className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <section className="grain-card relative rounded-[2.4rem] px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-start">
            <div>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)] text-3xl text-white shadow-[0_18px_40px_rgba(208,32,39,0.24)]">
                ✓
              </div>
              <p className="eyebrow mt-6 text-[var(--accent)]">Checkout success</p>
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
                  What happens next
                </p>
                <div className="mt-5 space-y-4">
                  {[
                    "Your order is now saved in your account and order history.",
                    "You will see status changes like Confirmed, Shipped, and Delivered.",
                    "Tracking details will appear as soon as the courier is assigned.",
                  ].map((step) => (
                    <div key={step} className="flex gap-3">
                      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
                      <p className="text-sm leading-7 text-[var(--muted)]">{step}</p>
                    </div>
                  ))}
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
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
