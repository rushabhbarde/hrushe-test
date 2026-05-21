"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProductListingGrid, ProductListingSkeleton } from "@/components/product-listing-grid";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useStorefrontData } from "@/lib/use-storefront";

const quickLinks = [
  { label: "New In", href: "/new-in" },
  { label: "Oversized", href: "/shop" },
  { label: "Best Sellers", href: "/shop" },
  { label: "Story", href: "/story" },
];

const approachPoints = [
  {
    title: "Simple shapes",
    body: "Relaxed silhouettes that stay easy to wear, not exaggerated for effect.",
  },
  {
    title: "Better fabric feel",
    body: "Soft hand-feel and everyday durability built into each drop.",
  },
  {
    title: "Less noise",
    body: "A tighter wardrobe edit with cleaner colours and quieter graphics.",
  },
];

export default function Home() {
  const { featuredProducts, homepageBanner, products, loading } = useStorefrontData();
  const [availableBannerImages, setAvailableBannerImages] = useState<string[]>([]);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const hasSecondaryCta = Boolean(homepageBanner.secondaryCtaLabel?.trim());
  const heroEyebrow =
    homepageBanner.eyebrow?.trim() &&
    homepageBanner.eyebrow.trim().toLowerCase() !== "home page banner"
      ? homepageBanner.eyebrow.trim()
      : "Current collection";

  const spotlightProducts = useMemo(() => {
    if (featuredProducts.length > 0) {
      return featuredProducts.slice(0, 4);
    }

    const prioritized = products.filter((product) => product.newArrival || product.newIn);
    return (prioritized.length > 0 ? prioritized : products).slice(0, 4);
  }, [featuredProducts, products]);

  const heroImages = useMemo(() => {
    const productImages = spotlightProducts.flatMap((product) => product.images).filter(Boolean);
    const merged = [
      homepageBanner.imageUrl || "/uploads/banners/banner1.png",
      ...availableBannerImages,
      ...productImages,
    ].filter(Boolean);

    return Array.from(new Set(merged));
  }, [availableBannerImages, homepageBanner.imageUrl, spotlightProducts]);

  const activeHeroImage = heroImages[activeBannerIndex % Math.max(heroImages.length, 1)] || "";
  const secondaryHeroImage = heroImages[(activeBannerIndex + 1) % Math.max(heroImages.length, 1)] || activeHeroImage;
  const tertiaryHeroImage = heroImages[(activeBannerIndex + 2) % Math.max(heroImages.length, 1)] || secondaryHeroImage;

  const collectionLabels = useMemo(() => {
    const dynamic = Array.from(
      new Set(
        products.flatMap((product) =>
          product.categories && product.categories.length > 0
            ? product.categories
            : [product.category]
        )
      )
    ).slice(0, 4);

    return dynamic.length > 0 ? dynamic : ["T-Shirts", "Oversized", "Polos", "Essentials"];
  }, [products]);

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
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [heroImages.length]);

  return (
    <div className="page-shell bg-[var(--background)]">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-[1600px] px-4 pb-10 pt-6 sm:px-6 sm:pb-14 sm:pt-8 lg:px-8 lg:pb-20 lg:pt-10">
          <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-end lg:gap-10 xl:gap-14">
            <div className="reveal-up max-w-xl">
              <p className="eyebrow text-[var(--muted)]">{heroEyebrow}</p>
              <h1 className="mt-4 text-[2.65rem] font-semibold uppercase leading-[0.92] tracking-[-0.08em] text-[var(--foreground)] sm:max-w-[11ch] sm:text-[4.25rem] lg:text-[5.4rem]">
                {homepageBanner.title}
              </h1>
              <p className="mt-5 max-w-lg text-[0.95rem] leading-7 text-[var(--muted)] sm:text-base">
                {homepageBanner.description}
              </p>

              {hasSecondaryCta ? (
                <div className="mt-7 flex flex-wrap gap-3">
                  {hasSecondaryCta ? (
                    <Link
                      href={homepageBanner.secondaryCtaHref}
                      className="inline-flex min-h-11 items-center justify-center border border-[var(--border)] px-5 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-[var(--foreground)] transition hover:border-[var(--foreground)]"
                    >
                      {homepageBanner.secondaryCtaLabel}
                    </Link>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-8 grid gap-2 sm:max-w-[520px] sm:grid-cols-2">
                {quickLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex min-h-12 items-center justify-between border border-[var(--border)] px-4 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-[var(--foreground)] transition hover:border-[var(--foreground)]"
                  >
                    <span>{item.label}</span>
                    <span className="text-[var(--muted)]">↗</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="reveal-up-delayed grid gap-3 sm:grid-cols-[1.1fr_0.9fr] sm:gap-4">
              <div className="relative aspect-[4/5] overflow-hidden bg-[var(--surface-strong)]">
                {activeHeroImage ? (
                  <Image
                    src={activeHeroImage}
                    alt={homepageBanner.title}
                    fill
                    unoptimized
                    className="object-cover object-center"
                  />
                ) : null}
              </div>
              <div className="grid gap-3 sm:gap-4">
                <div className="relative aspect-[4/4.8] overflow-hidden bg-[var(--surface-strong)]">
                  {secondaryHeroImage ? (
                    <Image
                      src={secondaryHeroImage}
                      alt="Hrushe collection detail"
                      fill
                      unoptimized
                      className="object-cover object-center"
                    />
                  ) : null}
                </div>
                <div className="relative flex aspect-[4/4.2] flex-col justify-between overflow-hidden bg-[var(--surface-strong)] p-5 sm:p-6">
                  {tertiaryHeroImage ? (
                    <Image
                      src={tertiaryHeroImage}
                      alt="New this week"
                      fill
                      unoptimized
                      className="object-cover object-center opacity-28"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.3),rgba(255,255,255,0.88))]" />
                  <div className="relative z-10">
                    <p className="eyebrow text-[var(--muted)]">New this week</p>
                    <p className="mt-3 max-w-[12ch] text-[1.7rem] font-semibold uppercase leading-[0.98] tracking-[-0.06em] text-[var(--foreground)]">
                      The latest everyday edit.
                    </p>
                  </div>
                  <div className="relative z-10 flex items-center justify-between border-t border-[var(--border)] pt-4 text-[0.72rem] uppercase tracking-[0.16em] text-[var(--muted)]">
                    <span>{spotlightProducts.length} styles</span>
                    <Link href="/new-in" className="text-[var(--foreground)] hover:text-[var(--accent)]">
                      View all
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
          <div className="flex flex-col gap-4 border-t border-[var(--border)] py-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              <p className="eyebrow text-[var(--muted)]">New this week</p>
              <h2 className="mt-3 text-[2.1rem] font-semibold uppercase leading-[0.95] tracking-[-0.07em] text-[var(--foreground)] sm:text-[3.25rem]">
                A tighter edit of easy, premium basics.
              </h2>
            </div>
            <Link
              href="/shop"
              className="text-[0.72rem] font-medium uppercase tracking-[0.16em] text-[var(--foreground)] hover:text-[var(--accent)]"
            >
              Explore all products
            </Link>
          </div>

          {loading ? (
            <div className="pt-2">
              <ProductListingSkeleton count={4} />
            </div>
          ) : (
            <div className="pt-2">
              <ProductListingGrid products={spotlightProducts} />
            </div>
          )}
        </section>

        <section className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
          <div className="grid gap-8 border-t border-[var(--border)] py-8 lg:grid-cols-[0.84fr_1.16fr] lg:gap-12 lg:py-12">
            <div className="reveal-up max-w-xl">
              <p className="eyebrow text-[var(--muted)]">Current collection</p>
              <h2 className="mt-3 text-[2.25rem] font-semibold uppercase leading-[0.94] tracking-[-0.07em] text-[var(--foreground)] sm:text-[3.45rem]">
                Built around fit, fabric, and repeat wear.
              </h2>
              <p className="mt-5 text-[0.95rem] leading-7 text-[var(--muted)]">
                Hrushe focuses on fewer, better basics. The collection stays calm, wearable, and
                clear enough to live in every day.
              </p>

              <div className="mt-7 flex flex-wrap gap-2">
                {collectionLabels.map((label) => (
                  <Link
                    key={label}
                    href="/shop"
                    className="inline-flex min-h-10 items-center border border-[var(--border)] px-4 text-[0.7rem] uppercase tracking-[0.16em] text-[var(--foreground)] transition hover:border-[var(--foreground)]"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              {spotlightProducts.slice(0, 2).map((product) => (
                <Link
                  key={`story-${product.id}`}
                  href={`/product/${product.slug || product.id}`}
                  className="group block"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-[var(--surface-strong)]">
                    {product.images[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        unoptimized
                        className="object-cover object-center transition duration-500 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="h-full w-full" style={{ backgroundColor: product.accent }} />
                    )}
                  </div>
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="line-clamp-2 text-[0.95rem] font-medium uppercase leading-[1.1] tracking-[-0.03em] text-[var(--foreground)]">
                        {product.name}
                      </p>
                      <p className="mt-1 text-[0.72rem] uppercase tracking-[0.14em] text-[var(--muted)]">
                        {product.category}
                      </p>
                    </div>
                    <span className="text-[0.72rem] uppercase tracking-[0.14em] text-[var(--muted)]">
                      Rs.{product.price}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
          <div className="grid gap-8 border-t border-[var(--border)] py-8 lg:grid-cols-[0.76fr_1.24fr] lg:gap-12 lg:py-12">
            <div className="reveal-up max-w-lg">
              <p className="eyebrow text-[var(--muted)]">Our approach to fashion design</p>
              <h2 className="mt-3 text-[2.1rem] font-semibold uppercase leading-[0.95] tracking-[-0.07em] text-[var(--foreground)] sm:text-[3.2rem]">
                Quiet clothes with enough character to stay interesting.
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {approachPoints.map((point) => (
                <div key={point.title} className="border-t border-[var(--border)] pt-4">
                  <p className="text-[0.92rem] font-medium uppercase tracking-[0.02em] text-[var(--foreground)]">
                    {point.title}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{point.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1180px] px-4 pb-14 pt-8 sm:px-6 lg:px-8 lg:pb-20 lg:pt-12">
          <div className="border border-[var(--border)] px-6 py-8 text-center sm:px-8 sm:py-10">
            <p className="eyebrow text-[var(--muted)]">Newsletter</p>
            <h2 className="mt-3 text-[2rem] font-semibold uppercase leading-[0.96] tracking-[-0.07em] text-[var(--foreground)] sm:text-[3rem]">
              Launches, restocks, and quiet updates.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-[0.95rem]">
              Join the list for first access to new drops and product restocks.
            </p>
            <form className="mx-auto mt-7 flex max-w-[680px] flex-col gap-3 sm:flex-row">
              <input
                type="email"
                placeholder="Enter your email"
                className="min-h-12 min-w-0 flex-1 border border-[var(--border)] bg-[var(--surface)] px-4 text-sm outline-none placeholder:text-[var(--muted)]/70 focus:border-[var(--foreground)]"
              />
              <button
                type="submit"
                className="min-h-12 border border-[var(--foreground)] bg-[var(--foreground)] px-5 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-[var(--background)] transition hover:opacity-88"
              >
                Join now
              </button>
            </form>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
