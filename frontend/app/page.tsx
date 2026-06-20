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
import { shouldBypassImageOptimization } from "@/lib/image-source";
import { getProductDisplayName } from "@/lib/product-presentation";
import { useStorefrontData } from "@/lib/use-storefront";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const philosophy = [
  {
    number: "01",
    title: "Proportion",
    description: "Relaxed silhouettes with room through the body and a clean, controlled drape.",
  },
  {
    number: "02",
    title: "Material",
    description: "Cotton chosen for substance, softness, and the way it settles after repeated wear.",
  },
  {
    number: "03",
    title: "Restraint",
    description: "A quieter palette and fewer details so fit and fabric remain the focus.",
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

  const collection = useMemo(
    () =>
      sortProductsByStorefrontPriority(products.filter(isVisibleStorefrontProduct)).slice(0, 8),
    [products]
  );
  const leadProduct = collection[0];
  const editorialProduct = collection.find((product) => product.images[1]) || collection[1] || leadProduct;
  const customerReviews = useMemo(
    () =>
      products
        .flatMap((product) =>
          (product.reviews || [])
            .filter(
              (review) =>
                review.status !== "pending" &&
                review.status !== "rejected" &&
                review.status !== "hidden" &&
                !/hrushabh|kshitij/i.test(review.reviewerName)
            )
            .map((review) => ({ ...review, product }))
        )
        .slice(0, 3),
    [products]
  );

  const handleNewsletterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = newsletterEmail.trim().toLowerCase();

    if (!email || !emailPattern.test(email)) {
      setNewsletterFeedback({ type: "error", message: "Enter a valid email address." });
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
        message: response.message || "You’re on the list.",
      });
      setNewsletterEmail("");
    } catch (error) {
      setNewsletterFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setNewsletterSubmitting(false);
    }
  };

  return (
    <div className="page-shell bg-[var(--background)]">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-[1600px] px-4 pb-0 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
          <div className="grid bg-[var(--surface)] lg:min-h-[760px] lg:grid-cols-[30%_70%]">
            <div className="order-2 flex flex-col justify-center px-5 py-12 sm:px-8 sm:py-16 lg:order-1 lg:px-12 xl:px-16">
              <p className="eyebrow text-[var(--muted)]">Summer 2026</p>
              <h1 className="mt-6 max-w-[7ch] text-[3rem] font-medium uppercase leading-[0.92] tracking-[-0.04em] sm:text-[3.5rem] lg:text-[5.5rem]">
                Defined quietly.
              </h1>
              <p className="mt-8 max-w-[24rem] text-[0.94rem] leading-7 text-[var(--muted)] sm:text-base">
                Heavyweight cotton essentials.<br />
                Cut with room.<br />
                Made for repeat wear.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <Link href="/shop" className="button-primary inline-flex items-center justify-center px-7 text-[0.7rem] font-semibold uppercase">
                  Shop the collection
                </Link>
                <Link href="/story" className="button-secondary inline-flex items-center justify-center px-7 text-[0.7rem] font-semibold uppercase tracking-[0.1em]">
                  Discover the fit
                </Link>
              </div>
            </div>

            <div className="relative order-1 h-[64svh] min-h-[520px] max-h-[680px] overflow-hidden lg:order-2 lg:h-auto lg:max-h-none lg:min-h-[760px]">
              <Image
                src="/uploads/banners/banner2.png"
                alt="HRUSHE Summer 2026 oversized cotton collection"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 70vw"
                className="object-cover object-[50%_44%]"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
          <div className="mb-10 flex flex-col gap-6 border-b border-[var(--border)] pb-8 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow text-[var(--muted)]">The collection</p>
              <h2 className="mt-4 max-w-[14ch] text-[2rem] font-medium leading-[0.98] tracking-[-0.035em] sm:text-[2.5rem] lg:text-[3.5rem]">
                The Oversized Tee. Six quiet tones.
              </h2>
            </div>
            <Link href="/shop" className="inline-flex min-h-12 w-fit items-center border-b border-[var(--foreground)] text-[0.68rem] font-semibold uppercase tracking-[0.12em]">
              View all pieces
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-x-2.5 gap-y-12 md:grid-cols-3 xl:grid-cols-4 xl:gap-x-5">
              {Array.from({ length: 8 }, (_, index) => (
                <div key={index} className="loading-pulse">
                  <div className="aspect-[18/25] bg-[var(--surface-strong)]" />
                  <div className="mt-4 h-3 w-4/5 bg-[var(--surface-strong)]" />
                  <div className="mt-2 h-3 w-2/5 bg-[var(--surface-strong)]" />
                </div>
              ))}
            </div>
          ) : collection.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-2.5 gap-y-12 sm:gap-x-4 md:grid-cols-3 xl:grid-cols-4 xl:gap-x-5 xl:gap-y-16">
              {collection.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="border border-[var(--border)] bg-[var(--surface)] px-6 py-16 text-sm text-[var(--muted)]">
              The current collection will appear here as pieces become available.
            </div>
          )}
        </section>

        <section className="border-y border-[var(--border)] bg-[var(--surface)]">
          <div className="mx-auto grid max-w-[1600px] lg:grid-cols-2">
            <div className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32 xl:px-16">
              <p className="eyebrow text-[var(--muted)]">Fabric & construction</p>
              <h2 className="mt-5 max-w-[10ch] text-[2rem] font-medium leading-[0.98] tracking-[-0.035em] sm:text-[2.5rem] lg:text-[3.5rem]">
                Substance without excess.
              </h2>
              <p className="mt-8 max-w-lg text-[0.94rem] leading-7 text-[var(--muted)] sm:text-base">
                A relaxed silhouette shaped by fabric weight, a clean neckline, and a finish made to settle naturally with wear.
              </p>

              <dl className="mt-12 grid border-t border-[var(--border)] sm:grid-cols-3">
                <div className="border-b border-[var(--border)] py-6 sm:border-r sm:px-5 sm:first:pl-0">
                  <dt className="eyebrow text-[var(--muted)]">Fabric</dt>
                  <dd className="mt-3 text-sm font-medium">{leadProduct?.fabric || leadProduct?.cottonType || "Cotton jersey"}</dd>
                </div>
                <div className="border-b border-[var(--border)] py-6 sm:border-r sm:px-5">
                  <dt className="eyebrow text-[var(--muted)]">Weight</dt>
                  <dd className="mt-3 text-sm font-medium">{leadProduct?.gsm || leadProduct?.weight || "Substantial everyday weight"}</dd>
                </div>
                <div className="border-b border-[var(--border)] py-6 sm:pl-5">
                  <dt className="eyebrow text-[var(--muted)]">Fit</dt>
                  <dd className="mt-3 text-sm font-medium">Relaxed, unisex proportion</dd>
                </div>
              </dl>
              <Link href={leadProduct ? `/product/${leadProduct.slug || leadProduct.id}` : "/shop"} className="button-primary mt-10 inline-flex items-center justify-center px-7 text-[0.7rem] font-semibold uppercase">
                Explore the construction
              </Link>
            </div>

            <div className="relative min-h-[560px] lg:min-h-full">
              {editorialProduct?.images[1] || editorialProduct?.images[0] ? (
                <Image
                  src={editorialProduct.images[1] || editorialProduct.images[0]}
                  alt={`${getProductDisplayName(editorialProduct)} fabric and fit`}
                  fill
                  unoptimized={shouldBypassImageOptimization(editorialProduct.images[1] || editorialProduct.images[0])}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className="h-full bg-[var(--surface-strong)]" />
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
          <div className="grid gap-10 lg:grid-cols-[0.42fr_0.58fr] lg:gap-24">
            <div>
              <p className="eyebrow text-[var(--muted)]">Defined quietly</p>
              <h2 className="mt-5 max-w-[9ch] text-[2rem] font-medium leading-[0.98] tracking-[-0.035em] sm:text-[2.5rem] lg:text-[3.5rem]">
                Fewer pieces. Better reasons to wear them.
              </h2>
            </div>
            <div className="border-t border-[var(--border)]">
              {philosophy.map((item) => (
                <article key={item.number} className="grid gap-4 border-b border-[var(--border)] py-8 sm:grid-cols-[64px_180px_1fr] sm:items-start">
                  <p className="text-[0.68rem] font-semibold tracking-[0.14em] text-[var(--muted)]">{item.number}</p>
                  <h3 className="text-lg font-medium">{item.title}</h3>
                  <p className="max-w-xl text-sm leading-7 text-[var(--muted)]">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-[var(--border)] bg-[var(--surface)]">
          <div className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
            <TrustBadges />
          </div>
        </section>

        {customerReviews.length > 0 ? (
          <section className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
            <p className="eyebrow text-[var(--muted)]">Customer proof</p>
            <h2 className="mt-5 max-w-[12ch] text-[2rem] font-medium leading-[0.98] tracking-[-0.035em] sm:text-[2.5rem] lg:text-[3.5rem]">
              Worn beyond the studio.
            </h2>
            <div className="mt-12 grid gap-px bg-[var(--border)] lg:grid-cols-3">
              {customerReviews.map(({ product, ...review }) => (
                <article key={`${product.id}-${review.id || review.reviewerName}`} className="bg-[var(--background)] p-6 sm:p-8">
                  <p className="text-sm tracking-[0.08em]">{"★".repeat(review.rating || 5)}</p>
                  <blockquote className="mt-8 text-xl leading-8">“{review.quote}”</blockquote>
                  <p className="mt-10 text-xs font-semibold uppercase tracking-[0.12em]">{review.reviewerName}</p>
                  <p className="mt-2 text-xs text-[var(--muted)]">{getProductDisplayName(product)}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mx-auto max-w-[960px] px-4 py-20 text-center sm:px-6 sm:py-28 lg:py-32">
          <p className="eyebrow text-[var(--muted)]">Newsletter</p>
          <h2 className="mx-auto mt-5 max-w-[16ch] text-[2rem] font-medium leading-[1] tracking-[-0.035em] sm:text-[2.5rem] lg:text-[3.5rem]">
            New drops. Restocks. Nothing unnecessary.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-[var(--muted)] sm:text-base">
            First access to new releases and considered updates from HRUSHE.
          </p>
          <form onSubmit={handleNewsletterSubmit} className="mx-auto mt-10 flex max-w-2xl flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="newsletter-email">Email address</label>
            <input
              id="newsletter-email"
              type="email"
              value={newsletterEmail}
              onChange={(event) => setNewsletterEmail(event.target.value)}
              placeholder="Email address"
              className="min-h-12 flex-1 border border-[var(--border)] bg-[var(--surface)] px-4 text-sm outline-none focus:border-[var(--foreground)] lg:min-h-[52px]"
            />
            <button type="submit" disabled={newsletterSubmitting} className="button-primary px-8 text-[0.7rem] font-semibold uppercase disabled:cursor-not-allowed disabled:opacity-50">
              {newsletterSubmitting ? "Joining" : "Join the list"}
            </button>
          </form>
          {newsletterFeedback ? (
            <p className={`mt-4 text-sm ${newsletterFeedback.type === "success" ? "text-[var(--success)]" : "text-[var(--danger)]"}`} role="status">
              {newsletterFeedback.message}
            </p>
          ) : null}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
