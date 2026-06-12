"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  AdminField,
  AdminFilterInput,
  AdminPageHeader,
  AdminPanel,
  AdminSectionLabel,
  AdminSwitch,
  AdminTextArea,
} from "@/components/admin-ui";
import { useToast } from "@/components/toast-provider";
import {
  type Product,
  type ProductCollectionLabel,
  type ProductFitType,
  type ProductGender,
  type ProductSizeMeasurement,
  type ProductVideo,
  type ProductStatus,
  type ProductVariant,
} from "@/lib/catalog";
import { uploadAdminMedia, ADMIN_MEDIA_UPLOAD_LIMIT_BYTES } from "@/lib/admin-media-upload";
import { compressImageFile } from "@/lib/image-upload";
import { type ProductAdminMeta } from "@/lib/admin-workspace";

const sizeOptions = ["S", "M", "L", "XL", "XXL"] as const;
const statusOptions: ProductStatus[] = ["Active", "Draft", "Hidden", "Sold Out"];
const fitOptions: ProductFitType[] = ["Oversized", "Regular"];
const genderOptions: ProductGender[] = ["Men", "Women", "Unisex"];
const labelOptions: ProductCollectionLabel[] = ["New In", "Featured", "Collection"];

type FormState = {
  name: string;
  slug: string;
  description: string;
  price: string;
  compareAtPrice: string;
  category: string;
  colors: string;
  sizes: string[];
  fitType: ProductFitType;
  gender: ProductGender;
  status: ProductStatus;
  collectionLabels: ProductCollectionLabel[];
  trackInventory: boolean;
  variants: ProductVariant[];
  images: string[];
  galleryImages: string[];
  fabric: string;
  gsm: string;
  cottonType: string;
  feel: string;
  weight: string;
  washCare: string;
  qualityNote: string;
  sizeGuide: ProductSizeMeasurement[];
  videos: ProductVideo[];
  videoUrlDraft: string;
  videoTitleDraft: string;
};

export type AdminProductFormSubmit = {
  product: Product;
  meta: ProductAdminMeta;
};

