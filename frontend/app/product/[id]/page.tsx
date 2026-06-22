"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SizeGuideModal, SizeGuideTable } from "@/components/size-guide";
import { ServicePromise } from "@/components/service-promise";
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

const productInfoSections = [
  {
    key: "description",
    title: "Product",
  },
  {
    key: "fabric",
    title: "Fabric & construction",
  },
  {
    key: "wash",
    title: "Care",
  },
  {
    key: "size",
    title: "Fit & measurements",
  },
  {
    key: "delivery",
    title: "Delivery & returns",
  },
] as const;

const swatchColors: Record<string, string> = {
  black: "#111111",
  white: "#f4f4f1",
  offwhite: "#efeee7",
  "off white": "#efeee7",
  cream: "#ece3d6",
  grey: "#bdbdbd",
  gray: "#bdbdbd",
  charcoal: "#3b3b3b",
  stone: "#cbc7bd",
  beige: "#dbcdb7",
  green: "#9ccfbe",
  sage: "#b2c4b0",
  blue: "#b9c2ea",
  navy: "#25344b",
  red: "#b14b52",
  maroon: "#6e2b3c",
  brown: "#7a634a",
};

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
    accent: product.accent || "#f1eee8",
    imageLabel: product.imageLabel || product.name || "Product image",
  };
}

function resolveSwatchColor(color: string, accent: string) {
  return swatchColors[color.toLowerCase().trim()] || accent || "#d9d9d9";
}

function getProductSummary(description: string) {
  const normalized = description.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return "";
  }

  const sentences =
    normalized.match(/[^.!?]+[.!?]?/g)?.map((sentence) => sentence.trim()).filter(Boolean) ||
    [];

  if (sentences.length >= 2) {
    return sentences.slice(0, 2).join(" ");
  }

  if (normalized.length <= 220) {
    return normalized;
  }

  const clipped = normalized.slice(0, 220);
  return `${clipped.slice(0, clipped.lastIndexOf(" ")).trim()}...`;
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
        style={{ backgroundColor: product.accent || "#f3f3f0" }}
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
      unoptimized={shouldBypassImageOptimization(item.src)}
      sizes="(max-width: 1024px) 100vw, 50vw"
      className={imageClassName}
    />
  );
}

type ProductInfoPanelProps = {
  product: Product;
  siblingProducts: Product[];
  priceText: string;
  compareAtPriceText: string;
  hasDiscount: boolean;
  description: string;
  selectedColor: string;
  selectedSize: string;
  addError: string;
  requiresSize: boolean;
  canAddToCart: boolean;
  onColorSelect: (color: string) => void;
  onSizeSelect: (size: string) => void;
  onAddToCart: () => void;
  onOpenSizeGuide: () => void;
  actionRef?: React.Ref<HTMLDivElement>;
};

