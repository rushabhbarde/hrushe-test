"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TrustBadges } from "@/components/trust-badges";
import { apiRequest } from "@/lib/api";
import {
  isVisibleStorefrontProduct,
  sortProductsByStorefrontPriority,
} from "@/lib/catalog";
import { useStorefrontData } from "@/lib/use-storefront";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const approachItems = [
  {
    title: "Simple shapes",
    description: "Relaxed silhouettes that stay easy to wear, not exaggerated for effect.",
  },
  {
    title: "Better fabric feel",
    description: "Soft hand-feel and everyday durability built into each drop.",
  },
  {
    title: "Less noise",
    description: "A tighter wardrobe edit with cleaner colours and quieter graphics.",
  },
];

export default function Home() {
  const { products, loading } = useStorefrontData();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const [newsletterFeedback, setNewsletterFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const quietEditProducts = useMemo(
    () =>
      sortProductsByStorefrontPriority(products.filter(isVisibleStorefrontProduct)).slice(0, 8),
    [products]
  );

  const handleNewsletterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = newsletterEmail.trim().toLowerCase();

    if (!email || !emailPattern.test(email)) {
      setNewsletterFeedback({
        type: "error",
        message: "Enter a valid email address.",
      });
      return;
    }

    setNewsletterSubmitting(true);
    setNewsletterFeedback(null);

    try {
      const response = await apiRequest<{ message: string }>("/newsletter/subscribe", {
        method: "POST",
        body: JSON.stringify({ email, source: "homepage" }),
      });

      setNewsletterFeedback({
        type: "success",
        message: response.message || "You’re on the list. We’ll keep you posted.",
      });
      setNewsletterEmail("");
    } catch (error) {
      setNewsletterFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "We couldn’t save your email right now. Please try again.",
      });
    } finally {
      setNewsletterSubmitting(false);
    }
  };

  return (
    <div className="page-shell bg-[var(--background)]">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-[1600px] px-4 pb-0 pt-5 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
          <div className="grid overflow-hidden bg-[#f3f0e9] lg:min-h-[680px] lg:grid-cols-[minmax(0,0.38fr)_minmax(0,0.62fr)]">
            <div className="flex flex-col justify-center px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16 xl:px-16">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                HRUSHE / SUMMER 2026
              </p>
              <h1 className="mt-5 max-w-[8ch] text-[2.75rem] font-medium uppercase leading-[0.92] tracking-[-0.035em] text-[var(--foreground)] sm:text-[3.25rem] lg:text-[4.75rem] xl:text-[5.5rem]">
                Defined Quietly.
              </h1>
              <p className="mt-6 max-w-[29rem] text-[0.95rem] leading-6 text-[var(--muted)] sm:text-base sm:leading-7">
                Oversized essentials in a considered palette, made for repeat wear.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link
                  href="/shop"
                  className="inline-flex min-h-12 items-center justify-center bg-[var(--foreground)] px-6 text-xs font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-[var(--accent)]"
                >
                  Shop the edit
                </Link>
                <Link
                  href="/new-in"
                  className="inline-flex min-h-11 items-center text-xs font-semibold uppercase tracking-[0.1em] underline decoration-1 underline-offset-8"
                >
                  Explore all
                </Link>
              </div>
            </div>

            <div className="relative aspect-[4/5] min-h-[420px] lg:aspect-auto lg:min-h-[680px]">
              <Image
                src="/uploads/banners/banner2.png"
                alt="HRUSHE oversized essentials in a considered colour palette"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 62vw"
                className="object-cover object-[50%_42%] lg:object-center"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 pb-16 pt-20 sm:px-6 sm:pb-20 sm:pt-24 lg:px-8 lg:pb-28 lg:pt-28">
          <div className="mb-9 flex flex-col gap-5 sm:mb-11 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                HRUSHE / THE QUIET EDIT
              </p>
              <h2 className="mt-4 max-w-[14ch] text-[2rem] font-medium leading-[1] tracking-[-0.025em] text-[var(--foreground)] sm:text-[2.5rem] lg:text-[3.25rem]">
                One silhouette. Six considered colours.
              </h2>
              <p className="mt-5 max-w-xl text-[0.95rem] leading-6 text-[var(--muted)] sm:text-base sm:leading-7">
                Oversized essentials built for everyday rotation.
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-flex min-h-12 w-fit items-center justify-center border border-[var(--foreground)] px-6 text-xs font-semibold uppercase tracking-[0.1em] transition hover:bg-[var(--foreground)] hover:text-[var(--background)]"
            >
              Shop all
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 xl:grid-cols-4 xl:gap-x-5">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="loading-pulse">
                  <div className="aspect-[18/25] bg-[var(--surface-strong)]" />
                  <div className="mt-3 h-3 w-4/5 bg-[var(--surface-strong)]" />
                  <div className="mt-2 h-3 w-2/5 bg-[var(--surface-strong)]" />
                </div>
              ))}
            </div>
          ) : quietEditProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 lg:gap-y-12 xl:grid-cols-4 xl:gap-x-5">
              {quietEditProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="border border-[var(--border)] px-6 py-12 text-sm text-[var(--muted)]">
              The current edit will appear here as products become available.
            </div>
          )}
        </section>

        <section className="border-y border-[var(--border)] bg-[var(--surface-strong)]">
          <div className="mx-auto grid max-w-[1600px] gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:gap-20 lg:px-8 lg:py-28">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                HRUSHE / DEFINED QUIETLY
              </p>
              <h2 className="mt-4 max-w-[12ch] text-[2.15rem] font-medium leading-[1] tracking-[-0.025em] sm:text-[2.75rem] lg:text-[3.5rem]">
                Quiet clothes for everyday movement.
              </h2>
              <p className="mt-6 max-w-lg text-[0.95rem] leading-7 text-[var(--muted)] sm:text-base">
                Fewer pieces. Calmer colours. Relaxed silhouettes designed to return to.
              </p>
            </div>

            <div className="grid gap-0 border-t border-[var(--border)] md:grid-cols-3">
              {approachItems.map((item) => (
                <article
                  key={item.title}
                  className="border-b border-[var(--border)] py-7 md:border-b-0 md:border-r md:px-6 md:py-8 first:md:pl-0 last:md:border-r-0 last:md:pr-0"
                >
                  <h3 className="text-[1.25rem] font-medium leading-tight tracking-[-0.015em]">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <TrustBadges />
        </section>

        <section className="mx-auto max-w-[1120px] px-4 pb-20 pt-8 text-center sm:px-6 sm:pb-24 lg:pb-32 lg:pt-12">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            DEFINED QUIETLY / THE NEWSLETTER
          </p>
          <h2 className="mx-auto mt-4 max-w-[18ch] text-[2rem] font-medium leading-[1.05] tracking-[-0.025em] sm:text-[2.75rem] lg:text-[3.25rem]">
            New editions. Restocks. Nothing unnecessary.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[0.95rem] leading-7 text-[var(--muted)] sm:text-base">
            First access to new releases and product restocks.
          </p>
          <form
            onSubmit={handleNewsletterSubmit}
            className="mx-auto mt-8 flex max-w-3xl flex-col gap-3 sm:flex-row"
          >
            <label className="sr-only" htmlFor="newsletter-email">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              value={newsletterEmail}
              onChange={(event) => setNewsletterEmail(event.target.value)}
              placeholder="Email address"
              className="min-h-12 flex-1 border border-[var(--border)] bg-[var(--surface)] px-4 text-sm outline-none focus:border-[var(--foreground)]"
            />
            <button
              type="submit"
              disabled={newsletterSubmitting}
              className="min-h-12 bg-[var(--foreground)] px-7 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--background)] transition hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-55"
            >
              {newsletterSubmitting ? "Joining..." : "Join the list"}
            </button>
          </form>
          {newsletterFeedback ? (
            <p
              className={`mt-4 text-sm ${
                newsletterFeedback.type === "success"
                  ? "text-[var(--success)]"
                  : "text-[var(--danger)]"
              }`}
              role="status"
            >
              {newsletterFeedback.message}
            </p>
          ) : null}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