type AdminProductFormProps = {
  initialProduct?: Product;
  initialMeta?: ProductAdminMeta;
  categoryOptions: string[];
  submitLabel: string;
  title: string;
  description: string;
  onSubmit: (payload: AdminProductFormSubmit) => Promise<void>;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function inferAccent(colors: string[]) {
  const first = colors[0]?.trim().toLowerCase() || "black";
  const accentMap: Record<string, string> = {
    black: "#111111",
    white: "#f4f1eb",
    cream: "#e6d8c2",
    beige: "#cdb89c",
    brown: "#6c4e36",
    olive: "#68704d",
    navy: "#28344b",
    charcoal: "#3a3a3a",
    burgundy: "#6f2537",
  };

  return accentMap[first] || "#111111";
}

function buildInitialState(
  categoryOptions: string[],
  product?: Product,
  meta?: ProductAdminMeta
): FormState {
  return {
    name: product?.name || "",
    slug: product?.slug || "",
    description: product?.description || "",
    price: product?.price ? String(product.price) : "",
    compareAtPrice: product?.compareAtPrice ? String(product.compareAtPrice) : "",
    category: product?.category || categoryOptions[0] || "",
    colors: (product?.colors || []).join(", "),
    sizes: product?.sizes || [],
    fitType: meta?.fitType || product?.fitType || "Regular",
    gender: meta?.gender || product?.gender || "Unisex",
    status: meta?.status || product?.status || "Draft",
    collectionLabels: meta?.collectionLabels || product?.collectionLabels || [],
    trackInventory: product?.trackInventory || false,
    variants: product?.variants || [],
    images: product?.images || [],
    galleryImages: meta?.galleryImages || product?.galleryImages || [],
    fabric: product?.fabric || "",
    gsm: product?.gsm || "",
    cottonType: product?.cottonType || "",
    feel: product?.feel || "",
    weight: product?.weight || "",
    washCare: product?.washCare || "",
    qualityNote: product?.qualityNote || "",
    sizeGuide: product?.sizeGuide || [],
    videos: product?.videos || [],
    videoUrlDraft: "",
    videoTitleDraft: "",
  };
}

export function AdminProductForm({
  initialProduct,
  initialMeta,
  categoryOptions,
  submitLabel,
  title,
  description,
  onSubmit,
}: AdminProductFormProps) {
  const { pushToast } = useToast();
  const [form, setForm] = useState<FormState>(() =>
    buildInitialState(categoryOptions, initialProduct, initialMeta)
  );
  const [slugEdited, setSlugEdited] = useState(Boolean(initialProduct?.slug));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(buildInitialState(categoryOptions, initialProduct, initialMeta));
    setSlugEdited(Boolean(initialProduct?.slug));
  }, [categoryOptions, initialMeta, initialProduct]);

  const parsedColors = useMemo(
    () => form.colors.split(",").map((item) => item.trim()).filter(Boolean),
    [form.colors]
  );
  const parsedCategories = useMemo(() => [form.category].filter(Boolean), [form.category]);
  const selectedSizeGuideRows = useMemo(
    () =>
      form.sizes.map(
        (size) =>
          form.sizeGuide.find((row) => row.size === size) || {
            size,
            chest: "",
            length: "",
            shoulder: "",
            sleeve: "",
          }
      ),
    [form.sizeGuide, form.sizes]
  );
  const inventoryRows = useMemo(() => {
    const colors = parsedColors.length > 0 ? parsedColors : [""];
    const baseSlug = slugify(form.slug || form.name || "hrushe").toUpperCase();

    return form.sizes.flatMap((size) =>
      colors.map((color) => {
        const existing = form.variants.find(
          (variant) =>
            variant.size.toLowerCase() === size.toLowerCase() &&
            variant.color.toLowerCase() === color.toLowerCase()
        );
        const generatedSku = [baseSlug, color, size]
          .filter(Boolean)
          .join("-")
          .replace(/[^A-Z0-9-]+/g, "-");

        return {
          sku: existing?.sku || generatedSku,
          size,
          color,
          fit: form.fitType,
          stock: existing?.stock || 0,
          reserved: existing?.reserved || 0,
          active: existing?.active !== false,
        } satisfies ProductVariant;
      })
    );
  }, [form.fitType, form.name, form.sizes, form.slug, form.variants, parsedColors]);

  const sellingPrice = Number(form.price);
  const comparePrice = Number(form.compareAtPrice);
  const discountPercentage =
    comparePrice > sellingPrice && sellingPrice > 0
      ? Math.round(((comparePrice - sellingPrice) / comparePrice) * 100)
      : 0;

  function updateForm<T extends keyof FormState>(key: T, value: FormState[T]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateSizeMeasurement(
    size: string,
    key: Exclude<keyof ProductSizeMeasurement, "size">,
    value: string
  ) {
    setForm((current) => {
      const existing = current.sizeGuide.find((row) => row.size === size);
      const nextRow: ProductSizeMeasurement = {
        size,
        chest: existing?.chest || "",
        length: existing?.length || "",
        shoulder: existing?.shoulder || "",
        sleeve: existing?.sleeve || "",
        [key]: value,
      };

      return {
        ...current,
        sizeGuide: existing
          ? current.sizeGuide.map((row) => (row.size === size ? nextRow : row))
          : [...current.sizeGuide, nextRow],
      };
    });
  }

  function updateVariant(
    size: string,
    color: string,
    key: "sku" | "stock" | "active",
    value: string | number | boolean
  ) {
    const currentRows = inventoryRows.map((variant) =>
      variant.size === size && variant.color === color
        ? { ...variant, [key]: value }
        : variant
    );
    updateForm("variants", currentRows);
  }

  async function uploadImages(
    files: FileList | null,
    key: "images" | "galleryImages",
    maxDimension: number
  ) {
    if (!files?.length) {
      return;
    }

    try {
      const uploaded = await Promise.all(
        Array.from(files).map(async (file) => {
          const optimizedFile = await compressImageFile(file, maxDimension);
          const uploadedMedia = await uploadAdminMedia(optimizedFile);
          return uploadedMedia.url;
        })
      );
      updateForm(key, [...form[key], ...uploaded]);
      pushToast(`${key === "images" ? "Product" : "Gallery"} images added.`);
    } catch {
      pushToast("Could not process those images.", "error");
    }
  }

  async function uploadProductVideos(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    try {
      const uploaded = await Promise.all(
        Array.from(files).map(async (file, index) => {
          if (!file.type.startsWith("video/")) {
            throw new Error("Please upload video files only.");
          }

          if (file.size > ADMIN_MEDIA_UPLOAD_LIMIT_BYTES) {
            throw new Error("Video must be under 25 MB for direct upload. Use a hosted video URL for larger files.");
          }

          const uploadedMedia = await uploadAdminMedia(file);

          return {
            id: `video-${Date.now()}-${index}`,
            title: file.name.replace(/\.[^.]+$/, "") || `Product video ${form.videos.length + index + 1}`,
            url: uploadedMedia.url,
            posterUrl: "",
          };
        })
      );
      updateForm("videos", [...form.videos, ...uploaded]);
      pushToast("Product video added.");
    } catch (error) {
      pushToast(
        error instanceof Error ? error.message : "Could not process that product video.",
        "error"
      );
    }
  }

  function addProductVideoUrl() {
    const url = form.videoUrlDraft.trim();

    if (!url) {
      pushToast("Paste a video URL first.", "error");
      return;
    }

    updateForm("videos", [
      ...form.videos,
      {
        id: `video-${Date.now()}`,
        title: form.videoTitleDraft.trim() || `Product video ${form.videos.length + 1}`,
        url,
        posterUrl: "",
      },
    ]);
    updateForm("videoUrlDraft", "");
    updateForm("videoTitleDraft", "");
    pushToast("Product video URL added.");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      if (!form.category) {
        throw new Error("Add a category in Admin > Categories before saving a product.");
      }


      if (form.status === "Active") {
        const requiredFields = [
          [form.name, "product name"],
          [form.description, "description"],
          [Number(form.price) > 0, "price"],
          [form.images.length > 0, "primary image"],
          [form.sizes.length > 0, "sizes"],
          [parsedColors.length > 0, "colors"],
          [form.fabric, "fabric"],
          [form.gsm, "GSM"],
          [form.washCare, "wash care"],
        ] as const;
        const missing: string[] = requiredFields
          .filter(([value]) => !value)
          .map(([, label]) => label);
        const incompleteSizeGuide = selectedSizeGuideRows.some(
          (row) => !row.chest || !row.length || !row.shoulder || !row.sleeve
        );

        if (incompleteSizeGuide) {
          missing.push("complete size guide");
        }

        if (form.trackInventory && inventoryRows.some((variant) => !variant.sku)) {
          missing.push("variant SKUs");
        }

        if (missing.length > 0) {
          throw new Error(`Complete launch details before publishing: ${missing.join(", ")}.`);
        }
      }

      if (form.videos.some((video) => /^data:video\//i.test(video.url))) {
        throw new Error("Remove and re-upload old video drafts before saving. Videos now save through MongoDB media storage.");
      }

      const colors = parsedColors;
      const collectionLabels = form.collectionLabels;
      const product: Product = {
        id: initialProduct?.id || "",
        name: form.name,
        slug: form.slug || slugify(form.name),
        description: form.description,
        price: Number(form.price),
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
        category: form.category,
        categories: parsedCategories,
        colors,
        sizes: form.sizes,
        images: form.images,
        videos: form.videos,
        galleryImages: form.galleryImages,
        fabric: form.fabric.trim(),
        gsm: form.gsm.trim(),
        cottonType: form.cottonType.trim(),
        feel: form.feel.trim(),
        weight: form.weight.trim(),
        washCare: form.washCare.trim(),
        qualityNote: form.qualityNote.trim(),
        sizeGuide: selectedSizeGuideRows.filter(
          (row) => row.chest || row.length || row.shoulder || row.sleeve
        ),
        fitType: form.fitType,
        gender: form.gender,
        collectionLabels,
        status: form.status,
        trackInventory: form.trackInventory,
        variants: inventoryRows,
        featured: collectionLabels.includes("Featured"),
        newIn: collectionLabels.includes("New In"),
        bestSeller: initialProduct?.bestSeller || false,
        newArrival: initialProduct?.newArrival || collectionLabels.includes("Collection"),
        imageLabel: initialProduct?.imageLabel || "HRUSHE admin upload",
        accent: inferAccent(colors),
      };

      const meta: ProductAdminMeta = {
        productId: initialProduct?.id || product.slug || product.name,
        status: form.status,
        fitType: form.fitType,
        gender: form.gender,
        collectionLabels,
        galleryImages: form.galleryImages,
      };

      await onSubmit({ product, meta });
      pushToast(`${initialProduct ? "Product updated" : "Product created"} successfully.`);
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Could not save product.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader eyebrow="Product management" title={title} description={description} />

      <form className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]" onSubmit={(event) => void handleSubmit(event)}>
        <div className="space-y-6">
          <AdminPanel>
            <AdminSectionLabel>Product information</AdminSectionLabel>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <AdminField label="Product name">
                <AdminFilterInput
                  value={form.name}
                  onChange={(event) => {
                    updateForm("name", event.target.value);
                    if (!slugEdited) {
                      updateForm("slug", slugify(event.target.value));
                    }
                  }}
                  required
                />
              </AdminField>
              <AdminField label="Slug">
                <AdminFilterInput
                  value={form.slug}
                  onChange={(event) => {
                    setSlugEdited(true);
                    updateForm("slug", slugify(event.target.value));
                  }}
                  required
                />
              </AdminField>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <AdminField label="Price">
                <AdminFilterInput
                  value={form.price}
                  onChange={(event) => updateForm("price", event.target.value)}
                  inputMode="decimal"
                  required
                />
              </AdminField>
              <AdminField label="Compare-at price">
                <AdminFilterInput
                  value={form.compareAtPrice}
                  onChange={(event) => updateForm("compareAtPrice", event.target.value)}
                  inputMode="decimal"
                />
              </AdminField>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <AdminField label="Primary category">
                <select
                  value={form.category}
                  onChange={(event) => updateForm("category", event.target.value)}
                  className="min-h-12 border border-[color:color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_78%,transparent)] px-4 text-sm"
                >
                  {categoryOptions.length ? null : (
                    <option value="">No categories added yet</option>
                  )}
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </AdminField>
              <div className="flex items-end">
                <p className="text-xs leading-6 text-[var(--muted)]">
                  Add or remove available categories from the Categories section. Products now use one
                  primary category only.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <AdminField label="Product description">
                <AdminTextArea
                  value={form.description}
                  onChange={(event) => updateForm("description", event.target.value)}
                  required
                />
              </AdminField>
            </div>
          </AdminPanel>

          <AdminPanel>
            <AdminSectionLabel>Inventory</AdminSectionLabel>
            <div className="mt-5">
              <AdminSwitch
                checked={form.trackInventory}
                onChange={(checked) => updateForm("trackInventory", checked)}
                label="Track variant stock"
                description="Reserve stock during payment and prevent checkout when a size and color sells out."
              />
            </div>
            {form.trackInventory ? (
              inventoryRows.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {inventoryRows.map((variant) => (
                    <div
                      key={`${variant.size}-${variant.color}`}
                      className="grid gap-3 border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] p-4 md:grid-cols-[0.7fr_1.5fr_0.7fr_auto] md:items-end"
                    >
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">Option</p>
                        <p className="mt-2 text-sm font-semibold">{variant.color || "Default"} / {variant.size}</p>
                      </div>
                      <AdminField label="SKU">
                        <AdminFilterInput
                          value={variant.sku || ""}
                          onChange={(event) =>
                            updateVariant(variant.size, variant.color, "sku", event.target.value.toUpperCase())
                          }
                        />
                      </AdminField>
                      <AdminField label="Available stock">
                        <AdminFilterInput
                          value={String(variant.stock)}
                          inputMode="numeric"
                          onChange={(event) =>
                            updateVariant(
                              variant.size,
                              variant.color,
                              "stock",
                              Math.max(0, Number.parseInt(event.target.value, 10) || 0)
                            )
                          }
                        />
                      </AdminField>
                      <label className="flex min-h-12 items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={variant.active}
                          onChange={(event) =>
                            updateVariant(variant.size, variant.color, "active", event.target.checked)
                          }
                        />
                        Sellable
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-5 border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] px-4 py-3 text-sm text-[var(--muted)]">
                  Select at least one size and add a color to create inventory variants.
                </p>
              )
            ) : null}
          </AdminPanel>

          <AdminPanel>
            <AdminSectionLabel>Attributes</AdminSectionLabel>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <AdminField label="Colors" hint="Comma-separated values shown on the storefront.">
                <AdminFilterInput
                  value={form.colors}
                  onChange={(event) => updateForm("colors", event.target.value)}
                />
              </AdminField>
              <AdminField label="Gender">
                <select
                  value={form.gender}
                  onChange={(event) => updateForm("gender", event.target.value as ProductGender)}
                  className="min-h-12 border border-[color:color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_78%,transparent)] px-4 text-sm"
                >
                  {genderOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </AdminField>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <AdminField label="Fit type">
                <div className="grid grid-cols-2 gap-3">
                  {fitOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => updateForm("fitType", option)}
                      className={`px-4 py-3 text-sm font-medium ${
                        form.fitType === option
                          ? "bg-[var(--foreground)] text-[var(--background)]"
                          : "border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_82%,transparent)]"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </AdminField>

              <AdminField label="Product status">
                <select
                  value={form.status}
                  onChange={(event) => updateForm("status", event.target.value as ProductStatus)}
                  className="min-h-12 border border-[color:color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_78%,transparent)] px-4 text-sm"
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </AdminField>
            </div>

            <div className="mt-5">
              <p className="text-sm font-medium text-[var(--foreground)]">Sizes</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {sizeOptions.map((size) => {
                  const selected = form.sizes.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() =>
                        updateForm(
                          "sizes",
                          selected
                            ? form.sizes.filter((item) => item !== size)
                            : [...form.sizes, size]
                        )
                      }
                      className={`px-4 py-2 text-sm ${
                        selected
                          ? "bg-[var(--foreground)] text-[var(--background)]"
                          : "border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_82%,transparent)]"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-medium text-[var(--foreground)]">Collection labels</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {labelOptions.map((label) => {
                  const selected = form.collectionLabels.includes(label);
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() =>
                        updateForm(
                          "collectionLabels",
                          selected
                            ? form.collectionLabels.filter((item) => item !== label)
                            : [...form.collectionLabels, label]
                        )
                      }
                      className={`px-4 py-2 text-sm ${
                        selected
                          ? "bg-[var(--foreground)] text-[var(--background)]"
                          : "border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_82%,transparent)]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </AdminPanel>

          <AdminPanel>
            <AdminSectionLabel>Fabric & care</AdminSectionLabel>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <AdminField label="Fabric" hint="Example: Premium cotton jersey.">
                <AdminFilterInput
                  value={form.fabric}
                  onChange={(event) => updateForm("fabric", event.target.value)}
                />
              </AdminField>
              <AdminField label="GSM" hint="Example: 240 GSM.">
                <AdminFilterInput
                  value={form.gsm}
                  onChange={(event) => updateForm("gsm", event.target.value)}
                />
              </AdminField>
              <AdminField label="Cotton type" hint="Example: Combed compact cotton.">
                <AdminFilterInput
                  value={form.cottonType}
                  onChange={(event) => updateForm("cottonType", event.target.value)}
                />
              </AdminField>
              <AdminField label="Feel" hint="Short customer-facing texture note.">
                <AdminFilterInput
                  value={form.feel}
                  onChange={(event) => updateForm("feel", event.target.value)}
                />
              </AdminField>
              <AdminField label="Weight" hint="Example: Mid-weight everyday structure.">
                <AdminFilterInput
                  value={form.weight}
                  onChange={(event) => updateForm("weight", event.target.value)}
                />
              </AdminField>
              <AdminField label="Quality note" hint="Quiet reassurance shown on the PDP.">
                <AdminFilterInput
                  value={form.qualityNote}
                  onChange={(event) => updateForm("qualityNote", event.target.value)}
                />
              </AdminField>
            </div>
            <div className="mt-4">
              <AdminField label="Wash care" hint="Shown in the Wash care section on product pages.">
                <AdminTextArea
                  value={form.washCare}
                  onChange={(event) => updateForm("washCare", event.target.value)}
                />
              </AdminField>
            </div>
            <div className="mt-6 border-t border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] pt-5">
              <p className="text-sm font-medium text-[var(--foreground)]">Size measurements</p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                Garment measurements in inches. Select product sizes above to edit their chart rows.
              </p>
              {selectedSizeGuideRows.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {selectedSizeGuideRows.map((row) => (
                    <div
                      key={row.size}
                      className="border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] p-4"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--foreground)]">
                        Size {row.size}
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <AdminField label="Chest">
                          <AdminFilterInput
                            value={row.chest}
                            inputMode="decimal"
                            onChange={(event) =>
                              updateSizeMeasurement(row.size, "chest", event.target.value)
                            }
                          />
                        </AdminField>
                        <AdminField label="Length">
                          <AdminFilterInput
                            value={row.length}
                            inputMode="decimal"
                            onChange={(event) =>
                              updateSizeMeasurement(row.size, "length", event.target.value)
                            }
                          />
                        </AdminField>
                        <AdminField label="Shoulder">
                          <AdminFilterInput
                            value={row.shoulder}
                            inputMode="decimal"
                            onChange={(event) =>
                              updateSizeMeasurement(row.size, "shoulder", event.target.value)
                            }
                          />
                        </AdminField>
                        <AdminField label="Sleeve">
                          <AdminFilterInput
                            value={row.sleeve}
                            inputMode="decimal"
                            onChange={(event) =>
                              updateSizeMeasurement(row.size, "sleeve", event.target.value)
                            }
                          />
                        </AdminField>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] px-4 py-3 text-sm text-[var(--muted)]">
                  Select at least one product size to build the size chart.
                </p>
              )}
            </div>
          </AdminPanel>
        </div>

        <div className="space-y-6">
          <AdminPanel>
            <AdminSectionLabel>Media</AdminSectionLabel>
            <div className="mt-5 space-y-5">
              <AdminField label="Product images" hint="Primary storefront media. The first image is used as the lead product image.">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => void uploadImages(event.target.files, "images", 960)}
                  className="block w-full text-sm text-[var(--muted)] file:mr-4 file:border-0 file:bg-[var(--foreground)] file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-[var(--background)]"
                />
              </AdminField>
              <AdminField label="Gallery images" hint="Extra editorial frames for rich product storytelling.">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => void uploadImages(event.target.files, "galleryImages", 1080)}
                  className="block w-full text-sm text-[var(--muted)] file:mr-4 file:border-0 file:bg-[var(--foreground)] file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-[var(--background)]"
                />
              </AdminField>
              <AdminField label="Product gallery videos" hint="Videos appear inside the storefront product media gallery with the product images.">
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/ogg"
                  multiple
                  onChange={(event) => {
                    void uploadProductVideos(event.target.files);
                    event.target.value = "";
                  }}
                  className="block w-full text-sm text-[var(--muted)] file:mr-4 file:border-0 file:bg-[var(--foreground)] file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-[var(--background)]"
                />
              </AdminField>
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <AdminFilterInput
                  value={form.videoTitleDraft}
                  onChange={(event) => updateForm("videoTitleDraft", event.target.value)}
                  placeholder="Video title"
                />
                <AdminFilterInput
                  value={form.videoUrlDraft}
                  onChange={(event) => updateForm("videoUrlDraft", event.target.value)}
                  placeholder="Hosted video URL"
                />
                <button
                  type="button"
                  onClick={addProductVideoUrl}
                  className="button-secondary min-h-12 px-4 text-sm font-medium"
                >
                  Add video
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {form.images.map((image, index) => (
                <MediaCard
                  key={`image-${index}-${image.slice(0, 16)}`}
                  image={image}
                  label={index === 0 ? "Primary" : `Image ${index + 1}`}
                  onRemove={() => updateForm("images", form.images.filter((_, itemIndex) => itemIndex !== index))}
                />
              ))}
            </div>

            {form.galleryImages.length ? (
              <>
                <p className="mt-5 text-sm font-medium text-[var(--foreground)]">Gallery</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {form.galleryImages.map((image, index) => (
                    <MediaCard
                      key={`gallery-${index}-${image.slice(0, 16)}`}
                      image={image}
                      label={`Gallery ${index + 1}`}
                      onRemove={() =>
                        updateForm(
                          "galleryImages",
                          form.galleryImages.filter((_, itemIndex) => itemIndex !== index)
                        )
                      }
                    />
                  ))}
                </div>
              </>
            ) : null}

            {form.videos.length ? (
              <>
                <p className="mt-5 text-sm font-medium text-[var(--foreground)]">Gallery videos</p>
                <div className="mt-3 space-y-3">
                  {form.videos.map((video, index) => (
                    <VideoCard
                      key={`${video.id}-${index}`}
                      video={video}
                      label={`Video ${index + 1}`}
                      onRemove={() =>
                        updateForm(
                          "videos",
                          form.videos.filter((_, itemIndex) => itemIndex !== index)
                        )
                      }
                    />
                  ))}
                </div>
              </>
            ) : null}
          </AdminPanel>

          <AdminPanel>
            <AdminSectionLabel>Readiness</AdminSectionLabel>
            <div className="mt-5 space-y-4">
              <SummaryRow label="Category structure" value={parsedCategories.join(", ") || "Not set"} />
              <SummaryRow label="Color palette" value={parsedColors.join(", ") || "Not set"} />
              <SummaryRow label="Discount" value={discountPercentage > 0 ? `${discountPercentage}% off` : "No compare-at price"} />
              <SummaryRow label="Fabric notes" value={form.fabric || form.cottonType || "Fallback copy"} />
              <SummaryRow label="Visibility" value={form.status} />
              <SummaryRow
                label="Inventory"
                value={form.trackInventory ? `${inventoryRows.reduce((sum, variant) => sum + variant.stock, 0)} units tracked` : "Not tracked"}
              />
            </div>
            <div className="mt-5">
              <AdminSwitch
                checked={form.collectionLabels.includes("Featured")}
                onChange={(checked) =>
                  updateForm(
                    "collectionLabels",
                    checked
                      ? Array.from(new Set([...form.collectionLabels, "Featured"]))
                      : form.collectionLabels.filter((label) => label !== "Featured")
                  )
                }
                label="Feature on storefront"
                description="Keep this synced with the collection label for homepage merchandising."
              />
            </div>
          </AdminPanel>

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={submitting} className="button-primary px-6 py-3 text-sm font-medium disabled:opacity-60">
              {submitting ? "Saving..." : submitLabel}
            </button>
            <span className="text-sm text-[var(--muted)]">
              Products save with auto-generated database IDs and server-validated variant stock.
            </span>
          </div>
        </div>
      </form>
    </div>
  );
}

function MediaCard({
  image,
  label,
  onRemove,
}: {
  image: string;
  label: string;
  onRemove: () => void;
}) {
  return (
    <div className="relative overflow-hidden border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface-strong)_84%,transparent)]">
      <div className="relative aspect-square">
        <Image src={image} alt={label} fill unoptimized className="object-cover" />
      </div>
      <div className="flex items-center justify-between gap-3 px-3 py-3">
        <span className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{label}</span>
        <button type="button" onClick={onRemove} className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--danger)]">
          Remove
        </button>
      </div>
    </div>
  );
}

function VideoCard({
  video,
  label,
  onRemove,
}: {
  video: ProductVideo;
  label: string;
  onRemove: () => void;
}) {
  return (
    <div className="overflow-hidden border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface-strong)_84%,transparent)]">
      <div className="relative aspect-video bg-black">
        <video
          src={video.url}
          poster={video.posterUrl || undefined}
          controls
          playsInline
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex items-center justify-between gap-3 px-3 py-3">
        <div className="min-w-0">
          <span className="block text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{label}</span>
          <p className="mt-1 truncate text-sm font-medium text-[var(--foreground)]">{video.title}</p>
        </div>
        <button type="button" onClick={onRemove} className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--danger)]">
          Remove
        </button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}
