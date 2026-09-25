"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SizeGuideModal } from "@/components/size-guide";
import { WishlistButton } from "@/components/wishlist-button";
import { useCart } from "@/components/cart-provider";
import { useToast } from "@/components/toast-provider";
import { apiRequest } from "@/lib/api";
import type { Product } from "@/lib/catalog";
import { isPersistedMediaSource, shouldBypassImageOptimization } from "@/lib/image-source";
import { useStorefrontData } from "@/lib/use-storefront";
import {
  getProductDisplayName,
  getProductFabricLine,
  getProductFitLine,
} from "@/lib/product-presentation";

function normalizeProduct(product: Product): Product {
  return {
    ...product,
    name: (product.name || "Untitled product").replace(/\bBegie\b/gi, "Beige"),
    slug: (product.slug || product.id).replace(/begie/gi, "beige"),
    description: product.description || "",
    price: Number(product.price) || 0,
    category: product.category || "Uncategorized",
    categories: Array.isArray(product.categories)
      ? product.categories.filter(Boolean)
      : product.category
        ? [product.category]
        : [],
    colors: Array.isArray(product.colors) ? product.colors.filter(Boolean) : [],
    sizes: Array.isArray(product.sizes) ? product.sizes.filter(Boolean) : [],
    images: Array.isArray(product.images) ? product.images.filter(isPersistedMediaSource) : [],
    galleryImages: Array.isArray(product.galleryImages)
      ? product.galleryImages.filter(isPersistedMediaSource)
      : [],
    videos: Array.isArray(product.videos)
      ? product.videos.filter((video) => isPersistedMediaSource(video?.url))
      : [],
    reviews: Array.isArray(product.reviews)
      ? product.reviews
          .filter(Boolean)
          .map((review) => ({
            ...review,
            reviewerName: review.reviewerName || "Customer",
            quote: review.quote || "",
            rating: Number(review.rating) || 5,
            photo: isPersistedMediaSource(review.photo) ? review.photo : "",
          }))
      : [],
    accent: product.accent || "#f6f6f6",
    imageLabel: product.imageLabel || product.name || "Product image",
  };
}

function getProductFit(product: Product) {
  return product.fitNote || product.fitType || "";
}

function getProductDetailRows(product: Product) {
  return [
    { label: "Composition", value: product.fabric || product.cottonType },
    { label: "GSM", value: product.gsm },
    { label: "Fit", value: getProductFit(product) },
    { label: "Feel", value: product.feel },
    { label: "Weight", value: product.weight },
    { label: "Construction", value: product.qualityNote },
  ].filter((item) => item.value);
}

function getWashCare(product: Product) {
  return product.washCare || "";
}

function ProductDetailSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div className="loading-pulse border border-[rgba(17,17,17,0.08)] bg-[var(--surface-strong)] p-8">
        <div className="aspect-[4/5] bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]" />
      </div>
      <div className="loading-pulse border border-[rgba(17,17,17,0.08)] bg-[rgba(255,255,255,0.58)] p-8">
        <div className="h-4 w-24 bg-[var(--surface-strong)]" />
        <div className="mt-5 h-8 w-2/3 bg-[var(--surface-strong)]" />
        <div className="mt-4 h-5 w-36 bg-[var(--surface-strong)]" />
        <div className="mt-10 space-y-3">
          <div className="h-4 w-full bg-[var(--surface-strong)]" />
          <div className="h-4 w-4/5 bg-[var(--surface-strong)]" />
          <div className="h-4 w-3/5 bg-[var(--surface-strong)]" />
        </div>
        <div className="mt-14 grid grid-cols-3 gap-2">
          <div className="h-10 bg-[var(--surface-strong)]" />
          <div className="h-10 bg-[var(--surface-strong)]" />
          <div className="h-10 bg-[var(--surface-strong)]" />
        </div>
        <div className="mt-8 h-12 bg-[var(--surface-strong)]" />
      </div>
    </div>
  );
}

type ProductMediaItem =
  | {
      id: string;
      type: "image";
      src: string;
      alt: string;
    }
  | {
      id: string;
      type: "video";
      src: string;
      title: string;
      posterUrl?: string;
    };

