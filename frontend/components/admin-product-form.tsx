"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { categories, type Product } from "@/lib/catalog";

const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL"];
const namedColorMap: Record<string, string> = {
  black: "#111111",
  white: "#f5f5f0",
  offwhite: "#e7e1d5",
  "off-white": "#e7e1d5",
  bone: "#e9e0d0",
  cream: "#f0e6d8",
  beige: "#d8c7ad",
  stone: "#c8c1b4",
  sand: "#cbb89d",
  brown: "#6b4f3a",
  coffee: "#6d4c41",
  mocha: "#70543e",
  tan: "#b98b64",
  olive: "#65724d",
  green: "#3f6a4a",
  forest: "#465742",
  sage: "#9aa28d",
  mint: "#a7c8b0",
  blue: "#476c9b",
  navy: "#24344d",
  midnight: "#1d2432",
  slate: "#5f6672",
  charcoal: "#3c3c3c",
  grey: "#7a7a7a",
  gray: "#7a7a7a",
  ash: "#90949b",
  silver: "#b7bcc3",
  burgundy: "#6f2137",
  maroon: "#74263f",
  red: "#a63131",
  wine: "#6f2b3a",
  pink: "#d88c9a",
  blush: "#ddb3b1",
  yellow: "#d6af41",
  mustard: "#bb8f27",
  orange: "#c7743a",
  rust: "#9b4b31",
  purple: "#6f5e8b",
  lavender: "#b9abc8",
};

type AdminProductFormValues = {
  name: string;
  slug: string;
  description: string;
  price: string;
  compareAtPrice: string;
  category: string;
  sizes: string[];
  colors: string;
  accent: string;
  featured: boolean;
  bestSeller: boolean;
  newIn: boolean;
  newArrival: boolean;
};

type AdminProductFormProps = {
  initialProduct?: Product;
  submitLabel: string;
  title: string;
  description: string;
  onSubmit: (product: Product) => Promise<void>;
};

const emptyForm: AdminProductFormValues = {
  name: "",
  slug: "",
  description: "",
  price: "",
  compareAtPrice: "",
  category: "",
  sizes: [],
  colors: "",
  accent: "#111111",
  featured: false,
  bestSeller: false,
  newIn: false,
  newArrival: false,
};

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not process selected image."));
    image.src = source;
  });
}

async function compressImage(file: File) {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);
  const maxDimension = 960;
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not process selected image.");
  }

  context.drawImage(image, 0, 0, width, height);

  const compressed = canvas.toDataURL("image/jpeg", 0.58);

  if (compressed.length > 900_000) {
    return canvas.toDataURL("image/jpeg", 0.45);
  }

  return compressed;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeColorKey(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, "").replace(/_/g, "-");
}

function inferAccentFromColors(value: string) {
  const firstColor = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)[0];

  if (!firstColor) {
    return "#111111";
  }

  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(firstColor)) {
    return firstColor;
  }

  return namedColorMap[normalizeColorKey(firstColor)] || "#111111";
}

function formatCurrency(value: string) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return "--";
  }

  return `Rs. ${amount.toLocaleString("en-IN")}`;
}

function buildInitialForm(product?: Product): AdminProductFormValues {
  if (!product) {
    return emptyForm;
  }

  return {
    name: product.name,
    slug: product.slug || "",
    description: product.description,
    price: String(product.price),
    compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : "",
    category: product.category,
    sizes: product.sizes,
    colors: product.colors.join(", "),
    accent: product.accent,
    featured: Boolean(product.featured),
    bestSeller: Boolean(product.bestSeller),
    newIn: Boolean(product.newIn),
    newArrival: Boolean(product.newArrival),
  };
}

