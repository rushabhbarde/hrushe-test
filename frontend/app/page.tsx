"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProductCardScroller } from "@/components/product-card-scroller";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useStorefrontData } from "@/lib/use-storefront";

const trustPoints = [
  {
    title: "Premium everyday fabric",
    description: "Soft hand feel, cleaner fall, and quality that holds up beyond the first wear.",
  },
  {
    title: "Built for unisex styling",
    description: "Relaxed silhouettes shaped to feel effortless across different body types.",
  },
  {
    title: "Honest value",
    description: "A sharper middle ground between disposable fast fashion and overpriced basics.",
  },
];

const campaignWords = [
  "Oversize essentials",
  "Regular fit staples",
  "Clean graphics",
  "Everyday cotton",
  "Launch edition",
  "Minimal wardrobe",
];

export default function Home() {
  const { featuredProducts, homepageBanner, products } = useStorefrontData();
  const [availableBannerImages, setAvailableBannerImages] = useState<string[]>([]);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const newInProducts = products.filter((product) => product.newIn).slice(0, 4);
  const newArrivals = products.filter((product) => product.newArrival).slice(0, 4);
  const bestSellerProducts = products.filter((product) => product.bestSeller).slice(0, 4);
  const bestSellers = (
    bestSellerProducts.length > 0
      ? bestSellerProducts
      : [...products].sort((first, second) => second.price - first.price)
  ).slice(0, 4);
  const categoryHighlights = Array.from(
    new Map(
      products.flatMap((product) =>
        (product.categories && product.categories.length > 0
          ? product.categories
          : [product.category]
        ).map((category) => [category, { ...product, category }])
      )
    ).values()
  ).slice(0, 4);
  const reviewTestimonials = useMemo(
    () =>
      products.flatMap((product) =>
        (product.reviews || []).map((review, index) => ({
          id: `${product.id}-${review.id || index}`,
          quote: review.quote,
          name: review.reviewerName,
          role: `${product.name} review`,
          photo: review.photo || product.images[0] || "",
        }))
      ),
    [products]
  );
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const heroBannerImages = useMemo(() => {
    const merged = [
      homepageBanner.imageUrl || "/uploads/banners/banner1.png",
      ...availableBannerImages,
    ].filter(Boolean);

    return Array.from(new Set(merged));
  }, [availableBannerImages, homepageBanner.imageUrl]);
  const safeBannerIndex =
    heroBannerImages.length > 0 ? activeBannerIndex % heroBannerImages.length : 0;
  const activeBannerImage = heroBannerImages[safeBannerIndex] || heroBannerImages[0] || "";
  const mobileBannerDescription = homepageBanner.description.includes(".")
    ? `${homepageBanner.description.split(".")[0]}.`
    : homepageBanner.description;
  const primaryHeroCtaLabel =
    homepageBanner.primaryCtaLabel === "Shop men"
      ? "Shop the drop"
      : homepageBanner.primaryCtaLabel;

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
    if (heroBannerImages.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveBannerIndex((current) => (current + 1) % heroBannerImages.length);
    }, 4000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [heroBannerImages]);

  useEffect(() => {
    if (reviewTestimonials.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveReviewIndex((current) => (current + 1) % reviewTestimonials.length);
    }, 4500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [reviewTestimonials]);

  return (
    <div className="page-shell">
      <SiteHeader />
      <main>
        <section className="w-full py-0">
          <div className="hero-stage theme-spotlight relative h-[calc(100svh-114px)] min-h-[520px] w-full overflow-hidden bg-[var(--surface-strong)] sm:h-[calc(100svh-132px)] sm:min-h-[620px]">
            {activeBannerImage ? (
              <div
                key={activeBannerImage}
                className="absolute inset-0 animate-[banner-slide_900ms_cubic-bezier(0.22,1,0.36,1)]"
              >
                <Image
                  src={activeBannerImage}
                  alt={homepageBanner.title}
                  width={1920}
                  height={1080}
                  unoptimized
                  className="block h-full w-full object-cover object-center"
                />
              </div>
            ) : (
              <div className="h-full w-full" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/68 via-black/18 to-transparent sm:from-black/56 sm:via-black/12" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end px-4 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-10">
              <div className="reveal-up max-w-3xl text-white">
                <p className="eyebrow hidden text-[var(--accent)] sm:block">{homepageBanner.eyebrow}</p>
                <h1 className="mt-2 max-w-[13ch] text-[1.7rem] font-medium uppercase leading-[1.05] tracking-[-0.03em] sm:mt-3 sm:max-w-none sm:text-4xl lg:text-5xl xl:text-6xl">
                  {homepageBanner.title}
                </h1>
                <p className="mt-2 max-w-[30ch] text-[0.78rem] leading-5 text-white/84 sm:hidden">
                  {mobileBannerDescription}
                </p>
                <p className="mt-3 hidden max-w-2xl text-base leading-7 text-white/82 sm:block">
                  {homepageBanner.description}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-6 sm:gap-3">
                <Link
                  href={homepageBanner.primaryCtaHref}
                  className="inline-flex rounded-full border border-white/10 bg-white px-4 py-2.5 text-xs font-semibold tracking-[0.08em] text-black shadow-lg transition hover:bg-[#f3f3f3] sm:px-6 sm:py-3 sm:text-sm"
                >
                  {primaryHeroCtaLabel}
                </Link>
                <Link
                  href={homepageBanner.secondaryCtaHref}
                  className="hidden rounded-full border border-white/70 bg-black/55 px-4 py-2.5 text-xs font-semibold tracking-[0.08em] !text-white backdrop-blur-md transition hover:bg-black/70 sm:inline-flex sm:px-6 sm:py-3 sm:text-sm"
                >
                  {homepageBanner.secondaryCtaLabel}
                </Link>
              </div>
              {heroBannerImages.length > 1 ? (
                <div className="mt-4 flex items-center gap-2 sm:mt-6">
                  {heroBannerImages.map((image, index) => (
                    <button
                      key={image}
                      type="button"
                      aria-label={`Show banner ${index + 1}`}
                      onClick={() => setActiveBannerIndex(index)}
                      className={`h-2 rounded-full transition ${
                        safeBannerIndex === index
                          ? "w-7 bg-white"
                          : "w-2 bg-white/45"
                      }`}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="brand-marquee">
          <div className="brand-marquee-track py-3">
            <div className="brand-marquee-content text-[0.7rem] font-medium uppercase tracking-[0.18em] text-[var(--muted)] sm:text-[0.76rem]">
              {[...campaignWords, ...campaignWords, ...campaignWords].map((word, index) => (
                <span key={`${word}-${index}`} className="inline-flex items-center gap-3">
                  <span>{word}</span>
                  <span className="h-1 w-1 rounded-full bg-[var(--accent)]/80" />
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 pb-10 pt-4 sm:px-6 sm:pb-12 lg:px-8">
          <div className="grid gap-8 border-b border-[var(--border)] pb-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:gap-14 lg:pb-14">
            <div className="reveal-up max-w-xl">
              <p className="eyebrow text-[var(--accent)]">Luxury essentials</p>
              <h2 className="display-font mt-4 text-[2.15rem] leading-[1.04] tracking-[-0.05em] sm:text-5xl lg:text-[3.8rem]">
                Elevated silhouettes with softer fabric feel and a cleaner everyday rhythm.
              </h2>
            </div>
            <div className="reveal-up-delayed grid gap-3 text-left sm:grid-cols-3">
              <div className="border border-[var(--border)] bg-[var(--surface)] px-4 py-5">
                <p className="eyebrow text-[var(--accent)]">Fabric first</p>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  Softer hand feel, cleaner fall, and pieces made to stay in rotation.
                </p>
              </div>
              <div className="border border-[var(--border)] bg-[var(--surface)] px-4 py-5">
                <p className="eyebrow text-[var(--accent)]">Effortless fit</p>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  Relaxed proportions with wearable shapes across different body types.
                </p>
              </div>
              <div className="border border-[var(--border)] bg-[var(--surface)] px-4 py-5">
                <p className="eyebrow text-[var(--accent)]">Launch ready</p>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  A focused edit of elevated basics with a sharper premium point of view.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Featured collection"
            eyebrowClassName="text-[var(--accent)]"
            title="Selected styles for the current edit."
            description="This keeps the cleaner fashion-retail feel from the reference while still letting us drive into a curated launch collection."
          />
          <ProductCardScroller products={featuredProducts} />
        </section>

        <section className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="New arrivals"
            eyebrowClassName="text-[var(--accent)]"
            title="Fresh pieces landing for the first launch."
            description="Newness stays front and center with a dedicated edit for the latest silhouettes, colors, and graphics."
          />
          <ProductCardScroller
            products={
              newArrivals.length > 0
                ? newArrivals
                : newInProducts.length > 0
                  ? newInProducts
                  : products.slice(0, 4)
            }
          />
        </section>

        <section className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Best sellers"
            eyebrowClassName="text-[var(--accent)]"
            title="The strongest pieces in the current catalog."
            description="A premium-looking storefront still needs commercial focus, so this section spotlights the biggest-value styles."
          />
          <ProductCardScroller products={bestSellers} />
        </section>

        <section className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Category sections"
            eyebrowClassName="text-[var(--accent)]"
            title="Explore the wardrobe by how you actually dress."
            description="A cleaner storefront gets stronger when category discovery feels intentional, not crowded."
          />
          <div className="mt-8 grid gap-4 sm:mt-10 md:grid-cols-2 xl:grid-cols-4">
            {categoryHighlights.map((product) => (
              <Link
                key={`category-${product.category}`}
                href="/shop"
                className="group reveal-up-soft relative overflow-hidden border border-[var(--border)] transition hover:-translate-y-1"
              >
                <div className="relative aspect-[4/5] bg-[var(--surface-strong)]">
                  {product.images[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.category}
                      fill
                      unoptimized
                      className="object-cover transition duration-500 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="h-full w-full" style={{ background: product.accent }} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/18 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
                    <p className="eyebrow text-white/72">{product.category}</p>
                    <h3 className="display-font mt-3 text-3xl leading-none tracking-[-0.04em]">
                      {product.name}
                    </h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/76">
                      {product.description}
                    </p>
                    <span className="mt-5 inline-flex text-sm font-semibold tracking-[0.06em] text-white">
                      Explore collection
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-[1.12fr_0.88fr] lg:gap-8">
            <div className="reveal-up border border-[var(--border)] bg-[var(--surface)] px-6 py-8 sm:px-8 lg:px-10 lg:py-12">
              <p className="eyebrow text-[var(--accent)]">Brand statement</p>
              <h2 className="display-font mt-4 text-3xl leading-tight tracking-[-0.05em] sm:text-4xl lg:text-[3.3rem]">
                Built for everyday confidence, not disposable trends.
              </h2>
              <p className="mt-5 max-w-2xl text-[0.98rem] leading-8 text-[var(--muted)]">
                HRUSHE exists between cheap fast fashion and overpriced basics. We focus on
                minimal design, comfortable fits, durable fabric, and straightforward honesty in
                what we make and how we price it.
              </p>
            </div>
            <div className="reveal-up-delayed grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="theme-panel p-6">
                <p className="eyebrow text-[var(--accent)]">Comfort first</p>
                <p className="mt-3 text-lg leading-7 text-[var(--foreground)]">
                  Relaxed silhouettes, soft fabric feel, and wearable shapes across body types.
                </p>
              </div>
              <div className="theme-panel p-6">
                <p className="eyebrow text-[var(--accent)]">Clean design</p>
                <p className="mt-3 text-lg leading-7 text-[var(--foreground)]">
                  Strong graphics when needed, but always grounded in a neutral everyday wardrobe.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Testimonials / trust"
            eyebrowClassName="text-[var(--accent)]"
            title="Designed to feel dependable before it ever feels loud."
            description="Early community feedback and brand principles that reinforce the premium everyday direction."
          />
          <div className="mt-8 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <div>
              <div className="hero-panel rounded-[2rem] p-6 sm:p-8">
                <p className="eyebrow text-[var(--accent)]">Why customers trust the brand</p>
                <div className="mt-6 space-y-5">
                  {trustPoints.map((point) => (
                    <div
                      key={point.title}
                      className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-elevated)] p-5"
                    >
                      <p className="text-lg font-semibold">{point.title}</p>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                        {point.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grain-card rounded-[2rem] p-6 sm:p-8">
              {reviewTestimonials.length > 0 ? (
                <div>
                  <p className="eyebrow text-[var(--accent)]">Live product reviews</p>
                  <div className="mt-6 overflow-hidden rounded-[1.8rem] border border-[var(--border)] bg-[var(--surface-elevated)]">
                    <div className="grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
                      <div className="relative aspect-[1.08/1] min-h-[220px] bg-[#ebe7df]">
                        {reviewTestimonials[activeReviewIndex]?.photo ? (
                          <Image
                            src={reviewTestimonials[activeReviewIndex].photo}
                            alt={reviewTestimonials[activeReviewIndex].name}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col justify-between bg-[linear-gradient(180deg,color-mix(in_srgb,var(--accent)_12%,transparent),color-mix(in_srgb,var(--foreground)_3%,transparent))] p-5 sm:p-6">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-xl font-semibold text-[var(--foreground)] shadow-sm">
                              {reviewTestimonials[activeReviewIndex]?.name?.charAt(0) || "H"}
                            </div>
                            <div>
                              <p className="eyebrow text-[var(--accent)]">Customer spotlight</p>
                              <p className="mt-3 text-lg font-semibold text-[var(--foreground)] sm:text-xl">
                                {reviewTestimonials[activeReviewIndex]?.name}
                              </p>
                              <p className="mt-1 text-sm text-[var(--muted)]">
                                {reviewTestimonials[activeReviewIndex]?.role}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col justify-between p-6 sm:p-8">
                        <div>
                          <div className="flex items-center gap-1 text-[var(--accent)]">
                            {Array.from({ length: 5 }).map((_, index) => (
                              <span key={index} className="text-sm">
                                ★
                              </span>
                            ))}
                          </div>
                          <p className="mt-4 text-lg leading-8 text-[var(--foreground)] sm:text-xl">
                            &ldquo;{reviewTestimonials[activeReviewIndex].quote}&rdquo;
                          </p>
                        </div>
                        <div className="mt-8 border-t border-[var(--border)] pt-5">
                          <p className="font-semibold">
                            {reviewTestimonials[activeReviewIndex].name}
                          </p>
                          <p className="mt-1 text-sm text-[var(--muted)]">
                            {reviewTestimonials[activeReviewIndex].role}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {reviewTestimonials.length > 1 ? (
                  <div className="mt-4 flex items-center gap-2">
                      {reviewTestimonials.map((review, index) => (
                        <button
                          key={review.id}
                          type="button"
                          aria-label={`Show review ${index + 1}`}
                          onClick={() => setActiveReviewIndex(index)}
                          className={`h-2 rounded-full transition ${
                            activeReviewIndex === index
                              ? "w-7 bg-[var(--accent)]"
                              : "w-2 bg-black/20"
                          }`}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
                  <p className="text-base leading-8 text-[var(--muted)]">
                    Product reviews will appear here once customers start sharing feedback and photos.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 lg:px-8">
          <div className="border border-[var(--border)] bg-[var(--surface)] px-6 py-10 text-center sm:px-8 lg:px-14 lg:py-14">
            <p className="eyebrow text-[var(--accent)]">Newsletter</p>
            <h2 className="display-font mt-4 text-3xl tracking-[-0.05em] sm:text-4xl lg:text-5xl">
              Join the list for launches, early access, and drop updates.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
              Keep this simple for launch: one clear sign-up moment for the people most likely to buy again.
            </p>
            <form className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row">
              <input
                type="email"
                placeholder="Enter your email"
                className="min-w-0 flex-1 border border-[var(--border)] bg-[var(--surface-strong)] px-5 py-3.5"
              />
              <button
                type="submit"
                className="button-primary px-6 py-3 text-sm tracking-[0.08em] transition"
              >
                Join newsletter
              </button>
            </form>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
