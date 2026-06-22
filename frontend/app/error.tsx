"use client";

import Link from "next/link";

export default function StorefrontError({ reset }: { reset: () => void }) {
  return (
    <main className="lux-page flex items-center py-16">
      <div className="lux-container">
        <div className="empty-shell max-w-3xl p-8 sm:p-12">
          <p className="eyebrow text-[var(--muted)]">HRUSHE</p>
          <h1 className="mt-4 text-3xl font-medium uppercase tracking-[-0.04em] sm:text-5xl">
            This page needs another moment.
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-[var(--muted)] sm:text-base">
            The storefront could not complete this request. Try again, or return to the collection.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={reset} className="button-primary px-6 text-xs font-semibold uppercase tracking-[0.12em]">
              Try again
            </button>
            <Link href="/shop" className="button-secondary inline-flex items-center justify-center px-6 text-xs font-semibold uppercase tracking-[0.12em]">
              View the shop
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
