"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { Product } from "@/lib/catalog";
import { getNewInProducts, sortProductsByStorefrontPriority } from "@/lib/catalog";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ProductCard } from "@/components/product-card";
import { apiRequest } from "@/lib/api";
import { shouldBypassImageOptimization } from "@/lib/image-source";
import { useHomepageBannerData, useStorefrontData } from "@/lib/use-storefront";

type HomepageReviewSlide = {
  id: string;
  reviewerName: string;
  quote: string;
  rating: number;
  photo: string;
  createdAt?: string;
  productId: string;
  productName: string;
  productHref: string;
  fallbackImage: string;
  accent: string;
  hasCustomerPhoto: boolean;
};

const reviewDateFormatter = new Intl.DateTimeFormat("en-IN", {
  month: "short",
  year: "numeric",
});

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
  { label: "Explore all products", href: "/shop" },
  { label: "Essentials", href: "/collection/essential" },
  { label: "Oversized", href: "/collection/oversized" },
];

const featuredCollectionLinks = [
  { label: "Essentials", href: "/collection/essential" },
  { label: "Oversized", href: "/collection/oversized" },
];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatReviewDate(createdAt?: string) {
  if (!createdAt) {
    return "Verified customer";
  }

  const parsedDate = new Date(createdAt);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Verified customer";
  }

  return reviewDateFormatter.format(parsedDate);
}

function getHeroTitleSizeClasses(title: string) {
  const normalized = title.replace(/\s+/g, " ").trim();
  const longestWordLength = normalized
    .split(" ")
    .reduce((max, word) => Math.max(max, word.replace(/[^a-z0-9-]/gi, "").length), 0);

  if (normalized.length > 40 || longestWordLength > 13) {
    return "text-[2.35rem] sm:text-[4.1rem] lg:text-[4.85rem]";
  }

  if (normalized.length > 34 || longestWordLength > 11) {
    return "text-[2.5rem] sm:text-[4.45rem] lg:text-[5.3rem]";
  }

  return "text-[2.65rem] sm:text-[4.8rem] lg:text-[5.8rem]";
}

type HeroTransitionState = {
  activeIndex: number;
  previousIndex: number | null;
  transitionKey: number;
};

type HeroTransitionAction =
  | {
      type: "shift";
      step: number;
      bannerCount: number;
    }
  | {
      type: "clearPrevious";
      transitionKey: number;
    };

function normalizeLoopIndex(value: number, count: number) {
  if (count <= 0) {
    return 0;
  }

  return ((value % count) + count) % count;
}

function heroTransitionReducer(
  state: HeroTransitionState,
  action: HeroTransitionAction
): HeroTransitionState {
  switch (action.type) {
    case "shift": {
      const count = Math.max(action.bannerCount, 1);

      if (count <= 1) {
        return {
          activeIndex: 0,
          previousIndex: null,
          transitionKey: state.transitionKey,
        };
      }

      const nextIndex = normalizeLoopIndex(state.activeIndex + action.step, count);

      if (nextIndex === state.activeIndex) {
        return state;
      }

      return {
        activeIndex: nextIndex,
        previousIndex: normalizeLoopIndex(state.activeIndex, count),
        transitionKey: state.transitionKey + 1,
      };
    }
    case "clearPrevious":
      if (action.transitionKey !== state.transitionKey || state.previousIndex === null) {
        return state;
      }

      return {
        ...state,
        previousIndex: null,
      };
    default:
      return state;
  }
}

