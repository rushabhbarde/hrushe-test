"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function CheckoutPendingPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const trackingLookup = orderId ? `/track-order?orderId=${encodeURIComponent(orderId)}` : "/track-order";

  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="lux-page py-10 sm:py-14">
        <section className="lux-container">
          <div className="lux-panel mx-auto grid max-w-5xl gap-8 rounded-[2.4rem] p-6 sm:p-8 lg:grid-cols-[1fr_340px] lg:p-10">
            <div>
              <div className="loading-mark relative flex h-16 w-16 items-center justify-center rounded-full text-sm font-semibold uppercase tracking-[0.14em]">
                <span className="loading-ring absolute inset-0 rounded-full border border-black/15" />
                Wait
              </div>
              <p className="eyebrow mt-6 text-[var(--accent)]">Payment pending</p>
              <h1 className="display-font mt-4 text-4xl sm:text-5xl">
                We are confirming your payment.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--muted)]">
                Your payment is being verified. If money was deducted, please avoid paying again
                until this order status updates.
              </p>
              {orderId ? (
                <p className="mt-5 inline-flex border border-[var(--border)] bg-white/60 px-4 py-3 text-sm">
                  Order #: <span className="ml-2 font-semibold">{orderId}</span>
                </p>
              ) : null}

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={trackingLookup} className="lux-action">
                  Track order
                </Link>
                <Link href="/shop" className="lux-action-muted">
                  Continue shopping
                </Link>
              </div>
            </div>

            <aside className="border border-[var(--border)] bg-white/55 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.12em]">Order summary</p>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <span className="text-[var(--muted)]">Payment</span>
                  <span>Pending</span>
                </div>
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <span className="text-[var(--muted)]">Order status</span>
                  <span>On hold</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted)]">Action</span>
                  <span>Track status</span>
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
