"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useState } from "react";
import { useParams } from "next/navigation";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WishlistButton } from "@/components/wishlist-button";
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

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const { products, addProductReview } = useStorefrontData();
  const product = products.find(
    (item) => item.id === params.id || item.slug === params.id
  );
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [reviewerName, setReviewerName] = useState("");
  const [reviewQuote, setReviewQuote] = useState("");
  const [reviewRating, setReviewRating] = useState("5");
  const [reviewPhoto, setReviewPhoto] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewSaved, setReviewSaved] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [openSection, setOpenSection] =
    useState<(typeof productInfoSections)[number]["key"]>("description");

  useEffect(() => {
    if (reviewSaved) {
      const timerId = window.setTimeout(() => setReviewSaved(false), 2000);
      return () => window.clearTimeout(timerId);
    }
  }, [reviewSaved]);

  if (!product) {
    return (
      <div className="page-shell">
        <SiteHeader />
        <main className="mx-auto max-w-4xl px-5 py-16 sm:px-8">
          <div className="grain-card rounded-[2rem] p-8">
            <h1 className="display-font text-4xl">Product not found.</h1>
            <Link
              href="/shop"
              className="button-primary mt-6 inline-flex rounded-full px-5 py-3"
            >
              Back to shop
            </Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const images = product.images.length > 0 ? product.images : [""];
  const activeImage = images[activeImageIndex] || images[0];
  const compareAtPrice = product.compareAtPrice || getCompareAtPrice(product.price);
  const discountPercent = getDiscountPercent(product.price, compareAtPrice);
  const requiresSize = product.sizes.length > 0;
  const effectiveSize = selectedSize;
  const effectiveColor = product.colors[0] || "";
  const canAddToCart = !requiresSize || Boolean(selectedSize);
  const validationMessage =
    !selectedSize && requiresSize
      ? "Please select a size before adding to cart."
      : "";
  const relatedProducts = products
    .filter(
      (item) =>
        item.id !== product.id &&
        (item.category === product.category || item.featured)
    )
    .slice(0, 4);
  const reviews = product.reviews || [];

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

  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr] xl:gap-8">
          <div className="grid gap-3 lg:grid-cols-[96px_1fr] xl:grid-cols-[112px_1fr]">
            <div className="order-2 flex gap-2 overflow-x-auto pb-1 lg:order-1 lg:flex-col lg:gap-3">
              {images.map((image, index) => (
                <button
                  key={`${product.id}-${index}`}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                  className={`relative h-20 w-16 shrink-0 overflow-hidden border sm:h-24 sm:w-20 xl:h-28 xl:w-[5.5rem] ${
                    activeImageIndex === index
                      ? "border-black"
                      : "border-[var(--border)]"
                  }`}
                >
                  {image ? (
                    <Image
                      src={image}
                      alt={`${product.name} view ${index + 1}`}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full" style={{ background: product.accent }} />
                  )}
                </button>
              ))}
            </div>

            <div className="order-1 overflow-hidden border border-[var(--border)] bg-[#f4f4f1] lg:order-2">
              <div className="relative aspect-[4/5]">
                {activeImage ? (
                  <Image
                    src={activeImage}
                    alt={product.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full" style={{ background: product.accent }} />
                )}
              </div>
            </div>
          </div>

          <div className="px-0 sm:px-1 xl:px-2">
            <div>
              <p className="text-sm uppercase tracking-[0.16em] text-[var(--muted)]">
                {product.category}
              </p>
              <h1 className="mt-2 text-2xl font-medium tracking-[-0.02em] sm:text-3xl xl:text-4xl">
                {product.name}
              </h1>
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-2 sm:mt-5 sm:gap-3">
              <p className="text-xl font-semibold sm:text-2xl">
                Rs. {product.price.toLocaleString("en-IN")}.00
              </p>
              <p className="pb-0.5 text-sm text-[var(--muted)] line-through sm:text-base">
                Rs. {compareAtPrice.toLocaleString("en-IN")}.00
              </p>
              <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white">
                {discountPercent}% OFF
              </span>
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">MRP inclusive of all taxes</p>

            <div className="mt-6 border-t border-[var(--border)] pt-5 sm:mt-8 sm:pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Size
                </p>
                <p className="text-sm text-[var(--muted)]">{effectiveSize || "Select"}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.sizes.map((size) => {
                  const isActive = effectiveSize === size;

                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`rounded-full border px-4 py-2 text-xs transition sm:text-sm ${
                        isActive
                          ? "border-black bg-black text-white"
                          : "border-[var(--border)]"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 sm:mt-8">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                Quantity
              </p>
              <div className="mt-3 inline-flex items-center rounded-full border border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                  className="px-4 py-3"
                >
                  -
                </button>
                <span className="min-w-10 text-center">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((current) => current + 1)}
                  className="px-4 py-3"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:mt-8">
              <AddToCartButton
                item={{
                  productId: product.id,
                  name: product.name,
                  price: product.price,
                  size: effectiveSize,
                  color: effectiveColor,
                  quantity,
                  accent: product.accent,
                  image: product.images[0],
                }}
                disabled={!canAddToCart}
                validationMessage={validationMessage}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <div
                  className="button-secondary inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm transition sm:px-5"
                >
                  <WishlistButton
                    productId={product.id}
                    label={`Add ${product.name} to wishlist`}
                  />
                  <span>Add to favourites</span>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-[var(--border)] sm:mt-8">
              {productInfoSections.map((section) => {
                const isOpen = openSection === section.key;

                return (
                  <div key={section.key} className="border-b border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenSection((current) =>
                          current === section.key ? current : section.key
                        )
                      }
                      className="flex w-full items-center justify-between py-4 text-left"
                    >
                      <span className="text-base font-medium">{section.title}</span>
                      <span className="text-2xl leading-none">{isOpen ? "−" : "+"}</span>
                    </button>
                    {isOpen ? (
                      <div className="pb-5 text-sm leading-7 text-[var(--muted)]">
                        {section.key === "description" ? (
                          <div className="space-y-3">
                            <p>{product.description}</p>
                            <p>
                              Regular everyday fit with a clean silhouette designed for repeat wear.
                            </p>
                            <p>Art. No.: {product.id}</p>
                          </div>
                        ) : null}
                        {section.key === "materials" ? (
                          <div className="space-y-3">
                            <p>Composition</p>
                            <p>100% Cotton</p>
                            <p>Material: Premium cotton jersey</p>
                            <p>Care: Gentle wash, line dry, medium iron</p>
                          </div>
                        ) : null}
                        {section.key === "delivery" ? (
                          <div className="space-y-3">
                            <p>Delivery time: 2-7 days</p>
                            <p>Free shipping on selected launch orders.</p>
                            <p>
                              Returns, payments, and dispatch updates are shared on your order page
                              after checkout.
                            </p>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <section className="mt-10 sm:mt-14">
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="eyebrow text-[var(--accent)]">Product reviews</p>
              <h2 className="display-font mt-3 text-2xl sm:text-3xl">
                Customer feedback and styling proof.
              </h2>
              <div className="mt-6 space-y-4">
                {reviews.length > 0 ? (
                  reviews.slice(0, 4).map((review, index) => (
                    <div key={`${review.reviewerName}-${index}`} className="grain-card rounded-[2rem] p-5 sm:p-6">
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
                  <div className="grain-card rounded-[2rem] p-6 text-sm text-[var(--muted)]">
                    No reviews yet. Be the first customer to add one.
                  </div>
                )}
              </div>
            </div>

            <div className="grain-card rounded-[2rem] p-6 sm:p-8">
              <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="eyebrow text-[var(--accent)]">Add your review</p>
                    <h3 className="mt-3 text-2xl font-semibold">Share your experience.</h3>
                  </div>
                  <div className="rounded-full border border-[var(--border)] bg-white/70 px-4 py-2 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                    Community feedback
                  </div>
                </div>
                <p className="max-w-xl text-sm leading-7 text-[var(--muted)]">
                  Tell future customers how the fit, fabric, and overall feel worked for you.
                  You can also add a photo to make the review more visual.
                </p>
              </div>

              <form className="mt-6 grid gap-5" onSubmit={(event) => void onReviewSubmit(event)}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    value={reviewerName}
                    onChange={(event) => setReviewerName(event.target.value)}
                    className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
                    placeholder="Your name"
                    required
                  />
                  <div className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3">
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
                  className="min-h-36 rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
                  placeholder="How did the fit, fabric, and overall feel work for you?"
                  required
                />

                <div className="rounded-[1.6rem] border border-[var(--border)] bg-white/65 p-4 sm:p-5">
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
                      className="block w-full text-sm text-[var(--muted)] file:mr-4 file:rounded-full file:border-0 file:bg-black file:px-4 file:py-2 file:text-sm file:font-medium file:text-white sm:w-auto"
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
                    <div className="mt-5 flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-white/70 p-3">
                      <div className="relative aspect-square w-20 overflow-hidden rounded-2xl border border-[var(--border)]">
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
                    className="button-primary rounded-full px-6 py-3 transition disabled:opacity-60"
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

        <section className="mt-10 sm:mt-14">
          <p className="eyebrow text-[var(--accent)]">Related products</p>
          <h2 className="display-font mt-3 text-2xl sm:text-3xl">More from the current edit.</h2>
          <div className="mt-6 grid gap-4 sm:mt-8 md:grid-cols-2 xl:grid-cols-4 xl:gap-6">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