export function AdminProductForm({
  initialProduct,
  submitLabel,
  title,
  description,
  onSubmit,
}: AdminProductFormProps) {
  const [form, setForm] = useState<AdminProductFormValues>(() =>
    buildInitialForm(initialProduct)
  );
  const [uploadedImages, setUploadedImages] = useState<string[]>(
    initialProduct?.images || []
  );
  const [uploadError, setUploadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [slugEdited, setSlugEdited] = useState(Boolean(initialProduct?.slug));

  useEffect(() => {
    setForm(buildInitialForm(initialProduct));
    setUploadedImages(initialProduct?.images || []);
    setSlugEdited(Boolean(initialProduct?.slug));
  }, [initialProduct]);

  const parsedColors = form.colors
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const salePrice = Number(form.price);
  const originalPrice = Number(form.compareAtPrice);
  const discountPercent =
    Number.isFinite(salePrice) &&
    Number.isFinite(originalPrice) &&
    originalPrice > salePrice &&
    salePrice > 0
      ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
      : 0;

  const onChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;

    setForm((current) => {
      const next = { ...current, [name]: value };

      if (name === "name" && !slugEdited) {
        next.slug = slugify(value);
      }

      if (name === "colors") {
        next.accent = inferAccentFromColors(value);
      }

      return next;
    });
  };

  const onToggleBoolean = (
    name: "featured" | "bestSeller" | "newIn" | "newArrival"
  ) => {
    setForm((current) => ({ ...current, [name]: !current[name] }));
  };

  const toggleSize = (size: string) => {
    setForm((current) => ({
      ...current,
      sizes: current.sizes.includes(size)
        ? current.sizes.filter((item) => item !== size)
        : [...current.sizes, size],
    }));
  };

  const onImagesChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      return;
    }

    try {
      setUploadError("");
      const imageData = await Promise.all(files.map(compressImage));

      const totalPayloadSize = imageData.reduce(
        (sum, image) => sum + image.length,
        0
      );

      if (totalPayloadSize > 2_500_000) {
        throw new Error("Selected images are still too large after optimization.");
      }

      setUploadedImages(imageData);
    } catch {
      setUploadError(
        "Could not process selected images. Try fewer images or smaller files."
      );
    }
  };

  const onFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError("");

    try {
      await onSubmit({
        id: initialProduct?.id || "",
        name: form.name,
        slug: form.slug || undefined,
        description: form.description,
        price: Number(form.price),
        compareAtPrice: form.compareAtPrice
          ? Number(form.compareAtPrice)
          : undefined,
        category: form.category,
        sizes: form.sizes,
        colors: form.colors
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        images: uploadedImages,
        imageLabel:
          initialProduct?.imageLabel || "Admin uploaded product image",
        accent: form.accent,
        featured: form.featured,
        bestSeller: form.bestSeller,
        newIn: form.newIn,
        newArrival: form.newArrival,
      });

      if (!initialProduct) {
        setForm(emptyForm);
        setUploadedImages([]);
        setSlugEdited(false);
      }

      setSaved(true);
      window.setTimeout(() => setSaved(false), 1500);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Could not save product."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grain-card rounded-[2rem] p-6 sm:p-8">
      <p className="eyebrow text-[var(--accent)]">Admin product panel</p>
      <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="display-font text-4xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted)]">
            {description}
          </p>
        </div>
        <div className="rounded-[1.6rem] border border-[var(--border)] bg-white/45 px-5 py-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            Product preview
          </p>
          <div className="mt-3 flex items-center gap-3">
            <span
              className="h-10 w-10 rounded-full border border-[var(--border)]"
              style={{ backgroundColor: form.accent }}
            />
            <div>
              <p className="text-sm font-semibold">
                {form.name || "New product draft"}
              </p>
              <p className="text-xs text-[var(--muted)]">
                {form.category || "Category pending"} · {formatCurrency(form.price)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <form
        className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]"
        onSubmit={(event) => void onFormSubmit(event)}
      >
        <div className="grid gap-6">
          <section className="rounded-[1.8rem] border border-[var(--border)] bg-white/55 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Core details</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Name, slug, description, and category for the storefront.
                </p>
              </div>
              <span className="rounded-full bg-black/5 px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                Basics
              </span>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
                placeholder="Product name"
                required
              />
              <input
                name="slug"
                value={form.slug}
                onChange={(event) => {
                  setSlugEdited(true);
                  onChange(event);
                }}
                className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
                placeholder="Product slug"
              />
            </div>
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              className="mt-4 min-h-32 rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
              placeholder="Description"
              required
            />
            <select
              name="category"
              value={form.category}
              onChange={(event) =>
                setForm((current) => ({ ...current, category: event.target.value }))
              }
              className="mt-4 w-full rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
              required
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </section>

          <section className="rounded-[1.8rem] border border-[var(--border)] bg-white/55 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Pricing setup</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Set the live selling price and the original cut price shown on the product card.
                </p>
              </div>
              {discountPercent > 0 ? (
                <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white">
                  {discountPercent}% off
                </span>
              ) : null}
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input
                name="price"
                value={form.price}
                onChange={onChange}
                className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
                placeholder="Discounted price"
                required
                inputMode="decimal"
              />
              <input
                name="compareAtPrice"
                value={form.compareAtPrice}
                onChange={onChange}
                className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
                placeholder="Original price"
                inputMode="decimal"
              />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--border)] bg-white/65 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                  Selling price
                </p>
                <p className="mt-2 text-lg font-semibold">{formatCurrency(form.price)}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-white/65 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                  Original price
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {formatCurrency(form.compareAtPrice)}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-white/65 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                  Discount
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {discountPercent > 0 ? `${discountPercent}%` : "--"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[1.8rem] border border-[var(--border)] bg-white/55 p-5 sm:p-6">
            <p className="text-sm font-semibold">Fit and color setup</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Choose live size availability and the color names customers will see.
            </p>
            <div className="mt-5 rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-4">
              <p className="text-sm font-medium text-[var(--foreground)]">Available sizes</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {sizeOptions.map((size) => {
                  const selected = form.sizes.includes(size);

                  return (
                    <label
                      key={size}
                      className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                        selected
                          ? "border-black bg-black text-white"
                          : "border-[var(--border)] bg-white text-[var(--foreground)]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSize(size)}
                        className="hidden"
                      />
                      <span>{size}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <input
              name="colors"
              value={form.colors}
              onChange={onChange}
              className="mt-4 w-full rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
              placeholder="Colors (comma separated)"
            />
            <div className="mt-4 rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-4">
              <p className="text-sm font-medium text-[var(--foreground)]">
                Detected accent color
              </p>
              <div className="mt-3 flex items-center gap-3">
                <span
                  className="h-10 w-10 rounded-full border border-[var(--border)]"
                  style={{ backgroundColor: form.accent }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{form.accent}</p>
                  <p className="text-xs text-[var(--muted)]">
                    Based on the first color in the list.
                  </p>
                </div>
              </div>
              {parsedColors.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {parsedColors.map((color) => (
                    <span
                      key={color}
                      className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs text-[var(--muted)]"
                    >
                      {color}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <div className="grid gap-6">
          <section className="rounded-[1.8rem] border border-[var(--border)] bg-white/55 p-5 sm:p-6">
            <p className="text-sm font-semibold">Storefront status</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Control where this product gets highlighted across the site.
            </p>
            <div className="mt-5 grid gap-4">
              <label className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-4">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  Featured product
                </span>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Show this item in curated homepage edits and featured product sections.
                </p>
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={() => onToggleBoolean("featured")}
                  className="mt-4 h-5 w-5"
                />
              </label>
              <label className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-4">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  Best seller
                </span>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Highlight this product in the best-sellers edit instead of relying on price order.
                </p>
                <input
                  type="checkbox"
                  checked={form.bestSeller}
                  onChange={() => onToggleBoolean("bestSeller")}
                  className="mt-4 h-5 w-5"
                />
              </label>
              <label className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-4">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  New in
                </span>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Push this item into the New In edit used for the main navigation and launch merchandising.
                </p>
                <input
                  type="checkbox"
                  checked={form.newIn}
                  onChange={() => onToggleBoolean("newIn")}
                  className="mt-4 h-5 w-5"
                />
              </label>
              <label className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-4">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  New arrival
                </span>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Push this product into new-arrival sections and launch-focused edits.
                </p>
                <input
                  type="checkbox"
                  checked={form.newArrival}
                  onChange={() => onToggleBoolean("newArrival")}
                  className="mt-4 h-5 w-5"
                />
              </label>
            </div>
          </section>

          <section className="rounded-[1.8rem] border border-[var(--border)] bg-white/55 p-5 sm:p-6">
            <p className="text-sm font-semibold">Media gallery</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Add the front, back, and lifestyle views that will sell the product best.
            </p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onImagesChange}
              className="mt-5 block w-full text-sm text-[var(--muted)] file:mr-4 file:rounded-full file:border-0 file:bg-black file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
            />
            <p className="mt-2 text-xs leading-6 text-[var(--muted)]">
              Images are optimized automatically. Keep this to 2-4 medium-size images for the
              smoothest save flow. The first image becomes the main storefront image.
            </p>
            {uploadError ? (
              <p className="mt-3 text-sm text-[var(--accent)]">{uploadError}</p>
            ) : null}
            {uploadedImages.length > 0 ? (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {uploadedImages.map((image, index) => (
                  <div
                    key={`${index}-${image.slice(0, 20)}`}
                    className="relative aspect-square overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)]"
                  >
                    <Image
                      src={image}
                      alt={`Preview ${index + 1}`}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                    <span className="absolute left-2 top-2 rounded-full bg-white/92 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-black">
                      {index === 0 ? "Primary" : `Image ${index + 1}`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-[var(--border)] bg-white/35 px-4 py-10 text-center text-sm text-[var(--muted)]">
                Upload images to see the product gallery preview here.
              </div>
            )}
          </section>

          <section className="rounded-[1.8rem] border border-[var(--border)] bg-white/55 p-5 sm:p-6">
            <p className="text-sm font-semibold">Publishing summary</p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                  Slug
                </p>
                <p className="mt-2 break-all text-sm font-medium">
                  {form.slug || "Will be generated from the product name"}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                  Readiness
                </p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {uploadedImages.length > 0
                    ? `${uploadedImages.length} images ready, ${form.sizes.length} sizes selected.`
                    : "Add product images before publishing for a stronger storefront."}
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="xl:col-span-2">
          {submitError ? (
            <p className="mb-4 text-sm text-[var(--accent)]">{submitError}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="button-primary rounded-full px-6 py-3 transition disabled:opacity-60"
            >
              {submitting ? "Saving..." : saved ? "Saved" : submitLabel}
            </button>
            <span className="text-sm text-[var(--muted)]">
              Changes will update the storefront as soon as the save completes.
            </span>
          </div>
        </div>
      </form>
    </div>
  );
}
