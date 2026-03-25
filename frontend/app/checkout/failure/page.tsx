"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function CheckoutFailurePage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
        <div className="grain-card rounded-[2rem] p-8 text-center">
          <p className="eyebrow text-[var(--accent)]">Checkout incomplete</p>
          <h1 className="display-font mt-4 text-4xl">Payment was not completed.</h1>
          <p className="mt-4 text-base leading-7 text-[var(--muted)]">
            The checkout was cancelled or failed. Your cart is still available, and you can retry
            whenever you are ready.
          </p>
          {orderId ? (
            <p className="mt-4 text-sm text-[var(--muted)]">Order #: {orderId}</p>
          ) : null}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/checkout" className="button-primary rounded-full px-5 py-3 transition">
              Retry checkout
            </Link>
            <Link href="/cart" className="button-secondary rounded-full px-5 py-3 transition">
              Return to cart
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
