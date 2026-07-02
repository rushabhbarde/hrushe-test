"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import type { Product } from "@/lib/catalog";
import { apiRequest } from "@/lib/api";
import { getProductDisplayName } from "@/lib/product-presentation";
import { getCompareAtPrice } from "@/lib/pricing";
import { WishlistButton } from "@/components/wishlist-button";
import { ProductQuickAdd } from "@/components/product-quick-add";

function formatPrice(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

const swatchPalette: Record<string, string> = {
  ash: "#9a9a95",
  beige: "#c3b49a",
  black: "#111111",
  blue: "#9eb7c4",
  brown: "#5a3d2f",
  charcoal: "#2d3030",
  cocoa: "#3f2b24",
  coffee: "#4a3329",
  cream: "#d9cab0",
  green: "#7a8066",
  grey: "#969792",
  gray: "#969792",
  ink: "#111319",
  midnight: "#111319",
  oat: "#d4c2a3",
  olive: "#77765b",
  sand: "#caba9c",
  white: "#f4f2ee",
};

function normaliseColourLabel(value: string) {
  return value.trim().replace(/begie/gi, "Beige");
}

function getSwatchColour(value: string) {
  const normalisedValue = normaliseColourLabel(value).toLowerCase();

  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalisedValue)) {
    return normalisedValue;
  }

  const paletteKey = Object.keys(swatchPalette).find((key) => normalisedValue.includes(key));
  return paletteKey ? swatchPalette[paletteKey] : productFallbackSwatch(value);
}

function productFallbackSwatch(value: string) {
  const fallbackColours = ["#1f1f1d", "#746b5a", "#d8d2c4", "#7f8b90", "#af9a7a"];
  const colourIndex = Array.from(value).reduce((sum, character) => sum + character.charCodeAt(0), 0);

  return fallbackColours[colourIndex % fallbackColours.length];
}

function getProductColourOptions(product: Product) {
  const labels = [
    product.colour,
    ...(product.colors || []),
    ...(product.variants || []).map((variant) => variant.color),
  ]
    .filter(Boolean)
    .map((value) => normaliseColourLabel(String(value)));
  const seenLabels = new Set<string>();

  return labels.filter((label) => {
    const key = label.toLowerCase();
    if (seenLabels.has(key)) {
      return false;
    }

    seenLabels.add(key);
    return true;
  });
}

function getProductGalleryImages(product: Product, primaryImage: string, detailImages: string[] = []) {
  const seenImages = new Set<string>();
  const imageCandidates = [
    primaryImage,
    ...(product.images || []),
    ...(product.galleryImages || []),
    ...detailImages,
  ];

  return imageCandidates
    .map((item) => item?.trim())
    .filter((item): item is string => {
      if (!item || seenImages.has(item)) {
        return false;
      }

      seenImages.add(item);
      return true;
    });
}