function isVideoMedia(mediaUrl = "", mediaType?: "image" | "video") {
  return (
    mediaType === "video" ||
    /^data:video\//i.test(mediaUrl) ||
    /\.(mp4|webm|ogg)(\?|#|$)/i.test(mediaUrl)
  );
}

function SmoothBannerMedia({
  currentSrc,
  currentAlt,
  currentType = "image",
  currentPoster = "",
  previousSrc,
  previousAlt,
  previousType = "image",
  previousPoster = "",
  transitionKey,
  overlayOpacityClass = "",
}: {
  currentSrc: string;
  currentAlt: string;
  currentType?: "image" | "video";
  currentPoster?: string;
  previousSrc?: string | null;
  previousAlt?: string;
  previousType?: "image" | "video";
  previousPoster?: string;
  transitionKey: number;
  overlayOpacityClass?: string;
}) {
  if (!currentSrc && !previousSrc) {
    return null;
  }

  return (
    <>
      {previousSrc ? (
        <div
          key={`previous-${transitionKey}-${previousSrc}`}
          className="absolute inset-0 hero-banner-motion-out"
        >
          {isVideoMedia(previousSrc, previousType) ? (
            <video
              src={previousSrc}
              poster={previousPoster || undefined}
              autoPlay
              muted
              loop
              playsInline
              className={`h-full w-full object-cover object-center ${overlayOpacityClass || ""}`}
              aria-label={previousAlt || currentAlt}
            />
          ) : (
            <Image
              src={previousSrc}
              alt={previousAlt || currentAlt}
              fill
              sizes="100vw"
              unoptimized={shouldBypassImageOptimization(previousSrc)}
              className={`object-cover object-center ${overlayOpacityClass || ""}`}
            />
          )}
        </div>
      ) : null}
      {currentSrc ? (
        <div
          key={`current-${transitionKey}-${currentSrc}`}
          className="absolute inset-0 hero-banner-motion-in"
        >
          {isVideoMedia(currentSrc, currentType) ? (
            <video
              src={currentSrc}
              poster={currentPoster || undefined}
              autoPlay
              muted
              loop
              playsInline
              className={`h-full w-full object-cover object-center ${overlayOpacityClass || ""}`}
              aria-label={currentAlt}
            />
          ) : (
            <Image
              src={currentSrc}
              alt={currentAlt}
              fill
              sizes="100vw"
              loading="eager"
              fetchPriority="high"
              unoptimized={shouldBypassImageOptimization(currentSrc)}
              className={`object-cover object-center ${overlayOpacityClass || ""}`}
            />
          )}
        </div>
      ) : null}
    </>
  );
}

export default function Home() {
  const router = useRouter();
  const { products, loading: productsLoading } = useStorefrontData();
  const { homepageBanner, loading: bannerLoading } = useHomepageBannerData();
  const loading = productsLoading || bannerLoading;
  const newInRailRef = useRef<HTMLDivElement | null>(null);
  const heroSwipeStartRef = useRef<number | null>(null);
  const [heroTransitionState, dispatchHeroTransition] = useReducer(heroTransitionReducer, {
    activeIndex: 0,
    previousIndex: null,
    transitionKey: 0,
  });
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
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
  const heroCtaLabel = homepageBanner.primaryCtaLabel?.trim() || "Go to shop";
  const heroCtaHref = homepageBanner.primaryCtaHref || "/shop";

  const newInProducts = useMemo(() => {
    return getNewInProducts(products, { limit: 8 });
  }, [products]);
  const newInDisplayItems: Array<Product | null> = loading
    ? [null, null, null, null]
    : newInProducts;

  const collectionProducts = useMemo(() => {
    const featured = products.filter((product) => product.featured);
    const selectedProducts = featured.length > 0 ? featured : sortProductsByStorefrontPriority(products);

    return selectedProducts.slice(0, 6);
  }, [products]);
  const collectionDisplayItems: Array<Product | null> = loading
    ? [null, null, null, null]
    : collectionProducts;

  const publishedHeroBanners = useMemo(() => {
    const fallbackImage =
      homepageBanner.mediaUrl || homepageBanner.imageUrl || "/uploads/banners/banner1.png";
    const publishedBanners = (homepageBanner.banners || [])
      .filter((banner) => banner.mediaUrl || banner.desktopImage || banner.mobileImage)
      .map((banner) => ({
        ...banner,
        title: banner.title?.trim() || homepageBanner.title,
        subtitle: banner.subtitle?.trim() || homepageBanner.description,
        ctaText: banner.ctaText?.trim() || homepageBanner.primaryCtaLabel || "Go to shop",
        ctaLink: banner.ctaLink?.trim() || homepageBanner.primaryCtaHref || "/shop",
        mediaUrl: banner.mediaUrl || banner.desktopImage || banner.mobileImage || fallbackImage,
        mediaType:
          banner.mediaType === "video" ||
          isVideoMedia(banner.mediaUrl || banner.desktopImage || banner.mobileImage)
            ? "video"
            : "image",
        posterImage: banner.posterImage || "",
        desktopImage: banner.mediaUrl || banner.desktopImage || banner.mobileImage || fallbackImage,
        mobileImage: banner.mediaUrl || banner.mobileImage || banner.desktopImage || fallbackImage,
      }));

    if (publishedBanners.length > 0) {
      return publishedBanners;
    }

    return [
      {
        id: "homepage-fallback-banner",
        label: "",
        title: homepageBanner.title,
        subtitle: homepageBanner.description,
        ctaText: homepageBanner.primaryCtaLabel || "Go to shop",
        ctaLink: homepageBanner.primaryCtaHref || "/shop",
        mediaType:
          homepageBanner.mediaType === "video" || isVideoMedia(fallbackImage)
            ? "video"
            : "image",
        mediaUrl: fallbackImage,
        posterImage: homepageBanner.posterImage || "",
        desktopImage: fallbackImage,
        mobileImage: fallbackImage,
        enabled: true,
        scheduleStart: null,
        scheduleEnd: null,
      },
    ];
  }, [
    homepageBanner.banners,
    homepageBanner.description,
    homepageBanner.imageUrl,
    homepageBanner.mediaType,
    homepageBanner.mediaUrl,
    homepageBanner.posterImage,
    homepageBanner.primaryCtaHref,
    homepageBanner.primaryCtaLabel,
    homepageBanner.title,
  ]);

  const homepageReviews = useMemo<HomepageReviewSlide[]>(() => {
    return products
      .filter((product) => product.status !== "Hidden" && product.status !== "Draft")
      .flatMap((product) =>
        (product.reviews || []).map((review, index) => ({
          id: review.id || `${product.id}-review-${index}`,
          reviewerName: review.reviewerName?.trim() || "Hrushe customer",
          quote: review.quote?.trim() || "Quiet essentials that stay easy to wear.",
          rating: Math.min(5, Math.max(1, Number(review.rating) || 5)),
          photo: review.photo || product.images[0] || "",
          createdAt: review.createdAt,
          productId: product.id,
          productName: product.name,
          productHref: `/product/${product.slug || product.id}`,
          fallbackImage: product.images[0] || "",
          accent: product.accent || "#ece7df",
          hasCustomerPhoto: Boolean(review.photo),
        }))
      )
      .sort((left, right) => {
        const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
        const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;

        return rightTime - leftTime;
      });
  }, [products]);

  const reviewedProductCount = useMemo(
    () => new Set(homepageReviews.map((review) => review.productId)).size,
    [homepageReviews]
  );

  const heroBannerCount = Math.max(publishedHeroBanners.length, 1);
  const activeBannerIndex = normalizeLoopIndex(
    heroTransitionState.activeIndex,
    heroBannerCount
  );
  const previousBannerIndex =
    heroTransitionState.previousIndex === null
      ? null
      : normalizeLoopIndex(heroTransitionState.previousIndex, heroBannerCount);
  const activeHeroBanner =
    publishedHeroBanners[activeBannerIndex % heroBannerCount] || publishedHeroBanners[0];
  const secondaryHeroBanner =
    publishedHeroBanners[(activeBannerIndex + 1) % heroBannerCount] || activeHeroBanner;
  const tertiaryHeroBanner =
    publishedHeroBanners[(activeBannerIndex + 2) % heroBannerCount] || secondaryHeroBanner;
  const previousHeroBanner =
    previousBannerIndex === null
      ? null
      : publishedHeroBanners[previousBannerIndex % heroBannerCount] || publishedHeroBanners[0];
  const previousSecondaryHeroBanner =
    previousBannerIndex === null
      ? null
      : publishedHeroBanners[(previousBannerIndex + 1) % heroBannerCount] || previousHeroBanner;
  const previousTertiaryHeroBanner =
    previousBannerIndex === null
      ? null
      : publishedHeroBanners[(previousBannerIndex + 2) % heroBannerCount] ||
        previousSecondaryHeroBanner;
  const activeHeroDesktopImage = activeHeroBanner?.desktopImage || "";
  const activeHeroMediaType: "image" | "video" =
    activeHeroBanner?.mediaType === "video" ? "video" : "image";
  const activeHeroPoster = activeHeroBanner?.posterImage || "";
  const secondaryHeroDesktopImage = secondaryHeroBanner?.desktopImage || activeHeroDesktopImage;
  const secondaryHeroMediaType: "image" | "video" =
    secondaryHeroBanner?.mediaType === "video" ? "video" : "image";
  const secondaryHeroPoster = secondaryHeroBanner?.posterImage || "";
  const tertiaryHeroDesktopImage = tertiaryHeroBanner?.desktopImage || secondaryHeroDesktopImage;
  const tertiaryHeroMediaType: "image" | "video" =
    tertiaryHeroBanner?.mediaType === "video" ? "video" : "image";
  const tertiaryHeroPoster = tertiaryHeroBanner?.posterImage || "";
  const previousHeroDesktopImage = previousHeroBanner?.desktopImage || null;
  const previousHeroMediaType: "image" | "video" =
    previousHeroBanner?.mediaType === "video" ? "video" : "image";
  const previousHeroPoster = previousHeroBanner?.posterImage || "";
  const previousSecondaryHeroDesktopImage =
    previousSecondaryHeroBanner?.desktopImage || previousHeroDesktopImage;
  const previousSecondaryHeroMediaType: "image" | "video" =
    previousSecondaryHeroBanner?.mediaType === "video" ? "video" : "image";
  const previousSecondaryHeroPoster = previousSecondaryHeroBanner?.posterImage || "";
  const previousTertiaryHeroDesktopImage =
    previousTertiaryHeroBanner?.desktopImage || previousSecondaryHeroDesktopImage;
  const previousTertiaryHeroMediaType: "image" | "video" =
    previousTertiaryHeroBanner?.mediaType === "video" ? "video" : "image";
  const previousTertiaryHeroPoster = previousTertiaryHeroBanner?.posterImage || "";
  const activeHeroMobileImage = activeHeroBanner?.mobileImage || activeHeroDesktopImage;
  const secondaryHeroMobileImage = secondaryHeroBanner?.mobileImage || secondaryHeroDesktopImage;
  const tertiaryHeroMobileImage = tertiaryHeroBanner?.mobileImage || tertiaryHeroDesktopImage;
  const previousHeroMobileImage = previousHeroBanner?.mobileImage || previousHeroDesktopImage;
  const previousSecondaryHeroMobileImage =
    previousSecondaryHeroBanner?.mobileImage || previousSecondaryHeroDesktopImage;
  const previousTertiaryHeroMobileImage =
    previousTertiaryHeroBanner?.mobileImage || previousTertiaryHeroDesktopImage;
  const activeHeroTitle = activeHeroBanner?.title?.trim() || homepageBanner.title;
  const activeHeroDescription = activeHeroBanner?.subtitle?.trim() || homepageBanner.description;
  const activeHeroCtaLabel = activeHeroBanner?.ctaText?.trim() || heroCtaLabel;
  const activeHeroCtaHref = activeHeroBanner?.ctaLink?.trim() || heroCtaHref;
  const heroTitleSizeClasses = useMemo(
    () => getHeroTitleSizeClasses(activeHeroTitle),
    [activeHeroTitle]
  );

  useEffect(() => {
    if (publishedHeroBanners.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      dispatchHeroTransition({
        type: "shift",
        step: 1,
        bannerCount: publishedHeroBanners.length,
      });
    }, 6000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [publishedHeroBanners.length]);

  const handleHeroSwipeStart = (event: React.PointerEvent<HTMLElement>) => {
    heroSwipeStartRef.current = event.clientX;
  };

  const handleHeroSwipeEnd = (event: React.PointerEvent<HTMLElement>) => {
    const startX = heroSwipeStartRef.current;
    heroSwipeStartRef.current = null;

    if (startX === null || publishedHeroBanners.length <= 1) {
      return;
    }

    const distance = event.clientX - startX;

    if (Math.abs(distance) < 45) {
      return;
    }

    dispatchHeroTransition({
      type: "shift",
      step: distance < 0 ? 1 : -1,
      bannerCount: publishedHeroBanners.length,
    });
  };

  useEffect(() => {
    if (heroTransitionState.previousIndex === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      dispatchHeroTransition({
        type: "clearPrevious",
        transitionKey: heroTransitionState.transitionKey,
      });
    }, 820);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [heroTransitionState.previousIndex, heroTransitionState.transitionKey]);

  useEffect(() => {
    if (homepageReviews.length === 0) {
      setActiveReviewIndex(0);
      return;
    }

    setActiveReviewIndex((current) => current % homepageReviews.length);
  }, [homepageReviews.length]);

  useEffect(() => {
    if (homepageReviews.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveReviewIndex((current) => (current + 1) % homepageReviews.length);
    }, 5200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [homepageReviews.length]);

  useEffect(() => {
    if (loading || newInProducts.length <= 1) {
      return;
    }

    const rail = newInRailRef.current;

    if (!rail) {
      return;
    }

    const mobileQuery = window.matchMedia("(max-width: 767px)");

    if (!mobileQuery.matches) {
      rail.scrollTo({ left: 0, behavior: "auto" });
      return;
    }

    let activeIndex = 0;

    const getStep = () => {
      const card = rail.firstElementChild as HTMLElement | null;

      if (!card) {
        return 0;
      }

      const computedStyle = window.getComputedStyle(rail);
      const gap = Number.parseFloat(computedStyle.columnGap || computedStyle.gap || "0");
      return card.offsetWidth + gap;
    };

    const syncFromScroll = () => {
      const step = getStep();

      if (!step) {
        return;
      }

      activeIndex = Math.max(
        0,
        Math.min(newInProducts.length - 1, Math.round(rail.scrollLeft / step))
      );
    };

    const intervalId = window.setInterval(() => {
      if (!mobileQuery.matches) {
        return;
      }

      const step = getStep();

      if (!step) {
        return;
      }

      activeIndex = (activeIndex + 1) % newInProducts.length;
      rail.scrollTo({
        left: step * activeIndex,
        behavior: "smooth",
      });
    }, 3200);

    const handleScroll = () => {
      syncFromScroll();
    };

    const handleQueryChange = (event: MediaQueryListEvent) => {
      if (!event.matches) {
        activeIndex = 0;
        rail.scrollTo({ left: 0, behavior: "auto" });
      }
    };

    rail.addEventListener("scroll", handleScroll, { passive: true });
    mobileQuery.addEventListener("change", handleQueryChange);

    return () => {
      window.clearInterval(intervalId);
      rail.removeEventListener("scroll", handleScroll);
      mobileQuery.removeEventListener("change", handleQueryChange);
    };
  }, [loading, newInProducts]);

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

    if (!emailPattern.test(email)) {
      setNewsletterFeedback({ type: "error", message: "Enter a valid email address." });
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
          <div className="grid gap-7 sm:gap-10 lg:grid-cols-[minmax(0,0.34fr)_minmax(0,0.66fr)] lg:gap-14 xl:gap-20">
            <div className="order-2 min-w-0 flex flex-col gap-5 lg:order-1 lg:gap-6 lg:pt-1">
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

              <div className="reveal-up min-w-0 max-w-[36rem] lg:max-w-[34rem]">
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
                    <h1
                      className={`mt-4 max-w-[11ch] font-semibold uppercase leading-[0.88] tracking-[0] text-[var(--foreground)] sm:mt-5 ${heroTitleSizeClasses}`}
                    >
                      {activeHeroTitle}
                    </h1>
                    <p className="mt-3 max-w-[19rem] text-[1rem] font-medium tracking-[0] text-[var(--foreground)] sm:mt-4 sm:text-[1.35rem]">
                      Premium streetwear, pared back for repeat wear.
                    </p>
                    <p className="mt-3 text-[0.8rem] uppercase tracking-[0.18em] text-[var(--muted)] sm:mt-4 sm:text-[0.85rem]">
                      {seasonLabel}
                      <br />
                      {seasonYear}
                    </p>
                    <p className="mt-4 max-w-[24rem] text-[0.94rem] leading-7 text-[var(--muted)] sm:mt-5 sm:text-[0.98rem] sm:leading-8">
                      {activeHeroDescription}
                    </p>

                    <div className="mt-5 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:flex-wrap sm:items-center">
                      <Link
                        href={activeHeroCtaHref}
                        className="button-primary inline-flex min-h-12 w-full items-center justify-between gap-10 px-5 text-[0.72rem] font-medium uppercase tracking-[0.16em] transition sm:w-auto"
                      >
                        <span>{activeHeroCtaLabel}</span>
                        <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </>
                )}
                <div className="mt-5 pb-1">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {quickLinks.map((link) => (
                      <Link
                        key={link.label}
                        href={link.href}
                        className="group flex min-h-11 items-center justify-between border border-[var(--border)] bg-[var(--surface-elevated)] px-3 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-[var(--foreground)] transition hover:border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)]"
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

            <div className="order-1 min-w-0 reveal-up-delayed lg:order-2">
              <div className="space-y-3 sm:space-y-4 lg:hidden">
                <div
                  className="relative aspect-[4/5] overflow-hidden border border-[var(--border)] bg-[var(--surface-strong)]"
                  onPointerDown={handleHeroSwipeStart}
                  onPointerUp={handleHeroSwipeEnd}
                  onPointerCancel={() => {
                    heroSwipeStartRef.current = null;
                  }}
                  style={{ touchAction: "pan-y" }}
                >
                  {loading ? (
                    <div className="h-full w-full animate-pulse bg-[rgba(17,17,17,0.06)]" />
                  ) : activeHeroMobileImage ? (
                    <SmoothBannerMedia
                      currentSrc={activeHeroMobileImage}
                      currentAlt={activeHeroTitle}
                      currentType={activeHeroMediaType}
                      currentPoster={activeHeroPoster}
                      previousSrc={previousHeroMobileImage}
                      previousAlt={previousHeroBanner?.title || activeHeroTitle}
                      previousType={previousHeroMediaType}
                      previousPoster={previousHeroPoster}
                      transitionKey={heroTransitionState.transitionKey}
                    />
                  ) : null}
                  {loading ? null : (
                    <>
                      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
                        <span className="border border-white/35 bg-black/18 px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                          Featured
                        </span>
                        <span className="border border-white/35 bg-white/12 px-2.5 py-1 text-[0.62rem] font-medium uppercase tracking-[0.16em] text-white backdrop-blur-sm">
                          {activeBannerIndex + 1}/{Math.max(publishedHeroBanners.length, 1)}
                        </span>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.66))] p-3 pt-8">
                        <div>
                          <p className="text-[0.65rem] uppercase tracking-[0.18em] text-white/72">
                            {seasonLabel} {seasonYear}
                          </p>
                          <p className="mt-1 text-[0.92rem] font-medium tracking-[0] text-white">
                            Premium essentials.
                          </p>
                        </div>
                        {publishedHeroBanners.length > 1 ? (
                          <span className="text-[0.62rem] uppercase tracking-[0.16em] text-white/72">
                            Swipe to explore
                          </span>
                        ) : null}
                      </div>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-3">
                  <div className="relative aspect-[4/4.6] overflow-hidden border border-[var(--border)] bg-[var(--surface-strong)]">
                    {loading ? (
                      <div className="h-full w-full animate-pulse bg-[rgba(17,17,17,0.06)]" />
                    ) : secondaryHeroMobileImage ? (
                      <SmoothBannerMedia
                        currentSrc={secondaryHeroMobileImage}
                        currentAlt={secondaryHeroBanner?.title || "Hrushe featured campaign"}
                        currentType={secondaryHeroMediaType}
                        currentPoster={secondaryHeroPoster}
                        previousSrc={previousSecondaryHeroMobileImage}
                        previousAlt={
                          previousSecondaryHeroBanner?.title || "Hrushe featured campaign"
                        }
                        previousType={previousSecondaryHeroMediaType}
                        previousPoster={previousSecondaryHeroPoster}
                        transitionKey={heroTransitionState.transitionKey}
                      />
                    ) : null}
                  </div>

                  <Link
                    href={tertiaryHeroBanner?.ctaLink?.trim() || activeHeroCtaHref}
                    className="relative flex aspect-[4/4.6] flex-col justify-between overflow-hidden border border-[var(--border)] bg-[var(--surface)] p-4"
                  >
                    {loading ? (
                      <div className="h-full w-full animate-pulse bg-[rgba(17,17,17,0.06)]" />
                    ) : tertiaryHeroMobileImage ? (
                      <SmoothBannerMedia
                        currentSrc={tertiaryHeroMobileImage}
                        currentAlt={tertiaryHeroBanner?.title || "Hrushe campaign"}
                        currentType={tertiaryHeroMediaType}
                        currentPoster={tertiaryHeroPoster}
                        previousSrc={previousTertiaryHeroMobileImage}
                        previousAlt={previousTertiaryHeroBanner?.title || "Hrushe campaign"}
                        previousType={previousTertiaryHeroMediaType}
                        previousPoster={previousTertiaryHeroPoster}
                        transitionKey={heroTransitionState.transitionKey}
                        overlayOpacityClass="opacity-20"
                      />
                    ) : null}
                    {loading ? null : (
                      <>
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.56),rgba(255,255,255,0.94))]" />
                        <div className="relative z-10">
                          <p className="eyebrow text-[var(--accent)]">
                            {tertiaryHeroBanner?.ctaText?.trim() || "Campaign"}
                          </p>
                          <p className="mt-2.5 max-w-[10ch] text-[1.15rem] font-semibold uppercase leading-[0.95] tracking-[-0.06em] text-[var(--foreground)]">
                            {tertiaryHeroBanner?.title?.trim() || "The latest everyday edit."}
                          </p>
                        </div>
                        <div className="relative z-10 flex items-center justify-between border-t border-[var(--border)] pt-3 text-[0.64rem] uppercase tracking-[0.16em] text-[var(--muted)]">
                          <span>{tertiaryHeroBanner?.label?.trim() || "Homepage story"}</span>
                          <span className="text-[var(--foreground)]">
                            {tertiaryHeroBanner?.ctaText?.trim() || "View"}
                          </span>
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
                  ) : activeHeroDesktopImage ? (
                    <SmoothBannerMedia
                      currentSrc={activeHeroDesktopImage}
                      currentAlt={activeHeroTitle}
                      currentType={activeHeroMediaType}
                      currentPoster={activeHeroPoster}
                      previousSrc={previousHeroDesktopImage}
                      previousAlt={previousHeroBanner?.title || activeHeroTitle}
                      previousType={previousHeroMediaType}
                      previousPoster={previousHeroPoster}
                      transitionKey={heroTransitionState.transitionKey}
                    />
                  ) : null}
                </div>

                <div className="grid gap-4">
                  <div className="relative aspect-[4/5.15] overflow-hidden border border-[var(--border)] bg-[var(--surface-strong)]">
                    {loading ? (
                      <div className="h-full w-full animate-pulse bg-[rgba(17,17,17,0.06)]" />
                    ) : secondaryHeroDesktopImage ? (
                      <SmoothBannerMedia
                        currentSrc={secondaryHeroDesktopImage}
                        currentAlt={secondaryHeroBanner?.title || "Hrushe featured campaign"}
                        currentType={secondaryHeroMediaType}
                        currentPoster={secondaryHeroPoster}
                        previousSrc={previousSecondaryHeroDesktopImage}
                        previousAlt={
                          previousSecondaryHeroBanner?.title || "Hrushe featured campaign"
                        }
                        previousType={previousSecondaryHeroMediaType}
                        previousPoster={previousSecondaryHeroPoster}
                        transitionKey={heroTransitionState.transitionKey}
                      />
                    ) : null}
                  </div>

                  <Link
                    href={tertiaryHeroBanner?.ctaLink?.trim() || activeHeroCtaHref}
                    className="relative flex aspect-[4/3.4] flex-col justify-between overflow-hidden border border-[var(--border)] bg-[var(--surface)] p-5"
                  >
                    {loading ? (
                      <div className="h-full w-full animate-pulse bg-[rgba(17,17,17,0.06)]" />
                    ) : tertiaryHeroDesktopImage ? (
                      <SmoothBannerMedia
                        currentSrc={tertiaryHeroDesktopImage}
                        currentAlt={tertiaryHeroBanner?.title || "Hrushe campaign"}
                        currentType={tertiaryHeroMediaType}
                        currentPoster={tertiaryHeroPoster}
                        previousSrc={previousTertiaryHeroDesktopImage}
                        previousAlt={previousTertiaryHeroBanner?.title || "Hrushe campaign"}
                        previousType={previousTertiaryHeroMediaType}
                        previousPoster={previousTertiaryHeroPoster}
                        transitionKey={heroTransitionState.transitionKey}
                        overlayOpacityClass="opacity-18"
                      />
                    ) : null}
                    {loading ? null : (
                      <>
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.4),rgba(255,255,255,0.92))]" />
                        <div className="relative z-10">
                          <p className="eyebrow text-[var(--accent)]">
                            {tertiaryHeroBanner?.ctaText?.trim() || "Campaign"}
                          </p>
                          <p className="mt-3 max-w-[11ch] text-[1.55rem] font-semibold uppercase leading-[0.94] tracking-[-0.06em] text-[var(--foreground)]">
                            {tertiaryHeroBanner?.title?.trim() || "The latest everyday edit."}
                          </p>
                        </div>
                        <div className="relative z-10 flex items-center justify-between border-t border-[var(--border)] pt-4 text-[0.72rem] uppercase tracking-[0.16em] text-[var(--muted)]">
                          <span>{tertiaryHeroBanner?.label?.trim() || "Homepage story"}</span>
                          <span className="text-[var(--foreground)] hover:text-[var(--accent)]">
                            {tertiaryHeroBanner?.ctaText?.trim() || "View story"}
                          </span>
                        </div>
                      </>
                    )}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 pb-10 pt-10 sm:px-6 sm:pb-12 sm:pt-12 lg:px-8 lg:pb-14 lg:pt-14">
          <div className="border-t border-[var(--border)] pt-10 sm:pt-12">
            <div className="mb-9 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="eyebrow text-[var(--accent)]">New In</p>
                <h2 className="mt-5 max-w-[14ch] text-[2.8rem] font-semibold uppercase leading-[0.9] tracking-[-0.08em] text-[var(--foreground)] sm:text-[4rem]">
                  A tighter edit of easy, premium basics.
                </h2>
              </div>
              <Link
                href="/new-in"
                className="button-secondary inline-flex min-h-11 items-center px-5 text-[0.72rem] font-medium uppercase tracking-[0.16em] transition"
              >
                Explore all products
              </Link>
            </div>

            {newInDisplayItems.length > 0 ? (
              <div
                ref={newInRailRef}
                className="product-row-scroll mt-1 flex gap-4 overflow-x-auto pb-3 pr-4 pt-1 md:gap-5 md:pb-4 md:pr-6 lg:pr-8"
              >
                {newInDisplayItems.map((product, index) =>
                  !product ? (
                    <div
                      key={`new-in-skeleton-${index}`}
                      className="min-w-full flex-[0_0_100%] animate-pulse md:min-w-[360px] md:flex-[0_0_360px] lg:min-w-[440px] lg:flex-[0_0_440px] xl:min-w-[480px] xl:flex-[0_0_480px]"
                    >
                      <div className="aspect-[18/25] bg-[var(--surface-strong)]" />
                      <div className="mt-3 h-4 w-3/4 bg-[var(--surface-strong)]" />
                      <div className="mt-2 h-3 w-28 bg-[var(--surface-strong)]" />
                    </div>
                  ) : (
                    <div
                      key={`new-in-${product.id}`}
                      className="min-w-full flex-[0_0_100%] md:min-w-[360px] md:flex-[0_0_360px] lg:min-w-[440px] lg:flex-[0_0_440px] xl:min-w-[480px] xl:flex-[0_0_480px]"
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

        <section className="mx-auto max-w-[1600px] px-4 pb-6 pt-8 sm:px-6 sm:pb-8 sm:pt-10 lg:px-8 lg:pb-8 lg:pt-12">
          <div className="border-t border-[var(--border)] pt-10 sm:pt-12">
            <div className="grid gap-8 lg:grid-cols-[0.42fr_0.58fr] lg:items-center lg:gap-10 xl:gap-14">
              <div className="max-w-[36rem]">
                <p className="eyebrow text-[var(--accent)]">Featured</p>
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
                  {featuredCollectionLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="inline-flex min-h-11 items-center border border-[var(--border)] bg-[var(--surface-elevated)] px-5 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-[var(--foreground)] transition hover:border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)]"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="product-row-scroll flex gap-4 overflow-x-auto pb-3 pr-4 sm:pb-4 sm:pr-6 lg:gap-5 lg:pr-2">
                {collectionDisplayItems.length > 0 ? (
                  collectionDisplayItems.map((product, index) =>
                    !product ? (
                      <div
                        key={`collection-skeleton-${index}`}
                        className="min-w-[78vw] flex-[0_0_78vw] animate-pulse sm:min-w-[330px] sm:flex-[0_0_330px] lg:min-w-[360px] lg:flex-[0_0_360px]"
                      >
                        <div className="aspect-[18/25] border border-[var(--border)] bg-[var(--surface-strong)]" />
                        <div className="mt-3 h-4 w-3/4 bg-[var(--surface-strong)]" />
                        <div className="mt-2 h-3 w-28 bg-[var(--surface-strong)]" />
                      </div>
                    ) : (
                      <div
                        key={`collection-${product.id}`}
                        className="min-w-[78vw] flex-[0_0_78vw] sm:min-w-[330px] sm:flex-[0_0_330px] lg:min-w-[360px] lg:flex-[0_0_360px]"
                      >
                        <ProductCard product={product} />
                      </div>
                    )
                  )
                ) : (
                  <div className="min-w-[78vw] flex-[0_0_78vw] border border-[var(--border)] px-5 py-8 text-sm leading-6 text-[var(--muted)] sm:min-w-[330px] sm:flex-[0_0_330px] lg:min-w-[360px] lg:flex-[0_0_360px]">
                    Featured products will appear here once products are marked as Featured from admin.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 pb-12 pt-8 sm:px-6 sm:pb-14 sm:pt-10 lg:px-8 lg:pb-16 lg:pt-10">
          <div className="border-t border-[var(--border)] pt-10 sm:pt-12">
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

        <section className="mx-auto max-w-[1600px] px-4 pb-12 pt-2 sm:px-6 sm:pb-14 lg:px-8 lg:pb-16">
          <div className="border-t border-[var(--border)] pt-10 sm:pt-12">
            <div className="grid gap-8 lg:grid-cols-[0.34fr_0.66fr] lg:items-start lg:gap-10 xl:gap-14">
              <div className="max-w-[34rem]">
                <p className="eyebrow text-[var(--accent)]">Customer notes</p>
                <h2 className="mt-5 max-w-[12ch] text-[2.7rem] font-semibold leading-[0.92] tracking-[-0.08em] text-[var(--foreground)] sm:text-[3.9rem]">
                  Real reviews from across the current product edit.
                </h2>
                <p className="mt-6 max-w-[30rem] text-[0.98rem] leading-8 text-[var(--muted)]">
                  Every approved review can surface here automatically, including customer-uploaded
                  photos when they share how the piece fits into everyday wear.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <div className="border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
                    <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[var(--muted)]">
                      Reviews live
                    </p>
                    <p className="mt-3 text-[2rem] font-semibold leading-none tracking-[-0.06em] text-[var(--foreground)]">
                      {loading ? "..." : homepageReviews.length.toString().padStart(2, "0")}
                    </p>
                  </div>
                  <div className="border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
                    <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[var(--muted)]">
                      Reviewed styles
                    </p>
                    <p className="mt-3 text-[2rem] font-semibold leading-none tracking-[-0.06em] text-[var(--foreground)]">
                      {loading ? "..." : reviewedProductCount.toString().padStart(2, "0")}
                    </p>
                  </div>
                </div>

                {homepageReviews.length > 1 ? (
                  <div className="mt-8 max-w-[22rem]">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveReviewIndex((current) =>
                            current === 0 ? homepageReviews.length - 1 : current - 1
                          )
                        }
                        className="inline-flex h-11 w-11 items-center justify-center border border-[var(--border)] text-[var(--foreground)] transition hover:border-[var(--foreground)]"
                        aria-label="Previous review"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveReviewIndex((current) => (current + 1) % homepageReviews.length)
                        }
                        className="inline-flex h-11 w-11 items-center justify-center border border-[var(--border)] text-[var(--foreground)] transition hover:border-[var(--foreground)]"
                        aria-label="Next review"
                      >
                        ›
                      </button>
                      <p className="ml-1 text-[0.74rem] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
                        {String(activeReviewIndex + 1).padStart(2, "0")} /{" "}
                        {String(homepageReviews.length).padStart(2, "0")}
                      </p>
                    </div>
                    <div className="mt-4 h-px w-full bg-[var(--border)]">
                      <div
                        className="h-full bg-[var(--foreground)] transition-all duration-700 ease-out"
                        style={{
                          width: `${((activeReviewIndex + 1) / homepageReviews.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="overflow-hidden border border-[var(--border)] bg-[var(--surface)]">
                {loading ? (
                  <div className="grid animate-pulse lg:grid-cols-[0.47fr_0.53fr]">
                    <div className="min-h-[320px] bg-[rgba(17,17,17,0.06)] sm:min-h-[420px] lg:min-h-[520px]" />
                    <div className="space-y-5 p-6 sm:p-8 lg:p-10">
                      <div className="h-3 w-32 bg-[rgba(17,17,17,0.08)]" />
                      <div className="h-12 w-full max-w-[24rem] bg-[rgba(17,17,17,0.08)]" />
                      <div className="h-12 w-[86%] max-w-[22rem] bg-[rgba(17,17,17,0.08)]" />
                      <div className="h-4 w-24 bg-[rgba(17,17,17,0.06)]" />
                      <div className="pt-10">
                        <div className="h-px w-full bg-[rgba(17,17,17,0.08)]" />
                        <div className="mt-5 h-4 w-40 bg-[rgba(17,17,17,0.08)]" />
                        <div className="mt-3 h-4 w-56 bg-[rgba(17,17,17,0.06)]" />
                      </div>
                    </div>
                  </div>
                ) : homepageReviews.length > 0 ? (
                  <div
                    className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{ transform: `translateX(-${activeReviewIndex * 100}%)` }}
                  >
                    {homepageReviews.map((review) => {
                      const reviewImage = review.photo || review.fallbackImage;

                      return (
                        <article key={review.id} className="min-w-full">
                          <div className="grid lg:grid-cols-[0.47fr_0.53fr]">
                            <div
                              className="relative min-h-[320px] overflow-hidden bg-[var(--surface-strong)] sm:min-h-[420px] lg:min-h-[520px]"
                              style={{ backgroundColor: review.accent }}
                            >
                              {reviewImage ? (
                                <Image
                                  src={reviewImage}
                                  alt={`${review.reviewerName} review for ${review.productName}`}
                                  fill
                                  sizes="(max-width: 1024px) 100vw, 47vw"
                                  unoptimized={shouldBypassImageOptimization(reviewImage)}
                                  className="object-cover object-center"
                                />
                              ) : (
                                <div className="flex h-full items-end p-6 sm:p-8">
                                  <p className="max-w-[10ch] text-[2.3rem] font-semibold uppercase leading-[0.92] tracking-[-0.07em] text-[var(--foreground)] sm:text-[3rem]">
                                    {review.productName}
                                  </p>
                                </div>
                              )}

                              <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 sm:p-5">
                                <span className="border border-white/35 bg-black/18 px-2.5 py-1 text-[0.58rem] font-medium uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                                  {review.hasCustomerPhoto ? "Customer photo" : "From the product edit"}
                                </span>
                                <span className="border border-white/30 bg-white/12 px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-[0.16em] text-white backdrop-blur-sm">
                                  {formatReviewDate(review.createdAt)}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10">
                              <div>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <p className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--muted)]">
                                    {review.productName}
                                  </p>
                                  <p className="text-[0.9rem] tracking-[0.18em] text-[var(--foreground)]">
                                    {"★".repeat(review.rating)}
                                  </p>
                                </div>
                                <p className="mt-6 max-w-[26rem] text-[1.45rem] leading-[1.26] tracking-[-0.045em] text-[var(--foreground)] sm:text-[1.75rem] lg:text-[2rem]">
                                  &ldquo;{review.quote}&rdquo;
                                </p>
                              </div>

                              <div className="mt-10 border-t border-[var(--border)] pt-5">
                                <p className="text-[0.74rem] font-medium uppercase tracking-[0.16em] text-[var(--foreground)]">
                                  {review.reviewerName}
                                </p>
                                <p className="mt-3 max-w-[30rem] text-[0.95rem] leading-7 text-[var(--muted)]">
                                  Shared after ordering {review.productName}. This feed rotates
                                  automatically and picks up customer quotes across the public catalog.
                                </p>
                                <Link
                                  href={review.productHref}
                                  className="mt-6 inline-flex min-h-11 items-center justify-between gap-8 border border-[var(--border)] px-5 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-[var(--foreground)] transition hover:border-[var(--foreground)]"
                                >
                                  <span>View product</span>
                                  <span aria-hidden="true">→</span>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid gap-6 px-6 py-10 sm:px-8 sm:py-12 lg:grid-cols-[0.45fr_0.55fr] lg:px-10">
                    <div className="border border-[var(--border)] bg-[var(--surface-strong)] p-6">
                      <p className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--muted)]">
                        Review feed
                      </p>
                      <p className="mt-4 max-w-[10ch] text-[2rem] font-semibold leading-[0.94] tracking-[-0.07em] text-[var(--foreground)]">
                        Customer styling proof will land here.
                      </p>
                    </div>
                    <div className="flex items-center">
                      <p className="max-w-[30rem] text-[0.98rem] leading-8 text-[var(--muted)]">
                        Once shoppers leave reviews on active products, this section will start
                        rotating their comments and photos automatically.
                      </p>
                    </div>
                  </div>
                )}
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
                required
                aria-invalid={newsletterFeedback?.type === "error"}
                aria-describedby={newsletterFeedback ? "newsletter-feedback" : undefined}
              />
              <button
                type="submit"
                disabled={newsletterSubmitting}
                aria-busy={newsletterSubmitting}
                className="inline-flex min-h-14 items-center justify-center border border-[var(--foreground)] bg-[var(--foreground)] px-8 text-[0.8rem] font-medium uppercase tracking-[0.16em] text-[var(--background)] transition hover:border-[var(--accent)] hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {newsletterSubmitting ? "Joining..." : "Join now"}
              </button>
            </form>

            {newsletterFeedback ? (
              <p
                id="newsletter-feedback"
                role="status"
                className={`mx-auto mt-5 max-w-[42rem] text-sm ${
                  newsletterFeedback.type === "success" ? "text-[var(--success)]" : "text-[var(--danger)]"
                }`}
              >
                {newsletterFeedback.message}
              </p>
            ) : null}

            <div className="mx-auto mt-10 grid max-w-[56rem] gap-4 border-t border-[var(--border)] pt-8 text-left lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
              <div>
                <p className="eyebrow text-[var(--accent)]">Collaborate</p>
                <h3 className="mt-4 max-w-[18ch] text-[1.9rem] font-semibold uppercase leading-[0.96] tracking-[-0.06em] text-[var(--foreground)] sm:text-[2.35rem]">
                  Designers, artists, and creative partners can reach out here too.
                </h3>
                <p className="mt-4 max-w-[34rem] text-[0.96rem] leading-8 text-[var(--muted)]">
                  If you want to share your designs, pitch a collaboration, or explore working with
                  HRUSHE, send over your portfolio, moodboard, or concept note and we will review it.
                </p>
              </div>

              <div className="flex flex-col justify-between border border-[var(--border)] bg-[var(--surface)] px-5 py-5 sm:px-6 sm:py-6">
                <div>
                  <p className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--muted)]">
                    Collaboration inbox
                  </p>
                  <p className="mt-4 text-[1.1rem] font-medium tracking-[-0.03em] text-[var(--foreground)]">
                    team@hrushe.in
                  </p>
                  <p className="mt-3 text-[0.92rem] leading-7 text-[var(--muted)]">
                    Include your name, links, design direction, and a short note on how you would
                    like to work together.
                  </p>
                </div>

                <Link
                  href="mailto:team@hrushe.in?subject=HRUSHE%20Collaboration"
                  className="mt-6 inline-flex min-h-12 items-center justify-between gap-8 border border-[var(--foreground)] px-5 text-[0.76rem] font-medium uppercase tracking-[0.16em] text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  <span>Share your work</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
