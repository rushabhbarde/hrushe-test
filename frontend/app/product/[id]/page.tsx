"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { LoadingState } from "@/components/loading-state";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WishlistButton } from "@/components/wishlist-button";
import { useCart } from "@/components/cart-provider";
import { useToast } from "@/components/toast-provider";
import { apiRequest } from "@/lib/api";
import type { Product } from "@/lib/catalog";
import { getCompareAtPrice, getDiscountPercent } from "@/lib/pricing";
import { useStorefrontData } from "@/lib/use-storefront";

const productInfoSections = [
  {
    key: "description",
    title: "Description & fit",
  },
  {
    key: "materials",
    title: "Materials",
  },
  {
    key: "delivery",
    title: "Delivery, Payment and Returns",
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
    name: product.name || "Untitled product",
    slug: product.slug || product.id,
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
    images: Array.isArray(product.images) ? product.images.filter(Boolean) : [],
    galleryImages: Array.isArray(product.galleryImages)
      ? product.galleryImages.filter(Boolean)
      : [],
    videos: Array.isArray(product.videos)
      ? product.videos.filter((video) => video?.url)
      : [],
    reviews: Array.isArray(product.reviews)
      ? product.reviews
          .filter(Boolean)
          .map((review) => ({
            ...review,
            reviewerName: review.reviewerName || "Customer",
            quote: review.quote || "",
            rating: Number(review.rating) || 5,
            photo: review.photo || "",
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
    return "Designed for everyday wear with a clean silhouette and an easy premium feel.";
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
      unoptimized
      className={imageClassName}
    />
  );
}

type ProductInfoPanelProps = {
  product: Product;
  priceText: string;
  compareAtPriceText: string;
  discountLabel: string;
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
  mobile?: boolean;
};

function ProductInfoPanel({
  product,
  priceText,
  compareAtPriceText,
  discountLabel,
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
  mobile = false,
}: ProductInfoPanelProps) {
  const shellClassName = mobile
    ? "border-b border-[rgba(17,17,17,0.08)] bg-[var(--background)] px-5 pb-8 pt-5"
    : "flex h-full flex-col overflow-y-auto border border-[rgba(17,17,17,0.1)] bg-[rgba(255,255,255,0.58)] px-10 py-10 xl:px-12 xl:py-12";

  return (
    <div className={shellClassName}>
      {mobile ? (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="max-w-[18ch] text-[0.98rem] font-semibold uppercase leading-snug text-[var(--foreground)]">
                {product.name}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="text-[1rem] font-semibold leading-none text-[var(--foreground)]">
                  {priceText}
                </p>
                {hasDiscount ? (
                  <>
                    <p className="text-[0.82rem] leading-none text-[var(--danger)] line-through decoration-[1.5px]">
                      {compareAtPriceText}
                    </p>
                    <p className="text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-[var(--danger)]">
                      {discountLabel}
                    </p>
                  </>
                ) : null}
              </div>
              <p className="mt-4 text-[0.78rem] tracking-[0.06em] text-[var(--muted)]">
                MRP incl. of all taxes
              </p>
            </div>
            <div className="flex items-start gap-3">
              <WishlistButton
                productId={product.id}
                label={`Add ${product.name} to wishlist`}
                className="inline-flex h-9 w-9 items-center justify-center border border-[rgba(17,17,17,0.08)] bg-[rgba(255,255,255,0.7)] text-[var(--foreground)]"
                iconClassName="h-4 w-4"
              />
            </div>
          </div>
          <p className="mt-6 max-w-[21rem] text-[0.78rem] font-medium leading-5 text-[var(--foreground)]">
            {description}
          </p>
        </>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="max-w-[19ch] text-[1rem] font-semibold uppercase leading-snug text-[var(--foreground)]">
                {product.name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="text-[0.95rem] font-semibold leading-none text-[var(--foreground)]">
                  {priceText}
                </p>
                {hasDiscount ? (
                  <>
                    <p className="text-[0.84rem] leading-none text-[var(--danger)] line-through decoration-[1.5px]">
                      {compareAtPriceText}
                    </p>
                    <p className="text-[0.76rem] font-semibold uppercase tracking-[0.12em] text-[var(--danger)]">
                      {discountLabel}
                    </p>
                  </>
                ) : null}
              </div>
            </div>
            <WishlistButton
              productId={product.id}
              label={`Add ${product.name} to wishlist`}
              className="inline-flex h-9 w-9 items-center justify-center border border-[rgba(17,17,17,0.08)] bg-[var(--surface)] text-[var(--foreground)]"
              iconClassName="h-4 w-4"
            />
          </div>
          <p className="mt-5 text-[0.82rem] tracking-[0.06em] text-[var(--muted)]">
            MRP incl. of all taxes
          </p>
          <p className="mt-9 max-w-[15.5rem] text-[0.84rem] font-medium leading-5 text-[var(--foreground)]">
            {description}
          </p>
        </>
      )}

      {product.colors.length > 0 ? (
        <div className={mobile ? "mt-6" : "mt-16"}>
          <p className="text-[0.86rem] tracking-[0.08em] text-[var(--muted)]">Color</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {product.colors.map((color) => {
              const active = selectedColor === color;

              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => onColorSelect(color)}
                  aria-label={`Select ${color}`}
                  className={`h-9 w-9 border transition ${
                    active
                      ? "border-[var(--foreground)] ring-1 ring-[var(--foreground)]"
                      : "border-[rgba(17,17,17,0.08)]"
                  }`}
                  style={{ backgroundColor: resolveSwatchColor(color, product.accent) }}
                />
              );
            })}
          </div>
        </div>
      ) : null}

      {requiresSize ? (
        <div className="mt-5">
          <p className="text-[0.86rem] tracking-[0.08em] text-[var(--muted)]">Size</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.sizes.map((size) => {
              const active = selectedSize === size;

              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => onSizeSelect(size)}
                  className={`inline-flex min-h-9 min-w-9 items-center justify-center border px-3 text-[0.72rem] uppercase transition ${
                    active
                      ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                      : "border-[rgba(17,17,17,0.16)] bg-[var(--surface)] text-[var(--foreground)]"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-[0.62rem] uppercase text-[var(--muted)]">
            Find your size <span className="mx-2">|</span> Measurement guide
          </p>
        </div>
      ) : null}

      {!mobile ? (
        <div className="mt-auto pt-8">
          <button
            type="button"
            onClick={onAddToCart}
            disabled={!canAddToCart}
            className="inline-flex min-h-10 w-full items-center justify-center bg-[rgba(17,17,17,0.1)] px-6 text-[0.8rem] font-semibold uppercase text-[var(--foreground)] transition hover:bg-[rgba(17,17,17,0.15)] disabled:cursor-not-allowed disabled:opacity-55"
          >
            Add
          </button>
          {addError ? <p className="mt-3 text-sm text-[var(--accent)]">{addError}</p> : null}
        </div>
      ) : addError ? (
        <p className="mt-5 text-sm text-[var(--accent)]">{addError}</p>
      ) : null}
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
  const [productLoading, setProductLoading] = useState(!normalizedMatchedProduct);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(
    matchedProduct?.colors[0] || ""
  );
  const [selectedSize, setSelectedSize] = useState("");
  const [addError, setAddError] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [reviewQuote, setReviewQuote] = useState("");
  const [reviewRating, setReviewRating] = useState("5");
  const [reviewPhoto, setReviewPhoto] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewSaved, setReviewSaved] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const [openSection, setOpenSection] =
    useState<(typeof productInfoSections)[number]["key"]>("description");

  useEffect(() => {
    let active = true;

    if (normalizedMatchedProduct) {
      setProduct(normalizedMatchedProduct);
      setProductLoading(false);
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
    const mediaItems = product ? buildProductMediaItems(product) : [];
    const activeMediaType = mediaItems[activeMediaIndex]?.type;

    if (mediaItems.length <= 1 || activeMediaType === "video") {
      return;
    }

    const timerId = window.setTimeout(() => {
      setActiveMediaIndex((current) => (current + 1) % mediaItems.length);
    }, 4000);

    return () => window.clearTimeout(timerId);
  }, [activeMediaIndex, product]);

  if (loading || productLoading) {
    return (
      <div className="page-shell bg-[var(--background)] paper-texture">
        <SiteHeader />
        <main className="mx-auto max-w-[1600px] px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pt-8">
          <div className="mt-4">
            <LoadingState
              title="Loading product"
              description="We are preparing the product gallery, sizing, and details."
            />
          </div>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page-shell bg-[var(--background)] paper-texture">
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
  const canAddToCart = !requiresSize || Boolean(selectedSize);
  const relatedProducts = products
    .filter(
      (item) =>
        item.id !== product.id &&
        (item.category === product.category || item.featured)
    )
    .slice(0, 4);
  const reviews = product.reviews || [];
  const compareAtPrice = product.compareAtPrice || getCompareAtPrice(product.price);
  const hasDiscount = compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? getDiscountPercent(product.price, compareAtPrice)
    : 0;
  const priceText = `Rs.${product.price.toLocaleString("en-IN")}`;
  const compareAtPriceText = `Rs.${compareAtPrice.toLocaleString("en-IN")}`;
  const discountLabel = `-${discountPercent}%`;
  const productSummary = getProductSummary(product.description);
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

  const readPhoto = async (file: File) => {
    const result = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Could not read review photo."));
      reader.readAsDataURL(file);
    });

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new window.Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Could not process review photo."));
      element.src = result;
    });

    const maxDimension = 640;
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Could not process review photo.");
    }

    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.68);
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
        photo: reviewPhoto,
      });
      setReviewerName("");
      setReviewQuote("");
      setReviewRating("5");
      setReviewPhoto("");
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

    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      size: selectedSize,
      color: effectiveColor,
      quantity: 1,
      accent: product.accent,
      image: product.images[0],
    });
    setAddError("");
    pushToast(`${product.name} added to cart`);
    openCart();
  };

  return (
    <div className="page-shell bg-[var(--background)] paper-texture">
      <SiteHeader />
      <main className="mx-auto w-full pb-28 lg:max-w-[1180px] lg:px-8 lg:pb-20 lg:pt-16 xl:pt-20">
        <div>
          <div className="lg:hidden">
            <section aria-label="Product media gallery">
              <div
                className="relative overflow-hidden border-b border-[rgba(17,17,17,0.08)] bg-[var(--surface-strong)]"
                onPointerDown={handleSwipeStart}
                onPointerUp={handleSwipeEnd}
                onPointerCancel={() => {
                  swipeStartRef.current = null;
                }}
                style={{ touchAction: "pan-y" }}
              >
                <div className="relative aspect-[4/5.2]">
                  <ProductMediaFrame
                    item={activeMedia}
                    product={product}
                    imageClassName="object-contain p-1"
                    onVideoEnded={showNextMedia}
                  />
                </div>

                {hasMultipleMedia ? (
                  <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-2">
                    {mediaItems.map((item, index) => (
                      <button
                        key={`${item.id}-mobile-dot-${index}`}
                        type="button"
                        onClick={() => setActiveMediaIndex(index)}
                        aria-label={`Show ${item.type} ${index + 1}`}
                        className={`h-1.5 transition ${
                          activeMediaIndex === index
                            ? "w-7 bg-[var(--foreground)]"
                            : "w-3 bg-[rgba(17,17,17,0.22)]"
                        }`}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </section>

            <section aria-label="Product details and purchase options">
              <ProductInfoPanel
                product={product}
                priceText={priceText}
                compareAtPriceText={compareAtPriceText}
                discountLabel={discountLabel}
                hasDiscount={hasDiscount}
                description={productSummary}
                selectedColor={selectedColor}
                selectedSize={selectedSize}
                addError={addError}
                requiresSize={requiresSize}
                canAddToCart={canAddToCart}
                onColorSelect={(color) => {
                  setSelectedColor(color);
                  setAddError("");
                }}
                onSizeSelect={(size) => {
                  setSelectedSize(size);
                  setAddError("");
                }}
                onAddToCart={handleAddToCart}
                mobile
              />
            </section>
          </div>

          <div className="hidden lg:mx-auto lg:grid lg:h-[min(620px,calc(100vh-12rem))] lg:max-w-[1180px] lg:grid-cols-2 lg:items-stretch lg:gap-10 xl:gap-12">
            <section
              aria-label="Product media gallery"
              className="relative h-full overflow-hidden border border-[rgba(17,17,17,0.08)] bg-[var(--surface-strong)] p-8"
              onPointerDown={handleSwipeStart}
              onPointerUp={handleSwipeEnd}
              onPointerCancel={() => {
                swipeStartRef.current = null;
              }}
              style={{ touchAction: "pan-y" }}
            >
              <div className="relative h-full w-full overflow-hidden">
                <ProductMediaFrame
                  item={activeMedia}
                  product={product}
                  imageClassName="object-contain"
                  onVideoEnded={showNextMedia}
                />
              </div>

              {hasMultipleMedia ? (
                <div className="absolute inset-x-0 bottom-5 flex items-center justify-center gap-2">
                  {mediaItems.map((item, index) => (
                    <button
                      key={`${item.id}-desktop-dot-${index}`}
                      type="button"
                      onClick={() => setActiveMediaIndex(index)}
                      aria-label={`Show ${item.type} ${index + 1}`}
                      className={`h-1.5 transition ${
                        activeMediaIndex === index
                          ? "w-8 bg-[var(--foreground)]"
                          : "w-3 bg-[rgba(17,17,17,0.22)]"
                      }`}
                    />
                  ))}
                </div>
              ) : null}
            </section>

            <section aria-label="Product details and purchase options" className="h-full">
              <ProductInfoPanel
                product={product}
                priceText={priceText}
                compareAtPriceText={compareAtPriceText}
                discountLabel={discountLabel}
                hasDiscount={hasDiscount}
                description={productSummary}
                selectedColor={selectedColor}
                selectedSize={selectedSize}
                addError={addError}
                requiresSize={requiresSize}
                canAddToCart={canAddToCart}
                onColorSelect={(color) => {
                  setSelectedColor(color);
                  setAddError("");
                }}
                onSizeSelect={(size) => {
                  setSelectedSize(size);
                  setAddError("");
                }}
                onAddToCart={handleAddToCart}
              />
            </section>
          </div>
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
                      onClick={() =>
                        setOpenSection((current) =>
                          current === section.key ? current : section.key
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
                      <div className="pb-5 text-sm leading-7 text-[var(--muted)]">
                        {section.key === "description" ? (
                          <div className="space-y-3">
                            <p>{product.description}</p>
                            <p>
                              Relaxed, everyday fit with a clean silhouette designed for repeat wear.
                            </p>
                            <p>Art. No.: {product.id}</p>
                          </div>
                        ) : null}
                        {section.key === "materials" ? (
                          <div className="space-y-3">
                            <p>Composition: 100% Cotton</p>
                            <p>Material: Premium cotton jersey</p>
                            <p>Care: Gentle wash, line dry, medium iron</p>
                          </div>
                        ) : null}
                        {section.key === "delivery" ? (
                          <div className="space-y-3">
                            <p>Delivery time: 2-7 days</p>
                            <p>Free shipping on selected orders.</p>
                            <p>
                              Returns, payment confirmation, and dispatch updates appear on your order page after checkout.
                            </p>
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
                Customer feedback and styling proof.
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
                              unoptimized
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
                    No reviews yet. Be the first customer to add one.
                  </div>
                )}
              </div>

              <form
                className="mt-8 grid gap-5 border-t border-[rgba(17,17,17,0.08)] pt-6"
                onSubmit={(event) => void onReviewSubmit(event)}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    value={reviewerName}
                    onChange={(event) => setReviewerName(event.target.value)}
                    className="min-h-12 border border-[rgba(17,17,17,0.08)] bg-[var(--surface)] px-4 py-3"
                    placeholder="Your name"
                    required
                  />
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

                <textarea
                  value={reviewQuote}
                  onChange={(event) => setReviewQuote(event.target.value)}
                  className="min-h-36 border border-[rgba(17,17,17,0.08)] bg-[var(--surface)] px-4 py-3"
                  placeholder="How did the fit, fabric, and overall feel work for you?"
                  required
                />

                <div className="border border-[rgba(17,17,17,0.08)] bg-[var(--surface)] p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">Review photo</p>
                      <p className="mt-1 text-xs leading-6 text-[var(--muted)]">
                        Optional. A product photo helps the review feel more trustworthy and visual.
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="block w-full text-sm text-[var(--muted)] file:mr-4 file:border-0 file:bg-[var(--foreground)] file:px-4 file:py-2 file:text-sm file:font-medium file:text-[var(--background)] sm:w-auto"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];

                        if (!file) {
                          setReviewPhoto("");
                          return;
                        }

                        try {
                          setReviewError("");
                          setReviewPhoto(await readPhoto(file));
                        } catch (error) {
                          setReviewError(
                            error instanceof Error
                              ? error.message
                              : "Could not process review photo."
                          );
                        }
                      }}
                    />
                  </div>
                  {reviewPhoto ? (
                    <div className="mt-5 flex items-center gap-4 border border-[rgba(17,17,17,0.08)] bg-[var(--background)] p-3">
                      <div className="relative aspect-square w-20 overflow-hidden border border-[rgba(17,17,17,0.08)]">
                        <Image
                          src={reviewPhoto}
                          alt="Review preview"
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Photo ready</p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          This image will be submitted with your review.
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>

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
                        ? "Review added"
                        : "Submit review"}
                  </button>
                  <p className="text-sm text-[var(--muted)]">
                    Your review may also appear in the homepage trust section.
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
          <div className="mt-6 grid gap-4 sm:mt-8 md:grid-cols-2 xl:grid-cols-4 xl:gap-6">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[rgba(17,17,17,0.08)] bg-[rgba(255,255,255,0.96)] p-4 backdrop-blur-xl lg:hidden">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!canAddToCart}
          className="inline-flex min-h-12 w-full items-center justify-center bg-[rgba(17,17,17,0.1)] px-6 text-[0.82rem] font-semibold uppercase text-[var(--foreground)] transition hover:bg-[rgba(17,17,17,0.15)] disabled:cursor-not-allowed disabled:opacity-55"
        >
          Add
        </button>
        {addError ? <p className="mt-2 text-xs text-[var(--accent)]">{addError}</p> : null}
      </div>

      <SiteFooter />
    </div>
  );
}
