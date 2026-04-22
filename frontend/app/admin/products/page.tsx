"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import {
  AdminActionButton,
  AdminBadge,
  AdminFilterInput,
  AdminFilterSelect,
  AdminPageHeader,
  AdminPanel,
  AdminSectionLabel,
  AdminSubhead,
} from "@/components/admin-ui";
import { categories, type Product } from "@/lib/catalog";
import { deriveProductStatus, formatAdminCurrency } from "@/lib/admin";
import { useStorefrontData } from "@/lib/use-storefront";

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "price-high", label: "Price high to low" },
  { value: "price-low", label: "Price low to high" },
  { value: "best-selling", label: "Best-selling first" },
  { value: "alphabetical", label: "Alphabetical" },
];

export default function AdminProductsPage() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("query") || "";
  const statusParam = searchParams.get("status") || "all";
  const { products, deleteProduct } = useStorefrontData();
  const [query, setQuery] = useState(queryParam);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState(statusParam);
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    setQuery(queryParam);
  }, [queryParam]);

  useEffect(() => {
    setStatusFilter(statusParam);
  }, [statusParam]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const nextProducts = products.filter((product) => {
      const status = deriveProductStatus(product);
      const matchesQuery =
        !normalizedQuery ||
        [product.name, product.category, ...(product.categories || []), product.slug || ""]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesCategory =
        categoryFilter === "all" ||
        product.category === categoryFilter ||
        product.categories?.includes(categoryFilter);
      const matchesStatus = statusFilter === "all" || status === statusFilter;

      return matchesQuery && matchesCategory && matchesStatus;
    });

    nextProducts.sort((left, right) => {
      if (sortBy === "price-high") {
        return right.price - left.price;
      }
      if (sortBy === "price-low") {
        return left.price - right.price;
      }
      if (sortBy === "best-selling") {
        return Number(Boolean(right.bestSeller)) - Number(Boolean(left.bestSeller));
      }
      return left.name.localeCompare(right.name);
    });

    return nextProducts;
  }, [categoryFilter, products, query, sortBy, statusFilter]);

  const stats = {
    active: filteredProducts.filter((product) => deriveProductStatus(product) === "Active").length,
    drafts: filteredProducts.filter((product) => deriveProductStatus(product) === "Draft").length,
    featured: filteredProducts.filter((product) => product.featured).length,
    outOfStock: filteredProducts.filter((product) => product.sizes.length === 0).length,
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Catalog"
          title="Products built for fast merchandising."
          description="A structured catalog layer for launches, pricing, imagery, and visibility controls across the storefront."
          actions={
            <>
              <AdminActionButton href="/admin/collections" variant="secondary">
                Create collection
              </AdminActionButton>
              <AdminActionButton href="/admin/add-product">Add product</AdminActionButton>
            </>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ProductStat label="Visible products" value={String(stats.active)} />
          <ProductStat label="Drafts" value={String(stats.drafts)} />
          <ProductStat label="Featured" value={String(stats.featured)} />
          <ProductStat label="Needs stock" value={String(stats.outOfStock)} />
        </div>

        <AdminPanel>
          <AdminSubhead
            title="Catalog control"
            description="Search, filter, and act on products without jumping between disconnected screens."
          />

          <div className="grid gap-3 lg:grid-cols-[1.5fr_repeat(3,minmax(0,1fr))]">
            <AdminFilterInput
              placeholder="Search products, tags, slugs, collections"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <AdminFilterSelect value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </AdminFilterSelect>
            <AdminFilterSelect value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Out of Stock">Out of Stock</option>
            </AdminFilterSelect>
            <AdminFilterSelect value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </AdminFilterSelect>
          </div>

          <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-[rgba(17,17,17,0.08)]">
            <div className="hidden grid-cols-[minmax(0,1.3fr)_160px_110px_160px_120px_120px] gap-3 border-b border-[rgba(17,17,17,0.08)] bg-[rgba(17,17,17,0.03)] px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)] lg:grid">
              <span>Product</span>
              <span>Category</span>
              <span>Status</span>
              <span>Merchandising</span>
              <span>Price</span>
              <span className="text-right">Actions</span>
            </div>

            <div className="divide-y divide-[rgba(17,17,17,0.08)]">
              {filteredProducts.map((product) => (
                <ProductRow key={product.id} product={product} onDelete={deleteProduct} />
              ))}
            </div>
          </div>
        </AdminPanel>
      </div>
    </AdminShell>
  );
}

function ProductStat({ label, value }: { label: string; value: string }) {
  return (
    <AdminPanel className="min-h-[132px]">
      <AdminSectionLabel>{label}</AdminSectionLabel>
      <p className="mt-5 text-3xl font-semibold tracking-[-0.04em]">{value}</p>
    </AdminPanel>
  );
}

function ProductRow({
  product,
  onDelete,
}: {
  product: Product;
  onDelete: (id: string) => Promise<void>;
}) {
  const status = deriveProductStatus(product);

  return (
    <div className="grid gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1.3fr)_160px_110px_160px_120px_120px] lg:px-5">
      <div className="flex items-start gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[1.2rem] bg-[rgba(17,17,17,0.06)]">
          {product.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="min-w-0">
          <p className="text-base font-semibold tracking-[-0.02em]">{product.name}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">{product.slug || "No slug yet"}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.colors.slice(0, 4).map((color) => (
              <span key={color} className="rounded-full border border-[rgba(17,17,17,0.08)] px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
                {color}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium">{product.category}</p>
        <p className="text-sm text-[var(--muted)]">
          {(product.categories || []).filter((item) => item !== product.category).join(", ") || "No extra tags"}
        </p>
      </div>

      <div>
        <AdminBadge tone={status === "Draft" ? "warning" : status === "Out of Stock" ? "warning" : "default"}>
          {status}
        </AdminBadge>
      </div>

      <div className="flex flex-wrap gap-2">
        {product.featured ? <AdminBadge tone="accent">Featured</AdminBadge> : null}
        {product.bestSeller ? <AdminBadge>Best seller</AdminBadge> : null}
        {product.newIn ? <AdminBadge>New in</AdminBadge> : null}
        {product.newArrival ? <AdminBadge>New arrival</AdminBadge> : null}
      </div>

      <div>
        <p className="text-sm font-semibold">{formatAdminCurrency(product.price)}</p>
        {product.compareAtPrice ? (
          <p className="text-sm text-[var(--muted)] line-through">
            {formatAdminCurrency(product.compareAtPrice)}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link href={`/product/${product.slug || product.id}`} className="button-secondary rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.16em]">
          Preview
        </Link>
        <Link href={`/admin/products/${product.id}`} className="button-primary rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.16em]">
          Edit
        </Link>
        <button
          type="button"
          onClick={() => void onDelete(product.id)}
          className="rounded-full border border-[rgba(214,31,38,0.16)] px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-[var(--accent)]"
        >
          Archive
        </button>
      </div>
    </div>
  );
}
