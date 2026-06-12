"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

function CheckoutFailurePageContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="lux-page py-10 sm:py-14">
        <section className="lux-container">
          <div className="lux-panel mx-auto grid max-w-5xl gap-8 rounded-[2.4rem] p-6 sm:p-8 lg:grid-cols-[1fr_340px] lg:p-10">
            <div>
              <div className="loading-mark relative flex h-16 w-16 items-center justify-center rounded-full bg-white text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                <span className="loading-ring absolute inset-0 rounded-full border border-[var(--accent)]/25" />
                Hold
              </div>
              <p className="eyebrow mt-6 text-[var(--accent)]">Payment failed</p>
              <h1 className="display-font mt-4 text-4xl sm:text-5xl">
                Payment was not completed.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--muted)]">
                The checkout was cancelled or failed. Your bag is still available, so you can
                retry payment or adjust the order before continuing.
              </p>
              {orderId ? (
                <p className="mt-5 inline-flex border border-[var(--border)] bg-white/60 px-4 py-3 text-sm">
                  Order #: <span className="ml-2 font-semibold">{orderId}</span>
                </p>
              ) : null}

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/checkout" className="lux-action">
                  Retry checkout
                </Link>
                <Link href="/cart" className="lux-action-muted">
                  Return to cart
                </Link>
              </div>
            </div>

            <aside className="border border-[var(--border)] bg-white/55 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.12em]">Order summary</p>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <span className="text-[var(--muted)]">Payment</span>
                  <span>Incomplete</span>
                </div>
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <span className="text-[var(--muted)]">Cart</span>
                  <span>Preserved</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted)]">Next step</span>
                  <span>Retry payment</span>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

export default function CheckoutFailurePage() {
  return (
    <Suspense fallback={null}>
      <CheckoutFailurePageContent />
    </Suspense>
  );
}
