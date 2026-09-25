"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { HomepageMediaFrame } from "@/components/homepage-media";
import type { Product } from "@/lib/catalog";
import { shouldBypassImageOptimization } from "@/lib/image-source";
import { getProductDisplayName } from "@/lib/product-presentation";

export type FrameHomeCampaign = {
  title: string;
  image: string;
  mobileImage: string;
  imageAlt: string;
  objectPosition: string;
  ctaText: string;
  ctaLink: string;
};

type Slide =
  | { kind: "campaign"; name: string; meta: string; href: string; cta: string }
  | { kind: "product"; product: Product; name: string; meta: string; href: string; cta: string };

function buildSlides(side: string, campaign: FrameHomeCampaign, products: Product[]): Slide[] {
  return [
    {
      kind: "campaign",
      name: campaign.title || "The campaign",
      meta: `${side} · The campaign`,
      href: campaign.ctaLink || `/collection/${side.toLowerCase()}`,
      cta: campaign.ctaText || "Shop the campaign",
    },
    ...products.map((product) => ({
      kind: "product" as const,
      product,
      name: getProductDisplayName(product),
      meta: [product.colour || product.colors[0], `₹${product.price.toLocaleString("en-IN")}`].filter(Boolean).join(" · "),
      href: `/product/${product.slug || product.id}`,
      cta: "View piece",
    })),
  ];
}

function SlideMedia({ slide, campaign, priority, sizes }: { slide: Slide; campaign: FrameHomeCampaign; priority: boolean; sizes: string }) {
  if (slide.kind === "campaign") {
    return (
      <HomepageMediaFrame
        src={campaign.image}
        mobileSrc={campaign.mobileImage}
        alt={campaign.imageAlt || slide.name}
        priority={priority}
        sizes={sizes}
        className="h-full w-full object-cover"
        objectPosition={campaign.objectPosition}
      />
    );
  }

  const src = slide.product.images[0];

  if (!src) {
    return <div className="h-full w-full" style={{ backgroundColor: slide.product.accent || "#eeece8" }} />;
  }

  return (
    <Image
      src={src}
      alt={slide.name}
      fill
      loading="eager"
      fetchPriority={priority ? "high" : "low"}
      unoptimized={shouldBypassImageOptimization(src)}
      sizes={sizes}
    />
  );
}

/**
 * Men / Women home: the campaign sits in the frame; "the edit" is that side's pieces as words.
 * Desktop: hover a name to see it. Phone: tap the frame to step through, like a lookbook.
 */
export function FrameHome({
  side,
  campaign,
  products,
}: {
  side: "Men" | "Women";
  campaign: FrameHomeCampaign;
  products: Product[];
}) {
  const slides = buildSlides(side, campaign, products.slice(0, 8));
  const [active, setActive] = useState(0);
  const current = slides[active] || slides[0];
  const step = (direction: 1 | -1) => setActive((index) => (index + direction + slides.length) % slides.length);
  const frameLayers = (sizes: string) =>
    slides.map((slide, index) => (
      <div key={index} className={`fr-frame__layer ${index === active ? "is-active" : ""}`} aria-hidden={index !== active}>
        <SlideMedia slide={slide} campaign={campaign} priority={index === 0} sizes={sizes} />
      </div>
    ));

  return (
    <>
      <section
        aria-label={`${side} home`}
        className="hidden min-h-[calc(100svh-5.5rem)] items-center gap-x-14 px-10 py-10 lg:grid lg:grid-cols-[minmax(0,1fr)_min(30vw,440px)_minmax(0,1fr)] xl:gap-x-16"
      >
        <div className="flex flex-col items-end gap-6 justify-self-end text-right">
          <span className="fr-mono fr-muted">{side} · The campaign</span>
          <h1 className="fr-word text-[clamp(3rem,6vw,5.5rem)]">{campaign.title || "The campaign"}</h1>
          <button type="button" onMouseEnter={() => setActive(0)} onClick={() => setActive(0)} className="fr-mono fr-choice is-active fr-link min-h-11">
            View campaign
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="fr-frame aspect-[3/4] w-full">{frameLayers("(min-width: 1024px) 30vw, 100vw")}</div>
          <div className="flex items-center justify-between gap-4">
            <span className="fr-mono fr-muted">{current.meta}</span>
            <Link href={current.href} className="fr-mono fr-link">
              {current.cta} →
            </Link>
          </div>
        </div>

        <nav aria-label="The edit" className="flex min-w-[18rem] flex-col gap-1 justify-self-start">
          <span className="fr-mono fr-muted mb-3">The edit · {String(slides.length - 1).padStart(2, "0")}</span>
          {slides.slice(1).map((slide, index) => (
            <Link
              key={slide.href}
              href={slide.href}
              onMouseEnter={() => setActive(index + 1)}
              onFocus={() => setActive(index + 1)}
              className={`fr-choice flex items-baseline gap-4 ${active === index + 1 ? "is-active" : ""}`}
            >
              <span className="fr-mono w-6">{String(index + 1).padStart(2, "0")}</span>
              <span className="fr-word text-[clamp(1.5rem,2.4vw,2.25rem)]">{slide.name}</span>
            </Link>
          ))}
          <Link href={`/collection/${side.toLowerCase()}`} className="fr-mono fr-link mt-5 self-start">
            All {side.toLowerCase()} →
          </Link>
        </nav>
      </section>

      <section aria-label={`${side} home`} className="flex flex-col gap-3 px-5 pb-8 pt-3 lg:hidden">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${slides.length}, minmax(0, 1fr))` }} aria-hidden="true">
          {slides.map((_, index) => (
            <span key={index} className="h-0.5" style={{ background: index <= active ? "var(--foreground)" : "color-mix(in srgb, var(--foreground) 14%, transparent)" }} />
          ))}
        </div>
        <div className="fr-frame relative aspect-[4/5] w-full">
          {frameLayers("100vw")}
          <button type="button" onClick={() => step(-1)} aria-label="Previous" className="absolute inset-y-0 left-0 z-10 w-2/5 bg-transparent" />
          <button type="button" onClick={() => step(1)} aria-label="Next" className="absolute inset-y-0 right-0 z-10 w-3/5 bg-transparent" />
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="fr-word text-[2.25rem]">{current.name}</h1>
          <span className="fr-mono fr-muted shrink-0">
            {String(active + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
          </span>
        </div>
        <span className="fr-mono fr-muted">{current.meta}</span>
        <Link href={current.href} className="fr-button mt-1">
          {current.cta}
        </Link>
      </section>
    </>
  );
}
