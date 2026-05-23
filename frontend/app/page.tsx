"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/catalog";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ProductCard } from "@/components/product-card";
import { apiRequest } from "@/lib/api";
import { useStorefrontData } from "@/lib/use-storefront";

function getSeasonLabel() {
  const month = new Date().getMonth();

  if (month >= 2 && month <= 4) {
    return "Spring";
  }

  if (month >= 5 && month <= 7) {
    return "Summer";
  }

  if (month >= 8 && month <= 10) {
    return "Autumn";
  }

  return "Winter";
}

const quickLinks = [
  { label: "New In", href: "/new-in" },
  { label: "Oversized", href: "/shop" },
  { label: "Best Sellers", href: "/shop" },
  { label: "Story", href: "/story" },
];

export default function Home() {
  const router = useRouter();
  const { featuredProducts, homepageBanner, products, loading } = useStorefrontData();
  const [availableBannerImages, setAvailableBannerImages] = useState<string[]>([]);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const [newsletterFeedback, setNewsletterFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const heroEyebrow =
    homepageBanner.eyebrow?.trim() &&
    homepageBanner.eyebrow.trim().toLowerCase() !== "home page banner"
      ? homepageBanner.eyebrow.trim()
      : "NEW SEASON, EVERYDAY ESSENTIALS";

  const seasonLabel = getSeasonLabel();
  const seasonYear = new Date().getFullYear();
  const heroCtaLabel = homepageBanner.secondaryCtaLabel?.trim() || "Go to shop";
  const heroCtaHref = homepageBanner.secondaryCtaHref || "/shop";

  const spotlightProducts = useMemo(() => {
    if (featuredProducts.length > 0) {
      return featuredProducts.slice(0, 4);
    }

    const prioritized = products.filter((product) => product.newArrival || product.newIn);
    return (prioritized.length > 0 ? prioritized : products).slice(0, 4);
  }, [featuredProducts, products]);

  const newInProducts = useMemo(() => {
    const fresh = products.filter((product) => product.newArrival || product.newIn);
    return (fresh.length > 0 ? fresh : products).slice(0, 8);
  }, [products]);
  const newInDisplayItems: Array<Product | null> = loading
    ? [null, null, null, null]
    : newInProducts;

  const collectionProducts = useMemo(() => {
    const ranked = products.filter((product) => product.bestSeller || product.featured);
    return (ranked.length > 0 ? ranked : products).slice(0, 6);
  }, [products]);
  const collectionDisplayItems: Array<Product | null> = loading
    ? [null, null, null, null]
    : collectionProducts;

  const heroImages = useMemo(() => {
    if (loading) {
      return [];
    }

    const productImages = products.flatMap((product) => product.images).filter(Boolean);
    const merged = [
      homepageBanner.imageUrl || "/uploads/banners/banner1.png",
      ...availableBannerImages,
      ...productImages,
    ].filter(Boolean);

    return Array.from(new Set(merged));
  }, [availableBannerImages, homepageBanner.imageUrl, loading, products]);

  const collectionLabels = useMemo(() => {
    const dynamic = Array.from(
      new Set(
        collectionProducts.flatMap((product) =>
          product.categories && product.categories.length > 0 ? product.categories : [product.category]
        )
      )
    ).filter(Boolean);

    return dynamic.length > 0 ? dynamic.slice(0, 2) : ["Essentials", "Oversized"];
  }, [collectionProducts]);

  const activeHeroImage = heroImages[activeBannerIndex % Math.max(heroImages.length, 1)] || "";
  const secondaryHeroImage = heroImages[(activeBannerIndex + 1) % Math.max(heroImages.length, 1)] || activeHeroImage;
  const tertiaryHeroImage = heroImages[(activeBannerIndex + 2) % Math.max(heroImages.length, 1)] || secondaryHeroImage;

  useEffect(() => {
    let active = true;

    const loadBannerImages = async () => {
      try {
        const response = await fetch("/api/banner-images");
        const data = (await response.json()) as { images?: string[] };

        if (active) {
          setAvailableBannerImages(Array.isArray(data.images) ? data.images : []);
        }
      } catch {
        if (active) {
          setAvailableBannerImages([]);
        }
      }
    };

    void loadBannerImages();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (heroImages.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveBannerIndex((current) => (current + 1) % heroImages.length);
    }, 6000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [heroImages.length]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();

    if (!query) {
      router.push("/search");
      return;
    }

    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleNewsletterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const email = newsletterEmail.trim().toLowerCase();

    if (!email) {
      setNewsletterFeedback({ type: "error", message: "Enter your email address first." });
      return;
    }

    setNewsletterSubmitting(true);
    setNewsletterFeedback(null);

    try {
      const response = await apiRequest<{ message: string }>("/newsletter/subscribe", {
        method: "POST",
        body: JSON.stringify({
          email,
          source: "homepage",
        }),
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
    <div className="page-shell bg-[var(--background)] paper-texture">
      <SiteHeader />
      <main className="overflow-hidden">
        <section className="mx-auto max-w-[1600px] px-4 pb-14 pt-5 sm:px-6 sm:pb-16 sm:pt-6 lg:px-8 lg:pb-20 lg:pt-8">
          <div className="grid gap-7 sm:gap-10 lg:grid-cols-[0.34fr_0.66fr] lg:gap-14 xl:gap-20">
            <div className="order-2 flex flex-col gap-5 lg:order-1 lg:gap-6 lg:pt-1">
              <div className="space-y-5">
                <form onSubmit={handleSearchSubmit} className="max-w-full sm:max-w-[240px]">
                  <label className="flex min-h-11 items-center gap-3 border border-[var(--border)] bg-[var(--surface-strong)] px-3">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-4 w-4 text-[var(--muted)]"
                      aria-hidden="true"
                    >
                      <path
                        d="M21 21L16.65 16.65M10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5C18 14.6421 14.6421 18 10.5 18Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search"
                      className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted)]/70"
                    />
                  </label>
                </form>
              </div>

              <div className="reveal-up max-w-[36rem]">
                {loading ? (
                  <div aria-hidden="true" className="space-y-5">
                    <div className="h-4 w-52 animate-pulse bg-[rgba(17,17,17,0.08)]" />
                    <div className="space-y-3">
                      <div className="h-16 w-full max-w-[31rem] animate-pulse bg-[rgba(17,17,17,0.08)]" />
                      <div className="h-16 w-[88%] max-w-[28rem] animate-pulse bg-[rgba(17,17,17,0.08)]" />
                      <div className="h-16 w-[76%] max-w-[24rem] animate-pulse bg-[rgba(17,17,17,0.08)]" />
                    </div>
                    <div className="h-7 w-48 animate-pulse bg-[rgba(17,17,17,0.06)]" />
                    <div className="h-12 w-24 animate-pulse bg-[rgba(17,17,17,0.06)]" />
                    <div className="space-y-3 pt-1">
                      <div className="h-4 w-full max-w-[24rem] animate-pulse bg-[rgba(17,17,17,0.06)]" />
                      <div className="h-4 w-[92%] max-w-[22rem] animate-pulse bg-[rgba(17,17,17,0.06)]" />
                      <div className="h-4 w-[78%] max-w-[19rem] animate-pulse bg-[rgba(17,17,17,0.06)]" />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <div className="h-11 w-48 animate-pulse bg-[rgba(17,17,17,0.08)]" />
                      <div className="h-11 w-11 animate-pulse bg-[rgba(17,17,17,0.08)]" />
                      <div className="h-11 w-11 animate-pulse bg-[rgba(17,17,17,0.08)]" />
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="eyebrow text-[var(--accent)]">{heroEyebrow}</p>
                    <h1 className="mt-4 text-[2.65rem] font-semibold uppercase leading-[0.88] tracking-[-0.09em] text-[var(--foreground)] sm:mt-5 sm:text-[4.8rem] lg:text-[5.8rem]">
                      {homepageBanner.title}
                    </h1>
                    <p className="mt-3 text-[1rem] font-medium tracking-[-0.03em] text-[var(--foreground)] sm:mt-4 sm:text-[1.35rem]">
                      Defined quietly.
                    </p>
                    <p className="mt-3 text-[0.8rem] uppercase tracking-[0.18em] text-[var(--muted)] sm:mt-4 sm:text-[0.85rem]">
                      {seasonLabel}
                      <br />
                      {seasonYear}
                    </p>
                    <p className="mt-4 max-w-[24rem] text-[0.94rem] leading-7 text-[var(--muted)] sm:mt-5 sm:text-[0.98rem] sm:leading-8">
                      {homepageBanner.description}
                    </p>

                    <div className="mt-5 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:flex-wrap sm:items-center">
                      <Link
                        href={heroCtaHref}
                        className="inline-flex min-h-11 w-full items-center justify-between gap-10 border border-[var(--border)] bg-[var(--surface-strong)] px-5 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-[var(--foreground)] transition hover:border-[var(--foreground)] sm:w-auto"
                      >
                        <span>{heroCtaLabel}</span>
                        <span aria-hidden="true">→</span>
                      </Link>

                      <div className="hidden items-center gap-2 sm:flex">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveBannerIndex((current) =>
                              current === 0 ? Math.max(heroImages.length - 1, 0) : current - 1
                            )
                          }
                          className="inline-flex h-11 w-11 items-center justify-center border border-[var(--border)] text-[var(--foreground)] transition hover:border-[var(--foreground)]"
                          aria-label="Previous banner"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveBannerIndex((current) => (current + 1) % Math.max(heroImages.length, 1))
                          }
                          className="inline-flex h-11 w-11 items-center justify-center border border-[var(--border)] text-[var(--foreground)] transition hover:border-[var(--foreground)]"
                          aria-label="Next banner"
                        >
                          ›
                        </button>
                      </div>
                    </div>
                  </>
                )}
                <div className="mt-5 pb-1">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {quickLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="group flex min-h-11 items-center justify-between border border-[var(--border)] px-3 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-[var(--foreground)] transition hover:border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)]"
                  >
                    <span>{link.label}</span>
                    <span
                      aria-hidden="true"
                      className="text-[0.95rem] text-[var(--muted)] transition group-hover:text-[var(--background)]"
                    >
                      ↗
                    </span>
                  </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 reveal-up-delayed lg:order-2">
              <div className="space-y-3 sm:space-y-4 lg:hidden">
                <div className="relative aspect-[4/5] overflow-hidden border border-[var(--border)] bg-[var(--surface-strong)]">
                  {loading ? (
                    <div className="h-full w-full animate-pulse bg-[rgba(17,17,17,0.06)]" />
                  ) : activeHeroImage ? (
                    <Image
                      src={activeHeroImage}
                      alt={homepageBanner.title}
                      fill
                      unoptimized
                      className="object-cover object-center"
                    />
                  ) : null}
                  {loading ? null : (
                    <>
                      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
                        <span className="border border-white/35 bg-black/18 px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                          Current Collection
                        </span>
                        <span className="border border-white/35 bg-white/12 px-2.5 py-1 text-[0.62rem] font-medium uppercase tracking-[0.16em] text-white backdrop-blur-sm">
                          {activeBannerIndex + 1}/{Math.max(heroImages.length, 1)}
                        </span>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.66))] p-3 pt-8">
                        <div>
                          <p className="text-[0.65rem] uppercase tracking-[0.18em] text-white/72">
                            {seasonLabel} {seasonYear}
                          </p>
                          <p className="mt-1 text-[0.92rem] font-medium tracking-[-0.03em] text-white">
                            Defined quietly.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveBannerIndex((current) =>
                                current === 0 ? Math.max(heroImages.length - 1, 0) : current - 1
                              )
                            }
                            className="inline-flex h-10 w-10 items-center justify-center border border-white/35 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/16"
                            aria-label="Previous banner"
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveBannerIndex((current) => (current + 1) % Math.max(heroImages.length, 1))
                            }
                            className="inline-flex h-10 w-10 items-center justify-center border border-white/35 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/16"
                            aria-label="Next banner"
                          >
                            ›
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-3">
                  <div className="relative aspect-[4/4.6] overflow-hidden border border-[var(--border)] bg-[var(--surface-strong)]">
                    {loading ? (
                      <div className="h-full w-full animate-pulse bg-[rgba(17,17,17,0.06)]" />
                    ) : secondaryHeroImage ? (
                      <Image
                        src={secondaryHeroImage}
                        alt="Hrushe featured look"
                        fill
                        unoptimized
                        className="object-cover object-center"
                      />
                    ) : null}
                  </div>

                  <Link
                    href="/new-in"
                    className="relative flex aspect-[4/4.6] flex-col justify-between overflow-hidden border border-[var(--border)] bg-[var(--surface)] p-4"
                  >
                    {loading ? (
                      <div className="h-full w-full animate-pulse bg-[rgba(17,17,17,0.06)]" />
                    ) : tertiaryHeroImage ? (
                      <Image
                        src={tertiaryHeroImage}
                        alt="New in at Hrushe"
                        fill
                        unoptimized
                        className="object-cover object-center opacity-20"
                      />
                    ) : null}
                    {loading ? null : (
                      <>
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.56),rgba(255,255,255,0.94))]" />
                        <div className="relative z-10">
                          <p className="eyebrow text-[var(--accent)]">New In</p>
                          <p className="mt-2.5 max-w-[10ch] text-[1.15rem] font-semibold uppercase leading-[0.95] tracking-[-0.06em] text-[var(--foreground)]">
                            The latest everyday edit.
                          </p>
                        </div>
                        <div className="relative z-10 flex items-center justify-between border-t border-[var(--border)] pt-3 text-[0.64rem] uppercase tracking-[0.16em] text-[var(--muted)]">
                          <span>{spotlightProducts.length} styles</span>
                          <span className="text-[var(--foreground)]">View</span>
                        </div>
                      </>
                    )}
                  </Link>
                </div>
              </div>

              <div className="hidden lg:grid lg:grid-cols-[minmax(0,1.06fr)_minmax(0,0.82fr)] lg:gap-4">
                <div className="relative aspect-[4/5] overflow-hidden border border-[var(--border)] bg-[var(--surface-strong)]">
                  {loading ? (
                    <div className="h-full w-full animate-pulse bg-[rgba(17,17,17,0.06)]" />
                  ) : activeHeroImage ? (
                    <Image
                      src={activeHeroImage}
                      alt={homepageBanner.title}
                      fill
                      unoptimized
                      className="object-cover object-center"
                    />
                  ) : null}
                </div>

                <div className="grid gap-4">
                  <div className="relative aspect-[4/5.15] overflow-hidden border border-[var(--border)] bg-[var(--surface-strong)]">
                    {loading ? (
                      <div className="h-full w-full animate-pulse bg-[rgba(17,17,17,0.06)]" />
                    ) : secondaryHeroImage ? (
                      <Image
                        src={secondaryHeroImage}
                        alt="Hrushe featured look"
                        fill
                        unoptimized
                        className="object-cover object-center"
                      />
                    ) : null}
                  </div>

                  <div className="relative flex aspect-[4/3.4] flex-col justify-between overflow-hidden border border-[var(--border)] bg-[var(--surface)] p-5">
                    {loading ? (
                      <div className="h-full w-full animate-pulse bg-[rgba(17,17,17,0.06)]" />
                    ) : tertiaryHeroImage ? (
                      <Image
                        src={tertiaryHeroImage}
                        alt="New in at Hrushe"
                        fill
                        unoptimized
                        className="object-cover object-center opacity-18"
                      />
                    ) : null}
                    {loading ? null : (
                      <>
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.4),rgba(255,255,255,0.92))]" />
                        <div className="relative z-10">
                          <p className="eyebrow text-[var(--accent)]">New In</p>
                          <p className="mt-3 max-w-[11ch] text-[1.55rem] font-semibold uppercase leading-[0.94] tracking-[-0.06em] text-[var(--foreground)]">
                            The latest everyday edit.
                          </p>
                        </div>
                        <div className="relative z-10 flex items-center justify-between border-t border-[var(--border)] pt-4 text-[0.72rem] uppercase tracking-[0.16em] text-[var(--muted)]">
                          <span>{spotlightProducts.length} styles</span>
                          <Link href="/new-in" className="text-[var(--foreground)] hover:text-[var(--accent)]">
                            View new in
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
          <div className="border-t border-[var(--border)] pt-14">
            <div className="mb-9 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="eyebrow text-[var(--accent)]">New In</p>
                <h2 className="mt-5 max-w-[14ch] text-[2.8rem] font-semibold uppercase leading-[0.9] tracking-[-0.08em] text-[var(--foreground)] sm:text-[4rem]">
                  A tighter edit of easy, premium basics.
                </h2>
              </div>
              <Link
                href="/new-in"
                className="text-[0.72rem] font-medium uppercase tracking-[0.16em] text-[var(--foreground)] transition hover:text-[var(--accent)]"
              >
                Explore all products
              </Link>
            </div>

            {newInDisplayItems.length > 0 ? (
              <div className="product-row-scroll -mx-4 mt-1 flex gap-3 overflow-x-auto px-4 pb-3 pt-1 sm:-mx-6 sm:px-6 sm:pb-4 lg:-mx-8 lg:gap-5 lg:px-8">
                {newInDisplayItems.map((product, index) =>
                  !product ? (
                    <div
                      key={`new-in-skeleton-${index}`}
                      className="min-w-[72vw] flex-[0_0_72vw] animate-pulse sm:min-w-[300px] sm:flex-[0_0_300px] lg:min-w-[320px] lg:flex-[0_0_320px]"
                    >
                      <div className="aspect-[18/25] bg-[var(--surface-strong)]" />
                      <div className="mt-3 h-4 w-3/4 bg-[var(--surface-strong)]" />
                      <div className="mt-2 h-3 w-28 bg-[var(--surface-strong)]" />
                    </div>
                  ) : (
                    <div
                      key={`new-in-${product.id}`}
                      className="min-w-[72vw] flex-[0_0_72vw] sm:min-w-[300px] sm:flex-[0_0_300px] lg:min-w-[320px] lg:flex-[0_0_320px]"
                    >
                      <ProductCard product={product} />
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="border border-[var(--border)] px-5 py-8 text-sm text-[var(--muted)]">
                New arrivals will appear here once products are marked as New In from admin.
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
          <div className="border-t border-[var(--border)] pt-14">
            <div className="grid gap-8 lg:grid-cols-[0.42fr_0.58fr] lg:gap-10 xl:gap-14">
              <div className="max-w-[36rem]">
                <p className="eyebrow text-[var(--accent)]">Current collection</p>
                <h2 className="mt-5 text-[2.8rem] font-semibold uppercase leading-[0.9] tracking-[-0.08em] text-[var(--foreground)] sm:text-[4.1rem]">
                  Built around fit,
                  <br />
                  fabric, and
                  <br />
                  repeat wear.
                </h2>
                <p className="mt-8 max-w-[34rem] text-[1rem] leading-8 text-[var(--muted)]">
                  Hrushe focuses on fewer, better basics. The collection stays calm, wearable, and
                  clear enough to live in every day.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  {collectionLabels.map((label) => (
                    <Link
                      key={label}
                      href="/shop"
                      className="inline-flex min-h-11 items-center border border-[var(--border)] px-5 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="product-row-scroll -mx-4 flex gap-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 sm:pb-4 lg:mx-0 lg:gap-5 lg:px-0">
                {collectionDisplayItems.map((product, index) =>
                  !product ? (
                    <div
                      key={`collection-skeleton-${index}`}
                      className="min-w-[78vw] flex-[0_0_78vw] animate-pulse sm:min-w-[330px] sm:flex-[0_0_330px] lg:min-w-[360px] lg:flex-[0_0_360px]"
                    >
                      <div className="aspect-[4/5.15] border border-[var(--border)] bg-[var(--surface-strong)]" />
                      <div className="mt-3 h-4 w-3/4 bg-[var(--surface-strong)]" />
                      <div className="mt-2 h-3 w-28 bg-[var(--surface-strong)]" />
                    </div>
                  ) : (
                    <Link
                      key={`collection-${product.id}`}
                      href={`/product/${product.slug || product.id}`}
                      className="group block min-w-[78vw] flex-[0_0_78vw] sm:min-w-[330px] sm:flex-[0_0_330px] lg:min-w-[360px] lg:flex-[0_0_360px]"
                    >
                      <div className="relative aspect-[4/5.15] overflow-hidden border border-[var(--border)] bg-[var(--surface-strong)]">
                        {product.images[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            unoptimized
                            className="object-cover object-center transition duration-500 group-hover:scale-[1.015]"
                          />
                        ) : (
                          <div
                            className="h-full w-full"
                            style={{ backgroundColor: product.accent || "var(--surface-strong)" }}
                          />
                        )}
                      </div>
                      <div className="mt-3 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-[1.02rem] font-medium uppercase leading-[1.12] tracking-[-0.02em] text-[var(--foreground)]">
                            {product.name}
                          </p>
                          <p className="mt-1 line-clamp-1 text-[0.78rem] uppercase tracking-[0.14em] text-[var(--accent)]">
                            {product.category}
                          </p>
                        </div>
                        <span className="whitespace-nowrap pt-0.5 text-[0.96rem] font-medium text-[var(--foreground)]">
                          Rs.{product.price}
                        </span>
                      </div>
                    </Link>
                  )
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
          <div className="border-t border-[var(--border)] pt-14">
            <div className="grid gap-10 lg:grid-cols-[0.38fr_0.62fr] lg:gap-12 xl:gap-16">
              <div className="max-w-[38rem]">
                <p className="eyebrow text-[var(--accent)]">Our approach to fashion design</p>
                <h2 className="mt-5 max-w-[11ch] text-[2.8rem] font-semibold uppercase leading-[0.9] tracking-[-0.08em] text-[var(--foreground)] sm:text-[4rem]">
                  Quiet clothes with enough character to stay interesting.
                </h2>
              </div>

              <div className="grid gap-8 md:grid-cols-3">
                {[
                  {
                    title: "Simple shapes",
                    copy: "Relaxed silhouettes that stay easy to wear, not exaggerated for effect.",
                  },
                  {
                    title: "Better fabric feel",
                    copy: "Soft hand-feel and everyday durability built into each drop.",
                  },
                  {
                    title: "Less noise",
                    copy: "A tighter wardrobe edit with cleaner colours and quieter graphics.",
                  },
                ].map((item) => (
                  <div key={item.title} className="border-t border-[var(--border)] pt-5">
                    <h3 className="text-[1.55rem] font-medium uppercase leading-none tracking-[-0.04em] text-[var(--foreground)]">
                      {item.title}
                    </h3>
                    <p className="mt-5 text-[0.98rem] leading-8 text-[var(--muted)]">{item.copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
          <div className="border border-[var(--border)] px-6 py-14 text-center sm:px-10 sm:py-16 lg:px-16 lg:py-20">
            <p className="eyebrow text-[var(--accent)]">Newsletter</p>
            <h2 className="mx-auto mt-5 max-w-[18ch] text-[2.5rem] font-semibold uppercase leading-[0.92] tracking-[-0.08em] text-[var(--foreground)] sm:text-[3.3rem] lg:text-[4.5rem]">
              Launches, restocks, and quiet updates.
            </h2>
            <p className="mx-auto mt-6 max-w-[38rem] text-[0.98rem] leading-8 text-[var(--muted)]">
              Join the list for first access to new drops, product restocks, and occasional notes from
              the HRUSHE team.
            </p>

            <form
              onSubmit={handleNewsletterSubmit}
              className="mx-auto mt-10 grid max-w-[56rem] gap-3 md:grid-cols-[1fr_auto]"
            >
              <label className="sr-only" htmlFor="newsletter-email">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                value={newsletterEmail}
                onChange={(event) => setNewsletterEmail(event.target.value)}
                placeholder="Enter your email"
                className="min-h-14 border border-[var(--border)] bg-[var(--background)] px-5 text-base text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
                autoComplete="email"
              />
              <button
                type="submit"
                disabled={newsletterSubmitting}
                className="inline-flex min-h-14 items-center justify-center border border-[var(--foreground)] bg-[var(--foreground)] px-8 text-[0.8rem] font-medium uppercase tracking-[0.16em] text-[var(--background)] transition hover:border-[var(--accent)] hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {newsletterSubmitting ? "Joining..." : "Join now"}
              </button>
            </form>

            {newsletterFeedback ? (
              <p
                className={`mx-auto mt-5 max-w-[42rem] text-sm ${
                  newsletterFeedback.type === "success" ? "text-[var(--accent)]" : "text-[var(--foreground)]"
                }`}
              >
                {newsletterFeedback.message}
              </p>
            ) : null}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
