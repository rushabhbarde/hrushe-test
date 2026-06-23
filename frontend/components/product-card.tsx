import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { Product } from "@/lib/catalog";
import { getProductDisplayName } from "@/lib/product-presentation";
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

export function ProductCard({
  product,
  variant = "default",
  priority = false,
}: {
  product: Product;
  variant?: "default" | "editorial";
  priority?: boolean;
}) {
  const productName = getProductDisplayName(product);
  const productHref = `/product/${product.slug || product.id}`;
  const image = product.thumbnailUrl || product.images?.[0] || "";
  const hoverImage = product.images?.find((item) => item && item !== image) || "";
  const colour = product.colour || product.colors?.[0] || "";
  const colourOptions = getProductColourOptions(product);
  const visibleColourOptions = colourOptions.slice(0, 2);
  const hiddenColourCount = Math.max(0, colourOptions.length - visibleColourOptions.length);
  const isEditorial = variant === "editorial";
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

  return (
    <article
      data-product-card
      data-product-card-variant={variant}
      className={`group/card relative min-w-0 ${isEditorial ? "bg-[var(--background)]" : ""}`}
    >
      <div
        data-product-image-frame
        className={`relative overflow-hidden bg-[var(--surface-strong)] ${
          isEditorial ? "aspect-[4/5]" : "aspect-[18/25]"
        }`}
      >
        <Link href={productHref} className="group/image relative block h-full" aria-label={`View ${productName}`}>
          {image ? (
            <Image
              src={image}
              alt={productName}
              fill
              loading={priority ? "eager" : "lazy"}
              sizes={imageSizes}
              className={`object-cover object-center transition-transform duration-300 motion-reduce:transition-none md:group-hover/image:scale-[1.015] ${
                isEditorial ? "mix-blend-normal" : ""
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
        </Link>
        <ProductQuickAdd product={product} variant={isEditorial ? "icon" : "bar"} />
        <WishlistButton
          productId={product.id}
          label={`Save ${productName} to favourites`}
          className={`absolute z-10 flex items-center justify-center bg-[var(--surface)] text-[var(--foreground)] hover:bg-white ${
            isEditorial
              ? "bottom-4 right-4 h-6 w-6"
              : "right-3 top-3 h-11 w-11 border border-black/10 hover:border-[var(--foreground)]"
          }`}
          iconClassName={isEditorial ? "h-3.5 w-3.5" : "h-4 w-4"}
        />
      </div>
      <Link
        href={productHref}
        className={`block ${isEditorial ? "min-h-[6.6rem] px-4 py-4 sm:px-5 sm:py-5" : "pt-3"}`}
        aria-label={`View details for ${productName}`}
      >
        {isEditorial ? (
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-[0.9rem] font-medium leading-[1.22] text-[var(--foreground)] sm:text-[0.98rem]">
                {productName}
              </h3>
              <p className="mt-1 text-[0.9rem] font-medium leading-none text-[var(--foreground)] sm:text-[0.98rem]">
                {formatPrice(product.price)}
              </p>
              {product.availability === "sold-out" || product.status === "Sold Out" ? (
                <p className="mt-2 text-[0.62rem] uppercase tracking-[0.14em] text-[var(--muted)]">
                  Currently unavailable
                </p>
              ) : null}
            </div>
            {visibleColourOptions.length > 0 ? (
              <div className="mt-8 flex shrink-0 items-center gap-2" aria-label={`${colourOptions.length} colour options`}>
                {visibleColourOptions.map((colourOption) => (
                  <span
                    key={colourOption}
                    className="product-swatch h-3 w-3 border border-black/10"
                    style={{ "--swatch": getSwatchColour(colourOption) } as CSSProperties}
                    title={colourOption}
                    aria-label={colourOption}
                  />
                ))}
                {hiddenColourCount > 0 ? (
                  <span className="text-[0.84rem] font-medium leading-none text-[var(--foreground)]">
                    +{hiddenColourCount}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-[0.8rem] font-medium leading-5 text-[var(--foreground)] sm:text-[0.88rem]">
                {productName}
              </h3>
              <p className="shrink-0 text-[0.8rem] font-semibold text-[var(--foreground)] sm:text-[0.88rem]">
                {formatPrice(product.price)}
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
    </article>
  );
}
