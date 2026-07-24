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
  getProductFitLine,
} from "@/lib/product-presentation";

const productInfoSections = [
  {
    key: "details",
    title: "Product Details",
  },
  {
    key: "faqs",
    title: "Product FAQs",
  },
  {
    key: "shipping",
    title: "Shipping & Returns",
  },
] as const;

const swatchColors: Record<string, string> = {
  black: "#111111",
  white: "#ffffff",
  offwhite: "#ffffff",
  "off white": "#ffffff",
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
    accent: product.accent || "#f6f6f6",
    imageLabel: product.imageLabel || product.name || "Product image",
  };
}

function resolveSwatchColor(color: string, accent: string) {
  return swatchColors[color.toLowerCase().trim()] || accent || "#d9d9d9";
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

type ProductInfoPanelProps = {
  product: Product;
  siblingProducts: Product[];
  priceText: string;
  compareAtPriceText: string;
  hasDiscount: boolean;
  reviewCount: number;
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
  reviewCount,
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
  const [openPanel, setOpenPanel] =
    useState<(typeof productInfoSections)[number]["key"] | null>("details");
  const displayName = getProductDisplayName(product);
  const soldOut = product.status === "Sold Out" || product.availability === "sold-out";
  const fitLabel = getProductFit(product) || getProductFitLine(product) || "Regular fit";
  const detailRows = getProductDetailRows(product);
  const washCare = getWashCare(product);
  const modelNote = [
    product.modelHeight ? `Model is ${product.modelHeight}` : "",
    product.modelWornSize ? `wearing size ${product.modelWornSize}` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const colorProducts = [product, ...siblingProducts].filter(
    (item, index, items) =>
      Boolean(item.colors[0]) &&
      items.findIndex(
        (candidate) =>
          candidate.colors[0]?.toLowerCase() === item.colors[0]?.toLowerCase()
      ) === index
  );

  return (
    <div className="flex min-h-full flex-col bg-[var(--background)] px-4 py-6 sm:px-6 lg:min-h-[calc(100vh-8rem)] lg:px-[clamp(2.5rem,6vw,7rem)] lg:py-[clamp(2.25rem,4.5vw,4.75rem)]">
      <div className="flex items-start justify-between gap-6 border-b border-[var(--border)] pb-5 leading-tight text-[var(--foreground)]">
        <h2 className="max-w-[24ch] text-[1.35rem] font-semibold tracking-[-0.03em] sm:text-[1.6rem]">
          {displayName}
        </h2>
        <div className="shrink-0 text-right">
          {hasDiscount ? (
            <p className="mb-1 text-[0.82rem] text-[var(--muted)] line-through decoration-[1.5px]">
              {compareAtPriceText}
            </p>
          ) : null}
          <p className={`text-[1.15rem] font-semibold ${hasDiscount ? "text-[var(--accent)]" : ""}`}>
            {priceText}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 border-b border-[var(--border)] pb-5 sm:grid-cols-2">
        <div className="flex min-h-11 items-center gap-3 text-[0.82rem] leading-none">
          <span aria-label="5 star rating" className="tracking-[0.08em] text-[var(--foreground)]">
            ★★★★★
          </span>
          <span className="text-[var(--muted)] underline underline-offset-2">
            {reviewCount > 0
              ? `${reviewCount} ${reviewCount === 1 ? "Review" : "Reviews"}`
              : "No reviews yet"}
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenSizeGuide}
          className="inline-flex min-h-11 items-center justify-start gap-2 border border-[var(--border)] px-3 text-left text-[0.86rem] font-semibold text-[var(--foreground)] sm:justify-center"
        >
          <span aria-hidden="true">ⓘ</span>
          <span>Sizing &amp; Fit</span>
          <span className="font-medium">{fitLabel}</span>
        </button>
      </div>

      {colorProducts.length > 0 ? (
        <div className="mt-6 border-b border-[var(--border)] pb-6">
          <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
            <p className="flex items-baseline gap-3 text-[0.9rem] text-[var(--muted)]">
              <span className="font-semibold text-[var(--foreground)]">
                Colour
                <sup className="ml-1 text-[0.55rem] text-[var(--muted)]">
                  {colorProducts.length}
                </sup>
              </span>
              <span>{selectedColor || product.colors[0]}</span>
            </p>
            <div className="flex w-full items-center gap-2 text-[0.82rem] font-medium text-[var(--muted)] sm:w-auto sm:justify-end">
              <span>Save</span>
              <WishlistButton
                productId={product.id}
                label={`Save ${displayName}`}
                className="inline-flex h-10 w-10 items-center justify-center border border-[var(--border)] text-[var(--foreground)]"
                iconClassName="h-4 w-4"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {colorProducts.map((colorProduct) => {
              const color = colorProduct.colors[0];
              const active = colorProduct.id === product.id;
              const swatchClassName = `relative inline-flex h-20 w-20 overflow-hidden border border-[var(--border)] bg-[var(--surface-strong)] transition ${
                active
                  ? "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[var(--foreground)]"
                  : "hover:after:absolute hover:after:inset-x-0 hover:after:bottom-0 hover:after:h-0.5 hover:after:bg-[var(--foreground)]"
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
                  priority={active}
                  loading={active ? "eager" : "lazy"}
                  unoptimized={shouldBypassImageOptimization(colourImage)}
                  sizes="72px"
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
        <div className="mt-6 border-b border-[var(--border)] pb-6">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <p className="flex items-center gap-3 text-[0.9rem] text-[var(--muted)]">
              <span className="font-semibold text-[var(--foreground)]">Size</span>
              {selectedSize ? <span>{selectedSize}</span> : null}
              <span className={soldOut ? "text-[var(--accent)]" : "text-green-700"}>
                {soldOut ? "Sold Out" : "In Stock"}
              </span>
            </p>
            <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 text-[0.82rem] font-medium sm:w-auto sm:justify-end">
              <button
                type="button"
                onClick={onOpenSizeGuide}
                className="underline underline-offset-4"
              >
                Find your size
              </button>
              {product.sizeGuide?.length ? (
                <button
                  type="button"
                  onClick={onOpenSizeGuide}
                  className="text-[var(--muted)] underline underline-offset-4"
                >
                  Size Chart
                </button>
              ) : null}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
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
                  aria-pressed={active}
                  aria-label={`${size}${available ? "" : " — unavailable"}`}
                  className={`inline-flex min-h-12 items-center justify-center border px-3 text-[0.82rem] font-medium uppercase transition ${
                    active
                      ? "hrushe-inverse-action"
                      : available
                        ? "border-transparent bg-[#f6f6f6] text-[var(--foreground)] hover:border-[var(--foreground)]"
                        : "cursor-not-allowed border-transparent bg-[#f6f6f6] text-[var(--muted)] line-through opacity-45"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div ref={actionRef} className="mt-6 space-y-4">
        <button
          type="button"
          onClick={onAddToCart}
          disabled={soldOut || (requiresSize ? Boolean(selectedSize) && !canAddToCart : !canAddToCart)}
          className="hrushe-inverse-action inline-flex min-h-[3.75rem] w-full items-center justify-center px-6 text-[0.82rem] font-bold uppercase tracking-[0.08em] transition hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-55"
        >
          {soldOut ? "Currently unavailable" : requiresSize && !selectedSize ? "Select a size" : `Add to bag — ${priceText}`}
        </button>
        {addError ? <p className="text-sm text-[var(--accent)]" role="alert">{addError}</p> : null}
        <div className="grid gap-2 text-[0.86rem] font-medium sm:grid-cols-2">
          <div className="flex min-h-12 items-center justify-between border border-[var(--border)] px-4">
            <span>{product.returnEligible ? "Free size exchange" : "Free shipping on prepaid orders"}</span>
            <span aria-hidden="true">›</span>
          </div>
          <div className="flex min-h-12 items-center justify-between border border-[var(--border)] px-4">
            <span>Dispatches in 1–3 business days</span>
            <span aria-hidden="true">›</span>
          </div>
        </div>
      </div>

      <div className="mt-7 border-t border-[var(--border)]">
        {productInfoSections.map((section) => {
          const isOpen = openPanel === section.key;

          return (
            <div key={section.key} className="border-b border-[var(--border)]">
              <button
                type="button"
                onClick={() =>
                  setOpenPanel((current) => (current === section.key ? null : section.key))
                }
                className="flex w-full items-center justify-between gap-6 py-4 text-left text-[0.88rem] font-semibold"
                aria-expanded={isOpen}
              >
                <span>{section.title}</span>
                <span className="text-lg leading-none" aria-hidden="true">
                  {isOpen ? "-" : "+"}
                </span>
              </button>

              {isOpen ? (
                <div className="pb-5 text-[0.86rem] leading-7 text-[var(--muted)]">
                  {section.key === "details" ? (
                    <div className="space-y-4">
                      {product.description ? <p>{product.description}</p> : null}
                      {modelNote ? <p>{modelNote}</p> : null}
                      {detailRows.length > 0 ? (
                        <dl className="grid gap-2 sm:grid-cols-2">
                          {detailRows.map((item) => (
                            <div key={item.label} className="flex gap-2">
                              <dt className="font-semibold text-[var(--foreground)]">{item.label}:</dt>
                              <dd>{item.value}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : null}
                      {washCare ? <p>{washCare}</p> : null}
                    </div>
                  ) : null}
                  {section.key === "faqs" ? (
                    <p>
                      Need help with fit or fabric? Message HRUSHE support and we will help you choose the right size before checkout.
                    </p>
                  ) : null}
                  {section.key === "shipping" ? (
                    <p>
                      Orders dispatch within 1–3 business days. One size exchange is available when eligible, and returns follow the product return policy.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
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
  const [selectedColor, setSelectedColor] = useState(
    matchedProduct?.colors[0] || ""
  );
  const [selectedSize, setSelectedSize] = useState("");
  const [addError, setAddError] = useState("");
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const mainAddToCartRef = useRef<HTMLDivElement>(null);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [showStickyAddToCart, setShowStickyAddToCart] = useState(false);

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
  const hasMultipleMedia = mediaItems.length > 1;
  const productUnavailable = product.status === "Sold Out" || product.availability === "sold-out";

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
      <main className="w-full pb-20 lg:pb-0">
        <h1 className="sr-only">{product.name}</h1>
        <div className="lg:grid lg:grid-cols-[minmax(0,50.5vw)_minmax(420px,1fr)] lg:items-start">
          <section aria-label="Product media gallery">
            <div
              className="relative overflow-hidden bg-[#f7f7f7] lg:h-[calc(100vh-7rem)] lg:min-h-[560px] lg:max-h-[760px]"
              onPointerDown={handleSwipeStart}
              onPointerUp={handleSwipeEnd}
              onPointerCancel={() => {
                swipeStartRef.current = null;
              }}
              style={{ touchAction: "pan-y" }}
            >
              <div className="relative aspect-[4/5] lg:h-full lg:aspect-auto">
                <ProductMediaFrame
                  item={activeMedia}
                  product={product}
                  imageClassName="object-contain object-center lg:object-cover"
                  onVideoEnded={showNextMedia}
                />
              </div>
              {hasMultipleMedia ? (
                <>
                  <button
                    type="button"
                    onClick={showPreviousMedia}
                    className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center text-3xl font-light text-[var(--foreground)]"
                    aria-label="Previous product media"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={showNextMedia}
                    className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center text-3xl font-light text-[var(--foreground)]"
                    aria-label="Next product media"
                  >
                    ›
                  </button>
                </>
              ) : null}
              <div className="absolute bottom-5 left-5 flex max-w-[80%] items-center gap-2 text-[0.78rem] font-medium text-[var(--muted)]">
                <span className="bg-white px-3 py-2 text-[var(--foreground)]">
                  {activeMediaIndex + 1} / {Math.max(mediaItems.length, 1)}
                </span>
                <span className="hidden bg-white px-3 py-2 sm:inline">
                  {product.modelHeight || product.modelWornSize
                    ? [
                        product.modelHeight ? `Model is ${product.modelHeight}` : "",
                        product.modelWornSize ? `wearing size ${product.modelWornSize}` : "",
                      ]
                        .filter(Boolean)
                        .join(" ")
                    : "Product gallery"}
                </span>
              </div>
              <button
                type="button"
                onClick={showNextMedia}
                className="absolute bottom-5 right-5 flex h-11 w-11 items-center justify-center text-2xl leading-none text-[var(--foreground)]"
                aria-label="Expand product media"
              >
                ⛶
              </button>
            </div>
          </section>

          <section aria-label="Product details and purchase options" className="lg:sticky lg:top-[7rem]">
            <ProductInfoPanel
              product={product}
              siblingProducts={siblingProducts}
              priceText={priceText}
              compareAtPriceText={compareAtPriceText}
              hasDiscount={hasDiscount}
              reviewCount={reviews.length}
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

        {mediaItems.length > 1 ? (
          <section
            className="hide-scrollbar flex snap-x snap-mandatory gap-0 overflow-x-auto overscroll-x-contain bg-[#f7f7f7]"
            aria-label="Product detail gallery"
          >
            {mediaItems.slice(1).map((item) => (
              <div
                key={item.id}
                className="relative h-[52svh] min-h-[360px] w-[86vw] flex-none snap-start overflow-hidden bg-[#f7f7f7] sm:w-[70vw] lg:h-[calc(100vh-8rem)] lg:min-h-[560px] lg:max-h-[760px] lg:w-[33.333333vw]"
              >
                {item.type === "image" ? (
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    loading="lazy"
                    unoptimized={shouldBypassImageOptimization(item.src)}
                    sizes="(max-width: 640px) 86vw, (max-width: 1024px) 70vw, (max-width: 1280px) 42vw, 34vw"
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
          <section className="border-t border-[var(--border)] bg-[var(--background)] py-14 lg:py-16">
            <h2 className="text-center text-[0.86rem] font-bold uppercase tracking-[0.04em]">
              Style With
            </h2>
            <div className="collection-plp__grid collection-plp__grid--editorial mt-10">
              {relatedProducts.map((item) => (
                <ProductCard key={item.id} product={item} variant="editorial" />
              ))}
            </div>
          </section>
        ) : null}
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
              disabled={productUnavailable || (requiresSize ? Boolean(selectedSize) && !canAddToCart : !canAddToCart)}
              className="hrushe-inverse-action inline-flex min-h-12 min-w-[176px] items-center justify-center px-5 text-[0.72rem] font-semibold uppercase tracking-[0.1em] transition disabled:cursor-not-allowed disabled:opacity-55"
            >
              {productUnavailable ? "Unavailable" : requiresSize && !selectedSize ? "Select a size" : `Add to bag — ${priceText}`}
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
