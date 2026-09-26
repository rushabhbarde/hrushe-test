"use client";

import Link from "next/link";

export default function StorefrontError({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-[80svh] items-center px-5 py-16 lg:px-10">
      <div className="mx-auto grid w-full max-w-[1320px] gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-end lg:gap-20">
        <div className="flex flex-col gap-4">
          <span className="fr-mono fr-muted">HRUSHE</span>
          <h1 className="fr-word text-[clamp(3.5rem,12vw,8rem)]">One moment.</h1>
        </div>
        <div className="flex flex-col gap-5">
          <p className="text-base leading-7 text-[var(--muted)]">
            This page could not finish loading. Try again, or go back to the edit.
          </p>
          <button type="button" onClick={reset} className="fr-button">
            Try again
          </button>
          <Link href="/shop" className="fr-mono fr-link self-start">
            See the edit →
          </Link>
        </div>
      </div>
    </main>
  );
}