function ProductInfoPanel({
  product,
  siblingProducts,
  priceText,
  compareAtPriceText,
  hasDiscount,
  description,
  selectedColor,
  selectedSize,
  addError,
  requiresSize,
  canAddToCart,
  onColorSelect,
  onSizeSelect,
  onAddToCart,
  onOpenSizeGuide,
  actionRef,
}: ProductInfoPanelProps) {
  const displayName = getProductDisplayName(product);
  const colorProducts = [product, ...siblingProducts].filter(
    (item, index, items) =>
      Boolean(item.colors[0]) &&
      items.findIndex(
        (candidate) =>
          candidate.colors[0]?.toLowerCase() === item.colors[0]?.toLowerCase()
      ) === index
  );
  return (
    <div className="flex flex-col border-b border-[var(--border)] bg-[var(--background)] px-4 pb-10 pt-8 sm:px-6 lg:min-h-[640px] lg:border-b-0 lg:px-0 lg:py-4">
      <p className="eyebrow text-[var(--muted)]">HRUSHE</p>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="max-w-[20ch] text-[1.5rem] font-medium leading-[1.12] tracking-[-0.025em] text-[var(--foreground)] lg:text-[2rem]">
            {displayName}
          </h2>
          <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-[1.05rem] font-semibold leading-none text-[var(--foreground)]">
              {priceText}
            </p>
            {hasDiscount ? (
              <p className="text-[0.82rem] leading-none text-[var(--muted)] line-through decoration-[1.5px]">
                {compareAtPriceText}
              </p>
            ) : null}
          </div>
        </div>
        <WishlistButton
          productId={product.id}
          label={`Add ${displayName} to wishlist`}
          className="inline-flex h-11 w-11 items-center justify-center border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]"
          iconClassName="h-4 w-4"
        />
      </div>
      <p className="mt-4 text-[0.74rem] tracking-[0.04em] text-[var(--muted)]">
        MRP incl. of all taxes
      </p>
      {description ? (
        <p className="mt-8 max-w-[31rem] text-[0.92rem] leading-7 text-[var(--muted)]">
          {description}
        </p>
      ) : null}
      {getProductFabricLine(product) || getProductFitLine(product) ? (
        <div className="mt-8 grid grid-cols-2 border-y border-[var(--border)] py-5 text-[0.7rem] uppercase tracking-[0.1em] text-[var(--muted)]">
          <p>{getProductFabricLine(product)}</p>
          <p className="text-right">{getProductFitLine(product)}</p>
        </div>
      ) : null}

      {colorProducts.length > 0 ? (
        <div className="mt-8">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
            Colour: {selectedColor || product.colors[0]}
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {colorProducts.map((colorProduct) => {
              const color = colorProduct.colors[0];
              const active = colorProduct.id === product.id;
              const swatchClassName = `relative inline-flex h-[68px] w-[52px] overflow-hidden border transition ${
                active
                  ? "border-[var(--foreground)]"
                  : "border-[var(--border)] hover:border-[var(--foreground)]"
              }`;
              const colourImage = colorProduct.images[0];
              const swatchStyle = colourImage
                ? undefined
                : { backgroundColor: resolveSwatchColor(color, colorProduct.accent) };
              const swatchContent = colourImage ? (
                <Image
                  src={colourImage}
                  alt=""
                  fill
                  unoptimized={shouldBypassImageOptimization(colourImage)}
                  sizes="52px"
                  className="object-cover"
                />
              ) : null;

              if (active) {
                return (
                  <button
                    key={colorProduct.id}
                    type="button"
                    onClick={() => onColorSelect(color)}
                    aria-label={`${color} selected`}
                    aria-pressed="true"
                    className={swatchClassName}
                    style={swatchStyle}
                  >
                    {swatchContent}
                  </button>
                );
              }

              return (
                <Link
                  key={colorProduct.id}
                  href={`/product/${colorProduct.slug || colorProduct.id}`}
                  aria-label={`View ${color}`}
                  className={swatchClassName}
                  style={swatchStyle}
                >
                  {swatchContent}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      {requiresSize ? (
        <div className="mt-6">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">Size</p>
            {product.sizeGuide?.length ? (
              <button
                type="button"
                onClick={onOpenSizeGuide}
                className="min-h-11 text-[0.68rem] font-medium uppercase tracking-[0.1em] underline underline-offset-4"
              >
                Size guide
              </button>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.sizes.map((size) => {
              const active = selectedSize === size;
              const available =
                !product.trackInventory ||
                product.variants?.some(
                  (variant) =>
                    variant.active &&
                    variant.stock > 0 &&
                    variant.size.toLowerCase() === size.toLowerCase() &&
                    (!selectedColor || variant.color.toLowerCase() === selectedColor.toLowerCase())
                );

              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => available && onSizeSelect(size)}
                  disabled={!available}
                  className={`inline-flex min-h-12 min-w-12 items-center justify-center border px-3 text-[0.72rem] font-semibold uppercase transition ${
                    active
                      ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                      : available
                        ? "border-[rgba(17,17,17,0.16)] bg-[var(--surface)] text-[var(--foreground)]"
                        : "cursor-not-allowed border-[rgba(17,17,17,0.08)] bg-[var(--surface)] text-[var(--muted)] line-through opacity-45"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
          {product.modelHeight || product.modelWornSize ? (
            <p className="mt-4 text-xs leading-6 text-[var(--muted)]">
              {[product.modelHeight ? `Model height ${product.modelHeight}` : "", product.modelWornSize ? `Wears size ${product.modelWornSize}` : ""].filter(Boolean).join(" · ")}
            </p>
          ) : product.sizeGuide?.length ? (
            <p className="mt-4 text-xs leading-6 text-[var(--muted)]">Compare the garment measurements before ordering.</p>
          ) : null}
        </div>
      ) : null}

      <div ref={actionRef} className="mt-7 space-y-4 lg:mt-auto lg:pt-8">
        <button
          type="button"
          onClick={onAddToCart}
          disabled={requiresSize ? Boolean(selectedSize) && !canAddToCart : !canAddToCart}
          className="inline-flex min-h-12 w-full items-center justify-center bg-[var(--foreground)] px-6 text-[0.76rem] font-semibold uppercase tracking-[0.1em] text-[var(--background)] transition hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-55"
        >
          {requiresSize && !selectedSize ? "Select a size" : `Add to bag — ${priceText}`}
        </button>
        {addError ? <p className="text-sm text-[var(--accent)]">{addError}</p> : null}
        <ServicePromise compact />
      </div>
    </div>
  );
}
export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const { products, addProductReview, loading } = useStorefrontData();
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
  const [selectedColor, setSelectedColor] = useState(
    matchedProduct?.colors[0] || ""
  );
  const [selectedSize, setSelectedSize] = useState("");
  const [addError, setAddError] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [reviewQuote, setReviewQuote] = useState("");
  const [reviewRating, setReviewRating] = useState("5");
  const [reviewError, setReviewError] = useState("");
  const [reviewSaved, setReviewSaved] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const mainAddToCartRef = useRef<HTMLDivElement>(null);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [showStickyAddToCart, setShowStickyAddToCart] = useState(false);
  const [openSection, setOpenSection] =
    useState<(typeof productInfoSections)[number]["key"] | null>("description");

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
    setSelectedColor(product.colors[0] || "");
    setSelectedSize("");
    setAddError("");
  }, [product]);

  useEffect(() => {
    if (reviewSaved) {
      const timerId = window.setTimeout(() => setReviewSaved(false), 2000);
      return () => window.clearTimeout(timerId);
    }
  }, [reviewSaved]);

  useEffect(() => {
    const actionElement = mainAddToCartRef.current;

    if (!actionElement) {
      setShowStickyAddToCart(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyAddToCart(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0.15 }
    );

    observer.observe(actionElement);

    return () => observer.disconnect();
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
          <div className="mt-8 border border-[rgba(17,17,17,0.08)] bg-[var(--surface)] px-6 py-8 sm:px-8">
            <h1 className="text-[2rem] font-medium uppercase tracking-[-0.05em] text-[var(--foreground)]">
              Product not found
            </h1>
            <p className="mt-3 max-w-xl text-[var(--muted)]">
              This product is no longer available or the link may be incorrect.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex min-h-11 items-center border border-[var(--foreground)] px-5 text-[0.82rem] font-medium uppercase tracking-[0.14em] text-[var(--foreground)]"
            >
              Back to shop
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const mediaItems = buildProductMediaItems(product);
  const activeMedia = mediaItems[activeMediaIndex] || mediaItems[0] || null;
  const requiresSize = product.sizes.length > 0;
  const effectiveColor = selectedColor || product.colors[0] || "";
  const selectedVariantAvailable =
    !product.trackInventory ||
    product.variants?.some(
      (variant) =>
        variant.active &&
        variant.stock > 0 &&
        variant.size.toLowerCase() === selectedSize.toLowerCase() &&
        (!effectiveColor || variant.color.toLowerCase() === effectiveColor.toLowerCase())
    );
  const canAddToCart =
    (!requiresSize || Boolean(selectedSize)) && Boolean(selectedVariantAvailable);
  const relatedProducts = products
    .filter(
      (item) =>
        item.id !== product.id &&
        (item.category === product.category || item.featured)
    )
    .slice(0, 4);
  const siblingProducts = products.filter(
    (item) => item.id !== product.id && item.category === product.category
  );
  const reviews = (product.reviews || []).filter(
    (review) =>
      review.verifiedPurchase === true &&
      review.status !== "pending" &&
      review.status !== "rejected" &&
      review.status !== "hidden" &&
      !/hrushabh|kshitij/i.test(review.reviewerName)
  );
  const compareAtPrice = Number(product.compareAtPrice) > product.price ? Number(product.compareAtPrice) : 0;
  const hasDiscount = compareAtPrice > product.price;
  const priceText = `₹${product.price.toLocaleString("en-IN")}`;
  const compareAtPriceText = compareAtPrice ? `₹${compareAtPrice.toLocaleString("en-IN")}` : "";
  const productSummary = getProductSummary(product.description);
  const detailRows = getProductDetailRows(product);
  const washCare = getWashCare(product);
  const hasMultipleMedia = mediaItems.length > 1;

  const showPreviousMedia = () => {
    if (!hasMultipleMedia) {
      return;
    }

    setActiveMediaIndex((current) => (current - 1 + mediaItems.length) % mediaItems.length);
  };

  const showNextMedia = () => {
    if (!hasMultipleMedia) {
      return;
    }

    setActiveMediaIndex((current) => (current + 1) % mediaItems.length);
  };

  const handleSwipeStart = (event: React.PointerEvent<HTMLElement>) => {
    if (!hasMultipleMedia || event.button !== 0) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    swipeStartRef.current = { x: event.clientX, y: event.clientY };
  };

  const handleSwipeEnd = (event: React.PointerEvent<HTMLElement>) => {
    if (!hasMultipleMedia || !swipeStartRef.current) {
      swipeStartRef.current = null;
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const deltaX = event.clientX - swipeStartRef.current.x;
    const deltaY = event.clientY - swipeStartRef.current.y;
    swipeStartRef.current = null;

    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY) * 1.15) {
      return;
    }

    if (deltaX < 0) {
      showNextMedia();
      return;
    }

    showPreviousMedia();
  };

  const onReviewSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReviewSubmitting(true);
    setReviewError("");

    try {
      await addProductReview(product.id, {
        reviewerName,
        quote: reviewQuote,
        rating: Number(reviewRating),
        photo: "",
      });
      setReviewerName("");
      setReviewQuote("");
      setReviewRating("5");
      setReviewSaved(true);
    } catch (error) {
      setReviewError(
        error instanceof Error ? error.message : "Could not save your review."
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleAddToCart = () => {
    if (requiresSize && !selectedSize) {
      const message = "Please select a size before adding to cart.";
      setAddError(message);
      pushToast(message, "error");
      return;
    }

    if (!canAddToCart) {
      const message = "This selection is currently unavailable.";
      setAddError(message);
      pushToast(message, "error");
      return;
    }

    addItem({
      productId: product.id,
      name: getProductDisplayName(product),
      price: product.price,
      size: selectedSize,
      color: effectiveColor,
      quantity: 1,
      accent: product.accent,
      image: product.images[0],
    });
    setAddError("");
    pushToast(`${getProductDisplayName(product)} added to bag`);
    openCart();
  };

  return (
    <div className="page-shell bg-[var(--background)]">
      <SiteHeader />
      <main className="mx-auto w-full pb-28 lg:max-w-[1440px] lg:px-8 lg:pb-24 lg:pt-12 xl:pt-16">
        <h1 className="sr-only">{product.name}</h1>
        <div className="px-4 py-4 sm:px-6 lg:px-0 lg:pb-8 lg:pt-0">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: product.category || "Shop", href: product.category ? `/collection/${product.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` : "/shop" },
              { label: getProductDisplayName(product) },
            ]}
          />
        </div>
        <div className="lg:mx-auto lg:grid lg:max-w-[1440px] lg:grid-cols-[minmax(0,1.45fr)_minmax(380px,0.85fr)] lg:items-start lg:gap-12 xl:gap-16">
          <section aria-label="Product media gallery">
            <div
              className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--surface-strong)] lg:border"
              onPointerDown={handleSwipeStart}
              onPointerUp={handleSwipeEnd}
              onPointerCancel={() => {
                swipeStartRef.current = null;
              }}
              style={{ touchAction: "pan-y" }}
            >
              <div className="relative aspect-[4/5]">
                <ProductMediaFrame
                  item={activeMedia}
                  product={product}
                  imageClassName="object-cover object-center"
                  onVideoEnded={showNextMedia}
                />
              </div>
              {hasMultipleMedia ? (
                <div className="absolute inset-x-4 bottom-4 flex items-center justify-between">
                  <button type="button" onClick={showPreviousMedia} className="flex h-12 w-12 items-center justify-center border border-white/60 bg-white text-lg text-black" aria-label="Previous product media">←</button>
                  <p className="bg-white px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-black">{activeMediaIndex + 1} / {mediaItems.length}</p>
                  <button type="button" onClick={showNextMedia} className="flex h-12 w-12 items-center justify-center border border-white/60 bg-white text-lg text-black" aria-label="Next product media">→</button>
                </div>
              ) : null}
            </div>
            {hasMultipleMedia ? (
              <>
              <div className="flex items-center justify-center px-4 py-1 lg:hidden" aria-label="Choose product image">
                {mediaItems.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveMediaIndex(index)}
                    aria-label={`Show ${item.type} ${index + 1}`}
                    aria-pressed={activeMediaIndex === index}
                    className="flex h-11 w-11 items-center justify-center"
                  >
                    <span className={`block h-1 w-5 transition ${activeMediaIndex === index ? "bg-[var(--foreground)]" : "bg-[var(--border)]"}`} />
                  </button>
                ))}
              </div>
              <div className="hidden grid-cols-5 gap-2 pt-3 lg:grid">
                {mediaItems.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveMediaIndex(index)}
                    aria-label={`Show ${item.type} ${index + 1}`}
                    aria-pressed={activeMediaIndex === index}
                    className={`relative aspect-[4/5] overflow-hidden border ${activeMediaIndex === index ? "border-[var(--foreground)]" : "border-[var(--border)]"}`}
                  >
                    {item.type === "image" ? <Image src={item.src} alt="" fill sizes="120px" className="object-cover" /> : <span className="flex h-full items-center justify-center bg-black text-[0.6rem] uppercase tracking-[0.12em] text-white">Video</span>}
                  </button>
                ))}
              </div>
              </>
            ) : null}
          </section>

          <section aria-label="Product details and purchase options" className="lg:sticky lg:top-28">
            <ProductInfoPanel
              product={product}
              siblingProducts={siblingProducts}
              priceText={priceText}
              compareAtPriceText={compareAtPriceText}
              hasDiscount={hasDiscount}
              description={productSummary}
              selectedColor={selectedColor}
              selectedSize={selectedSize}
              addError={addError}
              requiresSize={requiresSize}
              canAddToCart={canAddToCart}
              onColorSelect={(color) => {
                setSelectedColor(color);
                setSelectedSize("");
                setAddError("");
              }}
              onSizeSelect={(size) => {
                setSelectedSize(size);
                setAddError("");
              }}
              onAddToCart={handleAddToCart}
              onOpenSizeGuide={() => setSizeGuideOpen(true)}
              actionRef={mainAddToCartRef}
            />
          </section>
        </div>

        <section className="mt-12 border-t border-[rgba(17,17,17,0.08)] px-5 pt-8 sm:mt-14 sm:px-6 lg:px-0 lg:pt-10">
          <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
            <div>
              {productInfoSections.map((section) => {
                const isOpen = openSection === section.key;

                return (
                  <div
                    key={section.key}
                    className="border-b border-[rgba(17,17,17,0.08)]"
                  >
                    <button
                      type="button"
                      id={`product-section-${section.key}-trigger`}
                      aria-expanded={isOpen}
                      aria-controls={`product-section-${section.key}-panel`}
                      onClick={() =>
                        setOpenSection((current) =>
                          current === section.key ? null : section.key
                        )
                      }
                      className="flex w-full items-center justify-between py-4 text-left"
                    >
                      <span className="text-[1.02rem] font-medium tracking-[0.01em] text-[var(--foreground)]">
                        {section.title}
                      </span>
                      <span className="text-2xl leading-none text-[var(--muted)]">
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>
                    {isOpen ? (
                      <div
                        id={`product-section-${section.key}-panel`}
                        role="region"
                        aria-labelledby={`product-section-${section.key}-trigger`}
                        className="pb-5 text-sm leading-7 text-[var(--muted)]"
                      >
                        {section.key === "description" ? (
                          <div className="space-y-3">
                            <p>{product.description}</p>
                            {product.variants?.find((variant) => variant.sku)?.sku ? (
                              <p>SKU: {product.variants.find((variant) => variant.sku)?.sku}</p>
                            ) : null}
                          </div>
                        ) : null}
                        {section.key === "fabric" ? (
                          <div className="grid gap-3 sm:grid-cols-2">
                            {detailRows.map((item) => (
                              <div
                                key={item.label}
                                className="border border-[rgba(17,17,17,0.08)] bg-[rgba(255,255,255,0.55)] px-4 py-3"
                              >
                                <p className="text-[0.64rem] uppercase tracking-[0.16em] text-[var(--muted)]">
                                  {item.label}
                                </p>
                                <p className="mt-1 font-medium text-[var(--foreground)]">
                                  {item.value}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : null}
                        {section.key === "wash" ? (
                          <p>{washCare || "Care instructions have not been added yet."}</p>
                        ) : null}
                        {section.key === "size" ? (
                          <div className="space-y-4">
                            {getProductFit(product) ? <p>{getProductFit(product)}</p> : null}
                            {product.modelHeight || product.modelWornSize ? (
                              <p>
                                {[
                                  product.modelHeight ? `Model height ${product.modelHeight}` : "",
                                  product.modelWornSize ? `Wears size ${product.modelWornSize}` : "",
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            ) : null}
                            {product.sizeGuide?.length ? (
                              <>
                                <p>Garment measurements in inches.</p>
                                <SizeGuideTable rows={product.sizeGuide} />
                              </>
                            ) : (
                              <p>Garment measurements have not been added yet.</p>
                            )}
                          </div>
                        ) : null}
                        {section.key === "delivery" ? (
                          <div className="space-y-4">
                            <p>
                              Orders are dispatched within 1–3 business days. Delivery time depends on the destination and courier service.
                            </p>
                            <p>
                              {product.returnEligible
                                ? "This item is eligible for return within 7 days of delivery and one size exchange at no charge."
                                : "Return eligibility has not been specified for this item. Contact support before ordering if you need confirmation."}
                            </p>
                            <ServicePromise />
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="border border-[rgba(17,17,17,0.08)] bg-[rgba(255,255,255,0.72)] px-5 py-6 sm:px-6 sm:py-7">
              <p className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--muted)]">
                Product reviews
              </p>
              <h2 className="mt-3 text-[1.7rem] font-medium uppercase leading-[1.08] tracking-[-0.05em] text-[var(--foreground)]">
                Verified customer reviews.
              </h2>
              <div className="mt-6 space-y-4">
                {reviews.length > 0 ? (
                  reviews.slice(0, 4).map((review, index) => (
                    <div
                      key={`${review.reviewerName}-${index}`}
                      className="border border-[rgba(17,17,17,0.08)] bg-[var(--surface)] p-4"
                    >
                      <div className="flex gap-4">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-[#ece7df]">
                          {review.photo ? (
                            <Image
                              src={review.photo}
                              alt={review.reviewerName}
                              fill
                              unoptimized={shouldBypassImageOptimization(review.photo)}
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-[var(--muted)]">
                              {review.reviewerName.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-base leading-7 text-[var(--foreground)]">
                            &ldquo;{review.quote}&rdquo;
                          </p>
                          <p className="mt-4 font-semibold">{review.reviewerName}</p>
                          <p className="mt-1 text-sm text-[var(--muted)]">
                            {"★".repeat(review.rating || 5)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="border border-[rgba(17,17,17,0.08)] bg-[var(--surface)] p-5 text-sm text-[var(--muted)]">
                    No verified reviews yet.
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setReviewFormOpen((current) => !current)}
                className="button-secondary mt-8 inline-flex items-center justify-center px-6 text-[0.68rem] font-semibold uppercase tracking-[0.1em]"
              >
                {reviewFormOpen ? "Close review form" : "Write a review"}
              </button>
              <form
                className={`${reviewFormOpen ? "grid" : "hidden"} mt-8 gap-5 border-t border-[var(--border)] pt-6`}
                onSubmit={(event) => void onReviewSubmit(event)}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
                    Your name
                    <input
                      value={reviewerName}
                      onChange={(event) => setReviewerName(event.target.value)}
                      className="min-h-12 border border-[rgba(17,17,17,0.08)] bg-[var(--surface)] px-4 py-3 text-base font-normal normal-case tracking-normal text-[var(--foreground)]"
                      autoComplete="name"
                      required
                    />
                  </label>
                  <div className="border border-[rgba(17,17,17,0.08)] bg-[var(--surface)] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                      Rating
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((value) => {
                        const active = value <= Number(reviewRating);

                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setReviewRating(String(value))}
                            className={`text-xl transition ${
                              active ? "text-[var(--accent)]" : "text-black/20"
                            }`}
                            aria-label={`Rate ${value} star${value === 1 ? "" : "s"}`}
                          >
                            ★
                          </button>
                        );
                      })}
                      <span className="ml-2 text-sm text-[var(--muted)]">
                        {reviewRating}/5
                      </span>
                    </div>
                  </div>
                </div>

                <label className="grid gap-2 text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
                  Your review
                  <textarea
                    value={reviewQuote}
                    onChange={(event) => setReviewQuote(event.target.value)}
                    className="min-h-36 border border-[rgba(17,17,17,0.08)] bg-[var(--surface)] px-4 py-3 text-base font-normal normal-case tracking-normal text-[var(--foreground)]"
                    placeholder="Tell us about the fit, fabric, and overall feel."
                    required
                  />
                </label>

                {reviewError ? (
                  <p className="text-sm text-[var(--accent)]">{reviewError}</p>
                ) : null}

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="inline-flex min-h-11 items-center justify-center bg-[var(--foreground)] px-6 text-[0.82rem] font-medium uppercase tracking-[0.14em] text-[var(--background)] transition disabled:opacity-60"
                  >
                    {reviewSubmitting
                      ? "Submitting..."
                      : reviewSaved
                        ? "Review submitted"
                        : "Submit review"}
                  </button>
                  <p className="text-sm text-[var(--muted)]">
                    Only verified purchases are published after moderation.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </section>

        <section className="mt-12 px-5 sm:mt-14 sm:px-6 lg:px-0">
          <p className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--muted)]">
            Related products
          </p>
          <h2 className="mt-3 text-[1.7rem] font-medium uppercase leading-[1.08] tracking-[-0.05em] text-[var(--foreground)]">
            More from the current edit.
          </h2>
          <div className="product-row-scroll -mx-5 mt-6 flex gap-3 overflow-x-auto px-5 pb-3 sm:-mx-6 sm:mt-8 sm:px-6 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-4 xl:gap-6">
            {relatedProducts.map((item) => (
              <div key={item.id} className="min-w-[72vw] sm:min-w-[44vw] md:min-w-0">
                <ProductCard product={item} />
              </div>
            ))}
          </div>
        </section>
      </main>

      {showStickyAddToCart ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--border)] bg-[var(--background)] px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 lg:hidden">
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[0.92rem] font-semibold text-[var(--foreground)]">
                {priceText}
              </p>
              <p className="mt-0.5 truncate text-[0.68rem] uppercase tracking-[0.12em] text-[var(--muted)]">
                {requiresSize
                  ? selectedSize
                    ? `Size ${selectedSize} selected`
                    : "Select size"
                  : "Ready to add"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={requiresSize ? Boolean(selectedSize) && !canAddToCart : !canAddToCart}
              className="inline-flex min-h-12 min-w-[176px] items-center justify-center bg-[var(--foreground)] px-5 text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-[var(--background)] transition disabled:cursor-not-allowed disabled:opacity-55"
            >
              {requiresSize && !selectedSize ? "Select a size" : `Add to bag — ${priceText}`}
            </button>
          </div>
        </div>
      ) : null}

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