function buildProductMediaItems(product: Product): ProductMediaItem[] {
  const seenImages = new Set<string>();
  const imageItems = [...product.images, ...(product.galleryImages || [])]
    .filter(Boolean)
    .filter((src) => {
      if (seenImages.has(src)) {
        return false;
      }

      seenImages.add(src);
      return true;
    })
    .map((src, index) => ({
      id: `${product.id}-image-${index}`,
      type: "image" as const,
      src,
      alt: index === 0 ? product.name : `${product.name} image ${index + 1}`,
    }));

  const videoItems = (product.videos || [])
    .filter((video) => video?.url)
    .map((video, index) => ({
      id: video.id || `${product.id}-video-${index}`,
      type: "video" as const,
      src: video.url,
      title: video.title || `${product.name} video ${index + 1}`,
      posterUrl: video.posterUrl,
    }));

  return [...imageItems, ...videoItems];
}

function ProductMediaFrame({
  item,
  product,
  imageClassName,
  onVideoEnded,
}: {
  item: ProductMediaItem | null;
  product: Product;
  imageClassName: string;
  onVideoEnded: () => void;
}) {
  if (!item) {
    return (
      <div
        className="h-full w-full"
        style={{ backgroundColor: product.accent || "#f6f6f6" }}
      />
    );
  }

  if (item.type === "video") {
    return (
      <video
        key={item.id}
        src={item.src}
        poster={item.posterUrl || undefined}
        autoPlay
        controls
        muted
        onEnded={onVideoEnded}
        playsInline
        preload="metadata"
        className="h-full w-full bg-black object-contain"
      />
    );
  }

  return (
    <Image
      src={item.src}
      alt={item.alt}
      fill
      priority={item.id.endsWith("-image-0")}
      loading={item.id.endsWith("-image-0") ? "eager" : "lazy"}
      unoptimized={shouldBypassImageOptimization(item.src)}
      sizes="(max-width: 1024px) 100vw, 50vw"
      className={imageClassName}
    />
  );
}

function getColourProducts(product: Product, siblingProducts: Product[]) {
  return [product, ...siblingProducts].filter(
    (item, index, items) =>
      Boolean(item.colors[0]) &&
      items.findIndex((candidate) => candidate.colors[0]?.toLowerCase() === item.colors[0]?.toLowerCase()) === index
  );
}