export function ProductCard({
  product,
  variant = "default",
  priority = false,
  showInfo = true,
}: {
  product: Product;
  variant?: "default" | "editorial";
  priority?: boolean;
  showInfo?: boolean;
}) {
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [galleryDetailImages, setGalleryDetailImages] = useState<string[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const productName = getProductDisplayName(product);
  const productHref = `/product/${product.slug || product.id}`;
  const image = product.thumbnailUrl || product.images?.[0] || "";
  const colour = product.colour || product.colors?.[0] || "";
  const isEditorial = variant === "editorial";
  const colourOptions = getProductColourOptions(product);
  const visibleColourOptions = colourOptions.slice(0, isEditorial ? 3 : 2);
  const compareAtPrice = getCompareAtPrice(product.price, product.compareAtPrice);
  const hasDiscount = Boolean(compareAtPrice);
  const galleryImages = getProductGalleryImages(product, image, galleryDetailImages);
  const activeGalleryIndex = galleryImages.length > 0 ? galleryIndex % galleryImages.length : 0;
  const activeImage = isEditorial ? galleryImages[activeGalleryIndex] || image : image;
  const hoverImage = !isEditorial
    ? product.images?.find((item) => item && item !== image) || ""
    : "";
  const hasCardGallery = isEditorial && galleryImages.length > 1;
  const imageSizes = isEditorial
    ? "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
    : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw";
  const availableSizes = product.trackInventory
    ? product.sizes.filter((size) =>
        product.variants?.some(
          (variant) =>
            variant.active &&
            variant.stock > 0 &&
            variant.size.toLowerCase() === size.toLowerCase()
        )
      )
    : product.sizes;
  const showPreviousImage = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setGalleryIndex((index) => (index - 1 + galleryImages.length) % galleryImages.length);
  };
  const showNextImage = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setGalleryIndex((index) => (index + 1) % galleryImages.length);
  };
  const loadProductGallery = async () => {
    if (!isEditorial || galleryLoading || galleryDetailImages.length > 0 || (product.galleryImages || []).length > 0) {
      return;
    }

    setGalleryLoading(true);
    try {
      const detail = await apiRequest<Product>(`/products/${product.slug || product.id}`);
      const detailPrimaryImage = detail.thumbnailUrl || detail.images?.[0] || image;

      setGalleryDetailImages(getProductGalleryImages(detail, detailPrimaryImage));
    } catch {
      setGalleryDetailImages([]);
    } finally {
      setGalleryLoading(false);
    }
  };

  return (
    <article
      data-product-card
      data-product-card-variant={variant}
      className={`group/card relative min-w-0 ${isEditorial ? "bg-[var(--background)]" : ""}`}
      onMouseEnter={isEditorial ? () => void loadProductGallery() : undefined}
      onMouseOver={isEditorial ? () => void loadProductGallery() : undefined}
      onFocus={isEditorial ? () => void loadProductGallery() : undefined}
    >
      <div
        data-product-image-frame
        className={`relative overflow-hidden bg-[var(--surface-strong)] ${
          isEditorial ? "aspect-[4/5]" : "aspect-[18/25]"
        }`}
      >
        <Link href={productHref} className="group/image relative block h-full" aria-label={`View ${productName}`}>
          {activeImage ? (
            <Image
              key={activeImage}
              src={activeImage}
              alt={productName}
              fill
              loading={priority ? "eager" : "lazy"}
              sizes={imageSizes}
              className={`object-center transition-transform duration-300 motion-reduce:transition-none md:group-hover/image:scale-[1.015] ${
                isEditorial ? "object-cover mix-blend-normal" : "object-cover"
              }`}
            />
          ) : (
            <div className="flex h-full items-end p-4 text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
              Image being prepared
            </div>
          )}
          {hoverImage ? (
            <Image
              src={hoverImage}
              alt=""
              fill
              loading="lazy"
              sizes={imageSizes}
              className="hidden object-cover object-center opacity-0 transition-opacity duration-300 motion-reduce:transition-none md:block md:group-hover/image:opacity-100"
            />
          ) : null}
          {!isEditorial && (product.newIn || product.newArrival) ? (
            <span className="absolute left-3 top-3 bg-[var(--surface)] px-2 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-[var(--foreground)]">
              New
            </span>
          ) : null}
          {isEditorial && hasDiscount ? (
            <span className="absolute right-5 top-5 z-10 text-[0.68rem] font-medium uppercase leading-none text-[var(--accent)]">
              Sale
            </span>
          ) : null}
        </Link>
        {hasCardGallery ? (
          <>
            <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 flex -translate-y-1/2 items-center justify-between px-4 opacity-0 transition-opacity duration-200 group-hover/card:opacity-100 group-focus-within/card:opacity-100">
              <button
                type="button"
                onClick={showPreviousImage}
                className="pointer-events-auto grid h-8 w-8 place-items-center text-2xl font-light leading-none text-[var(--foreground)]"
                aria-label={`Previous image for ${productName}`}
                data-product-gallery-control="previous"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={showNextImage}
                className="pointer-events-auto grid h-8 w-8 place-items-center text-2xl font-light leading-none text-[var(--foreground)]"
                aria-label={`Next image for ${productName}`}
                data-product-gallery-control="next"
              >
                ›
              </button>
            </div>
            <div className="absolute inset-x-0 bottom-0 z-10 flex h-[2px]" aria-hidden="true">
              {galleryImages.map((galleryImage, index) => (
                <span
                  key={galleryImage}
                  className={`h-full flex-1 transition-colors duration-200 ${
                    index === activeGalleryIndex ? "bg-[var(--foreground)]" : "bg-transparent"
                  }`}
                />
              ))}
            </div>
          </>
        ) : null}
        <ProductQuickAdd product={product} variant={isEditorial ? "icon" : "bar"} />
        {isEditorial ? null : (
          <WishlistButton
            productId={product.id}
            label={`Save ${productName} to favourites`}
            className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center border border-black/10 bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--foreground)] hover:bg-white"
            iconClassName="h-4 w-4"
          />
        )}
      </div>
      {showInfo ? (
      <Link
        href={productHref}
        className={`block ${isEditorial ? "min-h-[6.4rem] bg-[var(--background)] px-5 py-5" : "pt-3"}`}
        aria-label={`View details for ${productName}`}
      >
        {isEditorial ? (
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-[0.88rem] font-semibold leading-[1.18] text-[var(--foreground)]">
                {productName}
              </h3>
              {colour ? (
                <p className="mt-1.5 text-[0.8rem] font-semibold leading-none text-[var(--muted)]">
                  {colour.replace(/begie/gi, "Beige")}
                </p>
              ) : null}
              {visibleColourOptions.length > 0 ? (
                <div className="mt-4 flex items-center gap-2 text-[0.78rem] font-medium leading-none text-[var(--muted)]" aria-label={`${colourOptions.length} colour options`}>
                  {visibleColourOptions.map((colourOption) => (
                    <span
                      key={colourOption}
                      className="product-swatch h-3.5 w-3.5 rounded-full border border-black/10"
                      style={{ "--swatch": getSwatchColour(colourOption) } as CSSProperties}
                      title={colourOption}
                      aria-label={colourOption}
                    />
                  ))}
                  <span>{colourOptions.length} {colourOptions.length === 1 ? "Colour" : "Colours"}</span>
                </div>
              ) : null}
              {product.availability === "sold-out" || product.status === "Sold Out" ? (
                <p className="mt-2 text-[0.62rem] uppercase tracking-[0.14em] text-[var(--muted)]">
                  Currently unavailable
                </p>
              ) : null}
            </div>
            <p className="flex shrink-0 items-center gap-1.5 text-[0.84rem] font-semibold leading-none">
              {compareAtPrice ? (
                <span className="text-[var(--foreground)] line-through decoration-[1px]">
                  {formatPrice(compareAtPrice)}
                </span>
              ) : null}
              <span className={compareAtPrice ? "text-[var(--accent)]" : "text-[var(--foreground)]"}>
                {formatPrice(product.price)}
              </span>
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-[0.8rem] font-medium leading-5 text-[var(--foreground)] sm:text-[0.88rem]">
                {productName}
              </h3>
              <p className="shrink-0 text-[0.8rem] font-semibold text-[var(--foreground)] sm:text-[0.88rem]">
                {compareAtPrice ? (
                  <>
                    <span className="mr-1.5 line-through decoration-[1px]">{formatPrice(compareAtPrice)}</span>
                    <span className="text-[var(--accent)]">{formatPrice(product.price)}</span>
                  </>
                ) : (
                  formatPrice(product.price)
                )}
              </p>
            </div>
            {product.availability === "sold-out" || product.status === "Sold Out" ? (
              <p className="mt-2 text-[0.62rem] uppercase tracking-[0.14em] text-[var(--muted)]">
                Currently unavailable
              </p>
            ) : colour || availableSizes.length > 0 ? (
              <p className="mt-1.5 truncate text-[0.64rem] uppercase tracking-[0.1em] text-[var(--muted)]">
                {[colour.replace(/begie/gi, "Beige"), availableSizes.join(" ")].filter(Boolean).join(" · ")}
              </p>
            ) : null}
          </div>
        )}
      </Link>
      ) : null}
    </article>
  );
}
