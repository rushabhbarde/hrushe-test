"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import {
  AdminConfirmDialog,
  AdminFilterInput,
  AdminFilterSelect,
  AdminTextArea,
} from "@/components/admin-ui";
import { useToast } from "@/components/toast-provider";
import {
  type Product,
  type ProductCollectionLabel,
  type ProductSizeMeasurement,
  type ProductVideo,
  type ProductStatus,
} from "@/lib/catalog";
import { formatAdminCurrency } from "@/lib/admin";
import { resolveCatalogCategories, resolveProductAdminMeta } from "@/lib/admin-workspace";
import { useAdminWorkspace } from "@/lib/use-admin-workspace";
import { useStorefrontData } from "@/lib/use-storefront";

const LOW_STOCK = 3;

/** Units free to sell per size: stock minus what open checkouts hold. */
function stockBySize(product: Product) {
  const sizes = product.sizes.length > 0 ? product.sizes : Array.from(new Set(product.variants?.map((v) => v.size) || []));
  return sizes.slice(0, 6).map((size) => {
    const units = (product.variants || [])
      .filter((variant) => variant.size === size && variant.active !== false)
      .reduce((total, variant) => total + Math.max(0, (variant.stock || 0) - (variant.reserved || 0)), 0);
    return { size, units };
  });
}

const statusWords: Array<{ key: string; label: string }> = [
  { key: "all", label: "All" },
  { key: "Active", label: "Live" },
  { key: "Draft", label: "Draft" },
  { key: "Hidden", label: "Hidden" },
  { key: "Sold Out", label: "Sold out" },
];

type BulkUploadPayload = Array<{
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  category?: string;
  categories?: string[];
  colors?: string[];
  sizes?: string[];
  status?: ProductStatus;
  fitType?: "Oversized" | "Regular";
  gender?: "Men" | "Women" | "Unisex";
  collectionLabels?: ProductCollectionLabel[];
  images?: string[];
  videos?: ProductVideo[];
  galleryImages?: string[];
  fabric?: string;
  gsm?: string;
  cottonType?: string;
  feel?: string;
  weight?: string;
  washCare?: string;
  qualityNote?: string;
  sizeGuide?: ProductSizeMeasurement[];
}>;