function ColourWords({
  product,
  colourProducts,
  className,
  wordClassName,
}: {
  product: Product;
  colourProducts: Product[];
  className: string;
  wordClassName: string;
}) {
  if (colourProducts.length < 2) {
    return null;
  }

  return (
    <nav aria-label="Colour" className={className}>
      {colourProducts.map((colourProduct) => {
        const colour = colourProduct.colors[0];

        if (colourProduct.id === product.id) {
          return (
            <span key={colourProduct.id} aria-current="true" className={`fr-choice is-active is-underlined ${wordClassName}`}>
              {colour}
            </span>
          );
        }

        return (
          <Link
            key={colourProduct.id}
            href={`/product/${colourProduct.slug || colourProduct.id}`}
            aria-label={`View ${colour}`}
            className={`fr-choice is-underlined ${wordClassName}`}
          >
            {colour}
          </Link>
        );
      })}
    </nav>
  );
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const { products, loading } = useStorefrontData();
  const { addItem, openCart } = useCart();
  const { pushToast } = useToast();
  const matchedProduct = useMemo(
    () => products.find((item) => item.id === params.id || item.slug === params.id),
    [params.id, products]
  );
  const normalizedMatchedProduct = useMemo(
    () => (matchedProduct ? normalizeProduct(matchedProduct) : null),
    [matchedProduct]
  );
  const [product, setProduct] = useState<Product | null>(normalizedMatchedProduct);
  const [productLoading, setProductLoading] = useState(true);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [addError, setAddError] = useState("");
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  useEffect(() => {
    let active = true;

    if (normalizedMatchedProduct) {
      setProduct(normalizedMatchedProduct);
    }

    if (loading) {
      return () => {
        active = false;
      };
    }

    if (!normalizedMatchedProduct) {
      setProductLoading(true);
    }

    const loadProduct = async () => {
      try {
        const fetchedProduct = await apiRequest<Product>(`/products/${params.id}`);

        if (!active) {
          return;
        }

        setProduct(normalizeProduct(fetchedProduct));
      } catch {
        if (!active) {
          return;
        }

        if (!normalizedMatchedProduct) {
          setProduct(null);
        }
      } finally {
        if (active) {
          setProductLoading(false);
        }
      }
    };

    void loadProduct();

    return () => {
      active = false;
    };
  }, [loading, normalizedMatchedProduct, params.id]);

  useEffect(() => {
    if (!product) {
      return;
    }

    setActiveMediaIndex(0);
    setSelectedSize("");
    setAddError("");
  }, [product]);

  if (loading || productLoading) {
    return (
      <div className="page-shell bg-[var(--background)]">
        <SiteHeader />
        <main className="mx-auto w-full px-4 pb-24 pt-6 sm:px-6 lg:max-w-[1180px] lg:px-8 lg:pb-20 lg:pt-16">
          <ProductDetailSkeleton />
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page-shell bg-[var(--background)]">
        <SiteHeader />
        <main className="mx-auto max-w-[1600px] px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pt-8">
          <div className="mt-8 flex flex-col gap-5 px-2 py-8">
            <h1 className="fr-word text-[3rem]">Not found.</h1>
            <p className="max-w-xl text-[var(--muted)]">
              This product is no longer available or the link may be incorrect.
            </p>
            <Link href="/shop" className="fr-mono fr-link self-start">
              Back to shop
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const displayName = getProductDisplayName(product);
  const mediaItems = buildProductMediaItems(product);
  const requiresSize = product.sizes.length > 0;
  const effectiveColor = product.colors[0] || "";
  const isSizeAvailable = (size: string) =>
    !product.trackInventory ||
    Boolean(
      product.variants?.some(
        (variant) =>
          variant.active &&
          variant.stock > 0 &&
          variant.size.toLowerCase() === size.toLowerCase() &&
          (!effectiveColor || variant.color.toLowerCase() === effectiveColor.toLowerCase())
      )
    );
  const canAddToCart = (!requiresSize || Boolean(selectedSize)) && (!selectedSize || isSizeAvailable(selectedSize));
  const siblingProducts = products.filter((item) => item.id !== product.id && item.category === product.category);
  const colourProducts = getColourProducts(product, siblingProducts);
  const relatedProducts = products
    .filter((item) => item.id !== product.id && (item.category === product.category || item.featured))
    .slice(0, 4);
  const compareAtPrice = Number(product.compareAtPrice) > product.price ? Number(product.compareAtPrice) : 0;
  const priceText = `₹${product.price.toLocaleString("en-IN")}`;
  const compareAtPriceText = compareAtPrice ? `₹${compareAtPrice.toLocaleString("en-IN")}` : "";
  const hasMultipleMedia = mediaItems.length > 1;
  const productUnavailable = product.status === "Sold Out" || product.availability === "sold-out";
  const fitLabel = getProductFit(product) || getProductFitLine(product);
  const labelLine = [getProductFabricLine(product), fitLabel].filter(Boolean).join(" · ");
  const detailRows = getProductDetailRows(product);
  const washCare = getWashCare(product);
  const modelNote = [
    product.modelHeight ? `Model is ${product.modelHeight}` : "",
    product.modelWornSize ? `wearing ${product.modelWornSize}` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const sideLabel = product.gender && product.gender !== "Unisex" ? product.gender : "";
  const ctaLabel = productUnavailable
    ? "Currently unavailable"
    : requiresSize && !selectedSize
      ? "Select a size"
      : `Add to bag · ${selectedSize || priceText}`;
  const ctaHint = productUnavailable
    ? "This piece is sold out"
    : requiresSize && !selectedSize
      ? "Choose a size to continue"
      : "Folded & dispatched in 1–3 business days";
  const ctaDisabled = productUnavailable || (Boolean(selectedSize) && !canAddToCart);

  const showPreviousMedia = () => {
    if (hasMultipleMedia) {
      setActiveMediaIndex((current) => (current - 1 + mediaItems.length) % mediaItems.length);
    }
  };

  const showNextMedia = () => {
    if (hasMultipleMedia) {
      setActiveMediaIndex((current) => (current + 1) % mediaItems.length);
    }
  };

  const handleSwipeStart = (event: React.PointerEvent<HTMLElement>) => {
    if (!hasMultipleMedia || event.button !== 0) {
      return;
    }

    swipeStartRef.current = { x: event.clientX, y: event.clientY };
  };

  const handleSwipeEnd = (event: React.PointerEvent<HTMLElement>) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;

    if (!hasMultipleMedia || !start) {
      return;
    }

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;

    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY) * 1.15) {
      return;
    }

    if (deltaX < 0) {
      showNextMedia();
    } else {
      showPreviousMedia();
    }
  };

  const handleAddToCart = () => {
    if (requiresSize && !selectedSize) {
      const message = "Please select a size before adding to bag.";
      setAddError(message);
      pushToast(message, "error");
      return;
    }

    if (!canAddToCart) {
      const message = "This size is currently unavailable.";
      setAddError(message);
      pushToast(message, "error");
      return;
    }

    addItem({
      productId: product.id,
      name: displayName,
      price: product.price,
      size: selectedSize,
      color: effectiveColor,
      quantity: 1,
      accent: product.accent,
      image: product.images[0],
    });
    setAddError("");
    pushToast(`${displayName} added to bag`);
    openCart();
  };

  return (
    <div className="page-shell bg-[var(--background)]">
      <SiteHeader />
      <main className="w-full pb-36 lg:pb-0">
        <div className="lg:grid lg:min-h-[calc(100svh-7rem)] lg:grid-cols-[minmax(0,1fr)_min(30vw,440px)_minmax(0,1fr)] lg:items-center lg:gap-x-14 lg:px-10 lg:py-10 xl:gap-x-16">
          <ColourWords
            product={product}
            colourProducts={colourProducts}
            className="hidden lg:flex lg:flex-col lg:items-end lg:gap-2 lg:justify-self-end"
            wordClassName="fr-word text-[clamp(1.75rem,3vw,2.75rem)]"
          />

          <section aria-label="Product media gallery" className="px-5 pt-2 lg:px-0 lg:pt-0">
            <div
              className="fr-frame aspect-[3/4] w-full select-none"
              onPointerDown={handleSwipeStart}
              onPointerUp={handleSwipeEnd}
              onPointerCancel={() => {
                swipeStartRef.current = null;
              }}
              style={{ touchAction: "pan-y" }}
            >
              {mediaItems.length === 0 ? (
                <div className="h-full w-full" style={{ backgroundColor: product.accent || "#eeece8" }} />
              ) : (
                mediaItems.map((item, index) => {
                  const isActive = index === activeMediaIndex;

                  if (item.type === "video" && !isActive) {
                    return null;
                  }

                  return (
                    <div key={item.id} className={`fr-frame__layer ${isActive ? "is-active" : ""}`} aria-hidden={!isActive}>
                      <ProductMediaFrame
                        item={item}
                        product={product}
                        imageClassName="object-cover"
                        onVideoEnded={showNextMedia}
                      />
                    </div>
                  );
                })
              )}
              {hasMultipleMedia ? (
                <>
                  <button
                    type="button"
                    onClick={showPreviousMedia}
                    className="absolute inset-y-0 left-0 z-10 w-2/5 cursor-w-resize bg-transparent"
                    aria-label="Previous photo"
                  />
                  <button
                    type="button"
                    onClick={showNextMedia}
                    className="absolute inset-y-0 right-0 z-10 w-3/5 cursor-e-resize bg-transparent"
                    aria-label="Next photo"
                  />
                </>
              ) : null}
            </div>
            <div className="mt-3 flex items-center justify-between gap-4">
              <span className="fr-mono fr-muted">
                {String(activeMediaIndex + 1).padStart(2, "0")} / {String(Math.max(mediaItems.length, 1)).padStart(2, "0")}
                {modelNote ? ` · ${modelNote}` : ""}
              </span>
              {product.sizeGuide?.length ? (
                <button type="button" onClick={() => setSizeGuideOpen(true)} className="fr-mono fr-link min-h-11">
                  Size guide
                </button>
              ) : null}
            </div>
          </section>

          <section
            aria-label="Product details and purchase options"
            className="flex flex-col gap-5 px-5 pt-5 lg:max-w-[340px] lg:justify-self-start lg:px-0 lg:pt-0"
          >
            <span className="fr-mono fr-muted">{[sideLabel, product.category].filter(Boolean).join(" · ")}</span>
            <div className="flex items-start justify-between gap-4">
              <h1 className="fr-word text-[2.1rem] lg:text-[clamp(2.25rem,3vw,2.75rem)]">{displayName}</h1>
              <WishlistButton
                productId={product.id}
                label={`Save ${displayName}`}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-[var(--foreground)]"
                iconClassName="h-4 w-4"
              />
            </div>
            <p className="flex items-baseline gap-3 text-[1.05rem]">
              <span>{priceText}</span>
              {compareAtPriceText ? <span className="text-[0.85rem] text-[var(--muted)] line-through">{compareAtPriceText}</span> : null}
            </p>

            <ColourWords
              product={product}
              colourProducts={colourProducts}
              className="flex flex-wrap gap-x-4 gap-y-1 lg:hidden"
              wordClassName="fr-word min-h-10 text-[1.15rem]"
            />

            {requiresSize ? (
              <div className="flex flex-col gap-2">
                <span className="fr-mono">Size{selectedSize ? ` · ${selectedSize}` : ""}</span>
                <div className="flex flex-wrap items-end gap-7" role="group" aria-label="Size">
                  {product.sizes.map((size) => {
                    const available = isSizeAvailable(size);
                    const active = selectedSize === size;

                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          if (available) {
                            setSelectedSize(size);
                            setAddError("");
                          }
                        }}
                        disabled={!available}
                        aria-pressed={active}
                        aria-label={`Size ${size}${available ? "" : ", unavailable"}`}
                        className={`fr-choice fr-word is-underlined min-w-12 text-[2.75rem]! lg:text-[3.5rem]! ${active ? "is-active" : ""}`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="hidden flex-col gap-2 lg:flex">
              <button type="button" onClick={handleAddToCart} disabled={ctaDisabled} className="fr-button">
                {ctaLabel}
              </button>
              <p className="fr-mono fr-muted text-center text-[0.6rem]">{ctaHint}</p>
            </div>
            {addError ? (
              <p className="text-sm text-[var(--danger)]" role="alert">
                {addError}
              </p>
            ) : null}

            <div className="fr-label flex flex-col gap-1">
              {labelLine ? <span className="fr-mono">{labelLine}</span> : null}
              <span className="text-[0.82rem] text-[var(--muted)]">
                {product.returnEligible === false ? "Dispatch in 1–3 business days" : "One free size exchange · Dispatch in 1–3 business days"}
              </span>
            </div>

            <div className="flex flex-col">
              <details className="fr-accordion">
                <summary className="fr-mono">Details</summary>
                <div className="flex flex-col gap-3 py-4 text-[0.88rem] leading-7 text-[var(--muted)]">
                  {product.description ? <p>{product.description}</p> : null}
                  {detailRows.length > 0 ? (
                    <dl className="grid gap-1">
                      {detailRows.map((item) => (
                        <div key={item.label} className="flex gap-2">
                          <dt className="text-[var(--foreground)]">{item.label}</dt>
                          <dd>{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                </div>
              </details>
              {washCare ? (
                <details className="fr-accordion">
                  <summary className="fr-mono">Care</summary>
                  <p className="py-4 text-[0.88rem] leading-7 text-[var(--muted)]">{washCare}</p>
                </details>
              ) : null}
              <details className="fr-accordion">
                <summary className="fr-mono">Shipping &amp; returns</summary>
                <p className="py-4 text-[0.88rem] leading-7 text-[var(--muted)]">
                  Orders dispatch within 1–3 business days. One size exchange is available when eligible, and returns follow
                  the product return policy.
                </p>
              </details>
            </div>
          </section>
        </div>

        {mediaItems.length > 1 ? (
          <section
            className="hide-scrollbar mt-12 flex snap-x snap-mandatory gap-1 overflow-x-auto overscroll-x-contain lg:mt-4"
            aria-label="Product detail gallery"
          >
            {mediaItems.slice(1).map((item) => (
              <div
                key={item.id}
                className="fr-frame relative h-[52svh] min-h-[360px] w-[86vw] flex-none snap-start sm:w-[70vw] lg:h-[calc(100vh-8rem)] lg:min-h-[560px] lg:max-h-[760px] lg:w-[33.333333vw]"
              >
                {item.type === "image" ? (
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    loading="lazy"
                    unoptimized={shouldBypassImageOptimization(item.src)}
                    sizes="(max-width: 640px) 86vw, (max-width: 1024px) 70vw, 34vw"
                    className="object-cover object-center"
                  />
                ) : (
                  <video
                    src={item.src}
                    poster={item.posterUrl || undefined}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            ))}
          </section>
        ) : null}

        {relatedProducts.length > 0 ? (
          <section className="py-14 lg:py-16">
            <h2 className="fr-mono px-5 lg:px-10">Also in the edit</h2>
            <div className="collection-plp__grid collection-plp__grid--editorial mt-8">
              {relatedProducts.map((item) => (
                <ProductCard key={item.id} product={item} variant="editorial" />
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--border)] bg-[var(--background)] px-5 pb-[calc(0.9rem+env(safe-area-inset-bottom))] pt-3 lg:hidden">
        <button type="button" onClick={handleAddToCart} disabled={ctaDisabled} className="fr-button">
          {ctaLabel}
        </button>
        <p className="fr-mono fr-muted mt-2 text-center text-[0.58rem]">{ctaHint}</p>
      </div>

      <SizeGuideModal
        open={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        rows={product.sizeGuide}
        title="Garment measurements"
      />
      <SiteFooter />
    </div>
  );
}
