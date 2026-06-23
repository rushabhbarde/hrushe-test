import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { getProductDisplayName } from "@/lib/product-presentation";
import { WishlistButton } from "@/components/wishlist-button";
import { ProductQuickAdd } from "@/components/product-quick-add";

function formatPrice(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
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
          {product.newIn || product.newArrival ? (
            <span className="absolute left-3 top-3 bg-[var(--surface)] px-2 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-[var(--foreground)]">
              New
            </span>
          ) : null}
        </Link>
        <ProductQuickAdd product={product} variant={isEditorial ? "icon" : "bar"} />
        <WishlistButton
          productId={product.id}
          label={`Save ${productName} to favourites`}
          className={`absolute right-3 z-10 flex h-11 w-11 items-center justify-center border border-black/10 bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--foreground)] ${
            isEditorial ? "bottom-3" : "top-3"
          }`}
          iconClassName="h-4 w-4"
        />
      </div>
      <Link
        href={productHref}
        className={`block ${isEditorial ? "px-3 pb-5 pt-3 sm:px-4" : "pt-3"}`}
        aria-label={`View details for ${productName}`}
      >
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
      </Link>
    </article>
  );
}
