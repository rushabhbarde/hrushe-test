"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import {
  AdminBadge,
  AdminConfirmDialog,
  AdminFilterInput,
  AdminFilterSelect,
  AdminPageHeader,
  AdminPanel,
  AdminSubhead,
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
import { formatAdminCurrency, productStatusTone } from "@/lib/admin";
import { resolveCatalogCategories, resolveProductAdminMeta } from "@/lib/admin-workspace";
import { useAdminWorkspace } from "@/lib/use-admin-workspace";
import { useStorefrontData } from "@/lib/use-storefront";

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

  const stats = useMemo(
    () => ({
      active: productRows.filter((row) => row.meta.status === "Active").length,
      draft: productRows.filter((row) => row.meta.status === "Draft").length,
      hidden: productRows.filter((row) => row.meta.status === "Hidden").length,
      soldOut: productRows.filter((row) => row.meta.status === "Sold Out").length,
    }),
    [productRows]
  );

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
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Products"
          title="Merchandise the full HRUSHE catalog with precision."
          description="Search, filter, duplicate, bulk edit, and bulk upload products while keeping manual status control completely separate from inventory."
          actions={
            <>
              <button
                type="button"
                onClick={() => setBulkUploadOpen((current) => !current)}
                className="button-secondary px-5 py-3 text-sm font-medium"
              >
                Bulk upload
              </button>
              <Link href="/admin/add-product" className="button-primary px-5 py-3 text-sm font-medium">
                Create product
              </Link>
            </>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <CatalogStat label="Active" value={String(stats.active)} />
          <CatalogStat label="Draft" value={String(stats.draft)} />
          <CatalogStat label="Hidden" value={String(stats.hidden)} />
          <CatalogStat label="Sold out" value={String(stats.soldOut)} />
        </div>

        <AdminPanel>
          <AdminSubhead title="Search and filters" description="Manage visibility, collection labels, and product setup from one table." />
          <div className="grid gap-3 lg:grid-cols-[1.5fr_repeat(2,minmax(0,1fr))]">
            <AdminFilterInput
              placeholder="Search by name, slug, category, color"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <AdminFilterSelect value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="all">All categories</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </AdminFilterSelect>
            <AdminFilterSelect value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              {["Active", "Draft", "Hidden", "Sold Out"].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </AdminFilterSelect>
          </div>

          {selectedIds.length ? (
            <div className="mt-5 flex flex-wrap items-center gap-3 border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] px-4 py-4">
              <p className="text-sm font-medium">{selectedIds.length} selected</p>
              <AdminFilterSelect value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value as ProductStatus)} className="max-w-[220px]">
                {["Active", "Draft", "Hidden", "Sold Out"].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </AdminFilterSelect>
              <button type="button" onClick={() => void applyBulkStatus()} className="button-primary px-4 py-2.5 text-sm font-medium">
                Apply bulk edit
              </button>
            </div>
          ) : null}

          {bulkUploadOpen ? (
            <div className="mt-5 border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] p-4">
              <p className="text-sm font-semibold">Bulk upload JSON</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Paste a JSON array with product objects including fields like `name`, `description`, `price`, `status`, `fitType`, and `collectionLabels`.
              </p>
              <AdminTextArea
                className="mt-4"
                value={bulkUploadText}
                onChange={(event) => setBulkUploadText(event.target.value)}
                placeholder='[{"name":"Product name","description":"Factual product description","price":1499,"status":"Draft"}]'
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={() => void handleBulkUpload()} className="button-primary px-4 py-2.5 text-sm font-medium">
                  Import products
                </button>
                <button type="button" onClick={() => setBulkUploadOpen(false)} className="button-secondary px-4 py-2.5 text-sm font-medium">
                  Close
                </button>
              </div>
            </div>
          ) : null}

          <div className="mt-5 overflow-hidden border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)]">
            <div className="hidden grid-cols-[48px_minmax(0,1.4fr)_160px_160px_140px_180px] gap-3 border-b border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--foreground)_4%,transparent)] px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)] lg:grid">
              <span />
              <span>Product</span>
              <span>Status</span>
              <span>Labels</span>
              <span>Price</span>
              <span className="text-right">Actions</span>
            </div>

            <div className="divide-y divide-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)]">
              {productRows.map(({ product, meta }) => (
                <div key={product.id} className="grid gap-4 px-4 py-4 lg:grid-cols-[48px_minmax(0,1.4fr)_160px_160px_140px_180px] lg:px-5">
                  <label className="flex items-start justify-center pt-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(product.id)}
                      onChange={(event) =>
                        setSelectedIds((current) =>
                          event.target.checked
                            ? [...current, product.id]
                            : current.filter((id) => id !== product.id)
                        )
                      }
                    />
                  </label>

                  <div className="flex items-start gap-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden border border-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--surface-strong)_84%,transparent)]">
                      {product.images[0] ? (
                        <Image src={product.images[0]} alt={product.name} fill unoptimized className="object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-semibold tracking-[-0.02em]">{product.name}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">{product.slug || "Slug pending"}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                        {product.category} · {meta.fitType} · {meta.gender}
                      </p>
                    </div>
                  </div>

                  <div>
                    <AdminBadge tone={productStatusTone(meta.status)}>{meta.status}</AdminBadge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {meta.collectionLabels.length ? (
                      meta.collectionLabels.map((label) => (
                        <AdminBadge key={`${product.id}-${label}`} tone="accent">
                          {label}
                        </AdminBadge>
                      ))
                    ) : (
                      <p className="text-sm text-[var(--muted)]">No labels</p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-semibold">{formatAdminCurrency(product.price)}</p>
                    {product.compareAtPrice ? (
                      <p className="mt-1 text-sm text-[var(--muted)] line-through">
                        {formatAdminCurrency(product.compareAtPrice)}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                    <Link href={`/admin/products/${product.id}`} className="button-secondary px-4 py-2.5 text-xs font-medium uppercase tracking-[0.16em]">
                      Edit
                    </Link>
                    <button type="button" onClick={() => void handleDuplicate(product)} className="button-secondary px-4 py-2.5 text-xs font-medium uppercase tracking-[0.16em]">
                      Duplicate
                    </button>
                    <button type="button" onClick={() => setDeleteTarget(product)} className="px-4 py-2.5 text-xs font-medium uppercase tracking-[0.16em] text-[var(--danger)]">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AdminPanel>
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

function CatalogStat({ label, value }: { label: string; value: string }) {
  return (
    <AdminPanel>
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <p className="mt-4 text-3xl font-semibold tracking-[-0.04em]">{value}</p>
    </AdminPanel>
  );
}
