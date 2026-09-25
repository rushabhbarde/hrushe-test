"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/catalog";
import { shouldBypassImageOptimization } from "@/lib/image-source";
import { getProductDisplayName } from "@/lib/product-presentation";

function productHref(product: Product) {
  return `/product/${product.slug || product.id}`;
}

function productColour(product: Product) {
  return product.colour || product.colors[0] || "";
}

function formatPrice(price: number) {
  return `₹${price.toLocaleString("en-IN")}`;
}

function FrameImage({ product, priority, sizes }: { product: Product; priority: boolean; sizes: string }) {
  const src = product.images[0];

  if (!src) {
    return <div className="h-full w-full" style={{ backgroundColor: product.accent || "#eeece8" }} />;
  }

  return (
    <Image
      src={src}
      alt={getProductDisplayName(product)}
      fill
      priority={priority}
      loading={priority ? "eager" : "lazy"}
      unoptimized={shouldBypassImageOptimization(src)}
      sizes={sizes}
    />
  );
}

/**
 * The shop "index": piece names are the catalogue. On desktop, hovering or focusing a name
 * shows that piece in the frame; on phones each piece gets its own frame, name and price.
 */
export function FrameIndex({ products, label }: { products: Product[]; label: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = products[activeIndex] || products[0];

  if (!active) {
    return null;
  }

  return (
    <>
      <section
        aria-label={label}
        className="hidden items-center gap-x-16 px-10 pb-16 pt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_min(30vw,440px)] xl:gap-x-24"
      >
        <nav aria-label={`${label} index`} className="flex flex-col">
          {products.map((product, index) => (
            <Link
              key={product.id}
              href={productHref(product)}
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              className={`fr-index-row ${index === activeIndex ? "is-active" : ""}`}
            >
              <span className="fr-mono">{String(index + 1).padStart(2, "0")}</span>
              <span className="fr-word text-[clamp(2.5rem,4.6vw,4.25rem)]">{getProductDisplayName(product)}</span>
              <span className="fr-mono">
                {[productColour(product), formatPrice(product.price)].filter(Boolean).join(" · ")}
              </span>
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-4">
          <div className="fr-frame aspect-[3/4] w-full">
            {products.map((product, index) => (
              <div key={product.id} className={`fr-frame__layer ${index === activeIndex ? "is-active" : ""}`} aria-hidden={index !== activeIndex}>
                <FrameImage product={product} priority={index === 0} sizes="(min-width: 1024px) 30vw, 100vw" />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="fr-mono fr-muted">{active.fitType || active.fitNote || active.category}</span>
            <Link href={productHref(active)} className="fr-mono fr-link">
              View piece →
            </Link>
          </div>
        </div>
      </section>

      <section aria-label={label} className="flex flex-col gap-10 px-5 pb-14 pt-4 lg:hidden">
        {products.map((product, index) => (
          <Link key={product.id} href={productHref(product)} className="flex flex-col gap-3">
            <span className="fr-frame block aspect-[3/4] w-full">
              <span className="fr-frame__layer is-active">
                <FrameImage product={product} priority={index < 2} sizes="100vw" />
              </span>
            </span>
            <span className="flex items-baseline justify-between gap-4">
              <span className="fr-word text-[2.1rem]">{getProductDisplayName(product)}</span>
              <span className="fr-mono">{formatPrice(product.price)}</span>
            </span>
            {productColour(product) ? <span className="fr-mono fr-muted">{productColour(product)}</span> : null}
          </Link>
        ))}
      </section>
    </>
  );
}