export default function AdminProductsPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useStorefrontData({ admin: true });
  const { workspace, saveWorkspace } = useAdminWorkspace();
  const { pushToast } = useToast();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<ProductStatus>("Active");
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [bulkUploadText, setBulkUploadText] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const categoryOptions = useMemo(
    () =>
      resolveCatalogCategories(
        workspace,
        products.flatMap((product) => [product.category, ...(product.categories || [])])
      ),
    [products, workspace]
  );

  const productRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products
      .map((product) => ({
        product,
        meta: resolveProductAdminMeta(workspace, product),
      }))
      .filter(({ product, meta }) => {
        const matchesQuery =
          !normalizedQuery ||
          [product.name, product.slug || "", product.category, ...(product.categories || []), ...(product.colors || [])]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery);
        const matchesCategory =
          categoryFilter === "all" ||
          product.category === categoryFilter ||
          product.categories?.includes(categoryFilter);
        const matchesStatus = statusFilter === "all" || meta.status === statusFilter;
        return matchesQuery && matchesCategory && matchesStatus;
      })
      .sort((left, right) => left.product.name.localeCompare(right.product.name));
  }, [categoryFilter, products, query, statusFilter, workspace]);

  async function handleDuplicate(product: Product) {
    const meta = resolveProductAdminMeta(workspace, product);
    const duplicate = await addProduct({
      ...product,
      id: "",
      slug: product.slug ? `${product.slug}-copy-${Date.now().toString(36)}` : undefined,
      name: `${product.name} Copy`,
      status: "Draft",
    });

    await saveWorkspace(() => ({
      productMeta: {
        [duplicate.id]: {
          ...meta,
          productId: duplicate.id,
          status: duplicate.status || "Draft",
        },
      },
    }));

    pushToast("Product duplicated.");
  }

  async function applyBulkStatus() {
    if (!selectedIds.length) {
      return;
    }

    try {
      const nextMeta: NonNullable<Parameters<typeof saveWorkspace>[0]> = (current) => ({
        productMeta: Object.fromEntries(
          selectedIds
            .map((productId) => {
              const product = products.find((item) => item.id === productId);
              if (!product) {
                return null;
              }

              return [
                productId,
                {
                  ...resolveProductAdminMeta(current, product),
                  productId,
                  status: bulkStatus,
                },
              ] as const;
            })
            .filter((entry): entry is readonly [string, ReturnType<typeof resolveProductAdminMeta>] => Boolean(entry))
        ),
      });

      for (const productId of selectedIds) {
        const product = products.find((item) => item.id === productId);
        if (!product) continue;
        await updateProduct(productId, { ...product, status: bulkStatus });
      }

      await saveWorkspace(nextMeta);
      pushToast(`Updated ${selectedIds.length} product${selectedIds.length > 1 ? "s" : ""}.`);
      setSelectedIds([]);
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Could not update product status.", "error");
    }
  }

  async function handleBulkUpload() {
    try {
      const parsed = JSON.parse(bulkUploadText) as BulkUploadPayload;

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("Bulk upload expects a JSON array of product objects.");
      }

      const nextProductMeta: Record<string, ReturnType<typeof resolveProductAdminMeta>> = {};

      for (const entry of parsed) {
        const created = await addProduct({
          id: "",
          name: entry.name,
          slug: undefined,
          description: entry.description,
          price: entry.price,
          compareAtPrice: entry.compareAtPrice,
          category: entry.category || categoryOptions[0] || "Uncategorized",
          categories:
            entry.categories || [entry.category || categoryOptions[0] || "Uncategorized"],
          colors: entry.colors || [],
          sizes: entry.sizes || ["M"],
          images: entry.images || [],
          videos: entry.videos || [],
          galleryImages: entry.galleryImages || [],
          fabric: entry.fabric || "",
          gsm: entry.gsm || "",
          cottonType: entry.cottonType || "",
          feel: entry.feel || "",
          weight: entry.weight || "",
          washCare: entry.washCare || "",
          qualityNote: entry.qualityNote || "",
          sizeGuide: entry.sizeGuide || [],
          fitType: entry.fitType || "Regular",
          gender: entry.gender || "Unisex",
          collectionLabels: entry.collectionLabels || [],
          status: entry.status || "Draft",
          featured: (entry.collectionLabels || []).includes("Featured"),
          newIn: false,
          bestSeller: false,
          newArrival: false,
          imageLabel: "Bulk upload",
          accent: "#111111",
        });

        nextProductMeta[created.id] = {
          productId: created.id,
          status: entry.status || "Draft",
          fitType: entry.fitType || "Regular",
          gender: entry.gender || "Unisex",
          collectionLabels: entry.collectionLabels || [],
          galleryImages: entry.galleryImages || [],
        };
      }

      await saveWorkspace(() => ({ productMeta: nextProductMeta }));
      setBulkUploadOpen(false);
      setBulkUploadText("");
      pushToast("Bulk upload completed.");
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Could not import products.", "error");
    }
  }

  return (
    <AdminShell>
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <nav aria-label="Piece status" className="flex flex-wrap gap-x-10 gap-y-3">
            {statusWords.map((word) => {
              const total =
                word.key === "all"
                  ? products.length
                  : products.filter((product) => resolveProductAdminMeta(workspace, product).status === word.key).length;
              const active = statusFilter === word.key;
              return (
                <button
                  key={word.key}
                  type="button"
                  onClick={() => setStatusFilter(word.key)}
                  aria-pressed={active}
                  className={`fr-choice flex items-baseline gap-3 ${active ? "is-active" : ""}`}
                >
                  <span className="fr-word text-[clamp(2.25rem,4.5vw,3.5rem)]">{word.label}</span>
                  <span className="fr-mono">{String(total).padStart(2, "0")}</span>
                </button>
              );
            })}
          </nav>
          <div className="flex gap-3">
            <Link href="/admin/add-product" className="fr-button w-auto! px-7">
              Add a piece
            </Link>
            <button
              type="button"
              onClick={() => setBulkUploadOpen((current) => !current)}
              className="fr-mono min-h-[3.25rem] border border-[var(--foreground)] px-6"
            >
              Bulk upload
            </button>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <AdminFilterInput
            aria-label="Search pieces"
            placeholder="Name, slug, category or colour"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <AdminFilterSelect aria-label="Category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="all">Every category</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </AdminFilterSelect>
        </div>

        {selectedIds.length ? (
          <div className="flex flex-wrap items-center gap-5 border-y border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] py-4">
            <span className="fr-mono">{String(selectedIds.length).padStart(2, "0")} selected</span>
            <AdminFilterSelect
              aria-label="Set status"
              value={bulkStatus}
              onChange={(event) => setBulkStatus(event.target.value as ProductStatus)}
              className="max-w-[200px]"
            >
              {["Active", "Draft", "Hidden", "Sold Out"].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </AdminFilterSelect>
            <button type="button" onClick={() => void applyBulkStatus()} className="fr-button w-auto! px-6">
              Apply
            </button>
            <button type="button" onClick={() => setSelectedIds([])} className="fr-mono fr-choice fr-link is-active">
              Clear
            </button>
          </div>
        ) : null}

        {bulkUploadOpen ? (
          <div className="flex flex-col gap-4 border-y border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] py-6">
            <span className="fr-mono">Bulk upload · JSON</span>
            <p className="max-w-2xl text-sm text-[var(--muted)]">
              Paste a JSON array of pieces with fields like name, description, price, status, fitType and collectionLabels.
            </p>
            <AdminTextArea
              aria-label="Bulk upload JSON"
              value={bulkUploadText}
              onChange={(event) => setBulkUploadText(event.target.value)}
              placeholder='[{"name":"Piece name","description":"Factual description","price":1499,"status":"Draft"}]'
            />
            <div className="flex gap-3">
              <button type="button" onClick={() => void handleBulkUpload()} className="fr-button w-auto! px-6">
                Import
              </button>
              <button type="button" onClick={() => setBulkUploadOpen(false)} className="fr-mono fr-choice fr-link is-active">
                Close
              </button>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col">
          <div className="fr-mono fr-muted flex justify-between border-b border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] pb-3">
            <span>
              {String(productRows.length).padStart(2, "0")} pieces · units free per size · underlined = {LOW_STOCK} or fewer
            </span>
            <span className="hidden lg:inline">Status · price</span>
          </div>
          {productRows.map(({ product, meta }) => {
            const sizes = stockBySize(product);
            return (
              <div
                key={product.id}
                className="grid grid-cols-[auto_3rem_minmax(0,1fr)] items-center gap-x-4 gap-y-3 border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] py-4 lg:grid-cols-[auto_3rem_minmax(0,1fr)_auto_8rem_auto]"
              >
                <input
                  type="checkbox"
                  aria-label={`Select ${product.name}`}
                  checked={selectedIds.includes(product.id)}
                  onChange={(event) =>
                    setSelectedIds((current) =>
                      event.target.checked ? [...current, product.id] : current.filter((id) => id !== product.id)
                    )
                  }
                />
                <Link href={`/admin/products/${product.id}`} aria-hidden="true" tabIndex={-1} className="fr-frame block aspect-[4/5] w-12">
                  {product.images[0] ? (
                    <span className="fr-frame__layer is-active">
                      <Image src={product.images[0]} alt="" fill unoptimized sizes="48px" />
                    </span>
                  ) : null}
                </Link>
                <Link href={`/admin/products/${product.id}`} className="min-w-0">
                  <span className="fr-word block truncate text-[clamp(1.75rem,3.5vw,3rem)]">{product.name}</span>
                  <span className="fr-mono fr-muted mt-1 block">
                    {[product.category, meta.gender, product.colors[0]].filter(Boolean).join(" · ")}
                  </span>
                </Link>
                <div className="col-span-3 flex gap-6 lg:col-span-1">
                  {product.trackInventory === false ? (
                    <span className="fr-mono fr-muted">Stock not tracked</span>
                  ) : (
                    sizes.map(({ size, units }) => (
                      <span key={size} className="flex flex-col items-center gap-1">
                        <span className="fr-mono fr-muted">{size}</span>
                        <span
                          className={`fr-word text-[1.75rem] ${
                            units <= LOW_STOCK ? "underline decoration-2 underline-offset-[6px]" : "fr-quiet"
                          }`}
                        >
                          {String(units).padStart(2, "0")}
                        </span>
                      </span>
                    ))
                  )}
                </div>
                <div className="col-span-3 flex items-baseline gap-4 lg:col-span-1 lg:flex-col lg:items-end lg:gap-1">
                  <span className={`fr-mono ${meta.status === "Active" ? "" : "fr-muted"}`}>
                    {meta.status === "Active" ? "Live" : meta.status}
                  </span>
                  <span className="text-sm">{formatAdminCurrency(product.price)}</span>
                </div>
                <div className="col-span-3 flex gap-5 lg:col-span-1 lg:flex-col lg:items-end lg:gap-1">
                  <button type="button" onClick={() => void handleDuplicate(product)} className="fr-mono fr-choice">
                    Duplicate
                  </button>
                  <button type="button" onClick={() => setDeleteTarget(product)} className="fr-mono fr-choice">
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
          {productRows.length === 0 ? <p className="fr-mono fr-muted py-10">No pieces match.</p> : null}
        </div>
      </div>

      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete ${deleteTarget?.name || "this product"}?`}
        description="This permanently removes the product from the storefront and catalog list."
        confirmLabel="Delete product"
        destructive
        onConfirm={() => {
          if (!deleteTarget) {
            return;
          }
          void deleteProduct(deleteTarget.id).then(async () => {
            await saveWorkspace((current) => {
              const nextMeta = { ...current.productMeta };
              delete nextMeta[deleteTarget.id];

              return { productMeta: nextMeta };
            });
            setDeleteTarget(null);
            pushToast("Product deleted.");
          });
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminShell>
  );
}
