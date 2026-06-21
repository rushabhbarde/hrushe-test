"use client";

import { useCallback, useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { isVisibleStorefrontProduct, sortProductsByStorefrontPriority } from "@/lib/catalog";
import { useStorefrontData } from "@/lib/use-storefront";
import { useDialogAccessibility } from "@/lib/use-dialog-accessibility";

type AvailabilityFilter = "all" | "available" | "new";
type SortOption = "edit" | "newest" | "price-low" | "price-high";

const swatchColors: Record<string, string> = {
  black: "#11110f",
  white: "#f8f7f2",
  beige: "#d8cbb6",
  begie: "#d8cbb6",
  cream: "#ede2d2",
  coffee: "#6f5847",
  brown: "#6f5847",
  maroon: "#711e2a",
  green: "#3f6149",
  grey: "#777772",
  gray: "#777772",
};

function productIsAvailable(product: ReturnType<typeof useStorefrontData>["products"][number]) {
  if (product.availability) {
    return product.availability === "available";
  }

  return !product.trackInventory || product.variants?.some((variant) => variant.active && variant.stock > 0);
}

export default function ShopPage() {
  const { products, loading } = useStorefrontData();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedColour, setSelectedColour] = useState("all");
  const [availability, setAvailability] = useState<AvailabilityFilter>("all");
  const [sort, setSort] = useState<SortOption>("edit");
  const closeFilters = useCallback(() => setFiltersOpen(false), []);
  const { dialogRef, initialFocusRef } = useDialogAccessibility(filtersOpen, closeFilters);

  const visibleProducts = useMemo(() => products.filter(isVisibleStorefrontProduct), [products]);
  const colours = useMemo(
    () => Array.from(new Set(visibleProducts.flatMap((product) => product.colors))).filter(Boolean),
    [visibleProducts]
  );
  const activeFilterCount =
    Number(selectedColour !== "all") + Number(availability !== "all");

  const filteredProducts = useMemo(() => {
    const filtered = visibleProducts.filter((product) => {
      const matchesColour =
        selectedColour === "all" ||
        product.colors.some((colour) => colour.toLowerCase() === selectedColour.toLowerCase());
      const matchesAvailability =
        availability === "all" ||
        (availability === "available" && productIsAvailable(product)) ||
        (availability === "new" && Boolean(product.newArrival || product.newIn));
      return matchesColour && matchesAvailability;
    });

    if (sort === "price-low") return [...filtered].sort((a, b) => a.price - b.price);
    if (sort === "price-high") return [...filtered].sort((a, b) => b.price - a.price);
    if (sort === "newest") {
      return [...filtered].sort(
        (a, b) => new Date(b.createdAt || b.updatedAt || 0).getTime() - new Date(a.createdAt || a.updatedAt || 0).getTime()
      );
    }
    return sortProductsByStorefrontPriority(filtered);
  }, [availability, selectedColour, sort, visibleProducts]);

  const clearFilters = () => {
    setSelectedColour("all");
    setAvailability("all");
  };

  return (
    <div className="page-shell bg-[var(--background)]">
      <SiteHeader />
      <main className="mx-auto max-w-[1600px] px-4 pb-24 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pb-32 lg:pt-24">
        <header className="grid gap-8 border-b border-[var(--border)] pb-10 lg:grid-cols-[1fr_0.7fr] lg:items-end lg:pb-14">
          <div>
            <p className="eyebrow text-[var(--muted)]">HRUSHE collection</p>
            <h1 className="mt-5 text-[2.75rem] font-medium uppercase leading-[0.92] tracking-[-0.045em] sm:text-[4rem] lg:text-[5.5rem]">
              The collection.
            </h1>
          </div>
          <p className="max-w-xl text-[0.94rem] leading-7 text-[var(--muted)] sm:text-base">
            A quiet collection of essentials, built with intention and designed to be worn your way.
          </p>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] py-5">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            {filteredProducts.length} {filteredProducts.length === 1 ? "piece" : "pieces"}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="inline-flex min-h-12 items-center border border-[var(--border)] px-5 text-[0.68rem] font-semibold uppercase tracking-[0.12em]"
            >
              Filter{activeFilterCount ? ` (${activeFilterCount})` : ""}
            </button>
            <label className="sr-only" htmlFor="shop-sort">Sort collection</label>
            <select
              id="shop-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
              className="min-h-12 border border-[var(--border)] bg-transparent px-4 text-[0.68rem] font-semibold uppercase tracking-[0.1em] outline-none"
            >
              <option value="edit">Curated edit</option>
              <option value="newest">Newest</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
            </select>
          </div>
        </div>

        <section className="pt-10 sm:pt-12">
          {loading ? (
            <div className="grid grid-cols-2 gap-x-2.5 gap-y-12 md:grid-cols-3 xl:grid-cols-4 xl:gap-x-5">
              {Array.from({ length: 8 }, (_, index) => (
                <div key={index} className="loading-pulse">
                  <div className="aspect-[18/25] bg-[var(--surface-strong)]" />
                  <div className="mt-4 h-3 w-4/5 bg-[var(--surface-strong)]" />
                  <div className="mt-2 h-3 w-2/5 bg-[var(--surface-strong)]" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-2.5 gap-y-12 sm:gap-x-4 md:grid-cols-3 xl:grid-cols-4 xl:gap-x-5 xl:gap-y-16">
              {filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <EmptyState
              title="No pieces match this edit."
              description="Clear the filters to return to the complete collection."
              ctaHref="/shop"
              ctaLabel="View all pieces"
            />
          )}
        </section>
      </main>

      {filtersOpen ? (
        <div className="fixed inset-0 z-50">
          <button type="button" aria-label="Close filters" className="absolute inset-0 bg-black/35" onClick={closeFilters} />
          <aside ref={dialogRef} className="absolute right-0 top-0 flex h-full w-full max-w-[430px] flex-col bg-[var(--background)] px-5 py-6 sm:px-8 sm:py-8" role="dialog" aria-modal="true" aria-labelledby="filter-title">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-6">
              <div>
                <p className="eyebrow text-[var(--muted)]">Collection controls</p>
                <h2 id="filter-title" className="mt-3 text-2xl font-medium">Filter</h2>
              </div>
              <button ref={initialFocusRef} type="button" onClick={closeFilters} className="flex h-12 w-12 items-center justify-center border border-[var(--border)] text-xl" aria-label="Close filters">×</button>
            </div>

            <div className="flex-1 space-y-10 overflow-y-auto py-8">
              <fieldset>
                <legend className="eyebrow text-[var(--muted)]">Colour</legend>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {colours.map((colour) => (
                    <button key={colour} type="button" onClick={() => setSelectedColour((current) => current === colour ? "all" : colour)} className={`flex min-h-12 items-center gap-3 border px-4 text-left text-xs font-medium capitalize ${selectedColour === colour ? "border-[var(--foreground)]" : "border-[var(--border)]"}`}>
                      <span className="h-3 w-3 border border-[var(--border)]" style={{ backgroundColor: swatchColors[colour.toLowerCase()] || "#d9d9d4" }} />
                      {colour.replace(/begie/i, "beige")}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="eyebrow text-[var(--muted)]">Availability</legend>
                <div className="mt-4 grid gap-2">
                  {[
                    ["all", "All pieces"],
                    ["available", "Available now"],
                    ["new", "New in"],
                  ].map(([value, label]) => (
                    <button key={value} type="button" onClick={() => setAvailability(value as AvailabilityFilter)} className={`min-h-12 border px-4 text-left text-xs font-medium uppercase tracking-[0.08em] ${availability === value ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]" : "border-[var(--border)]"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-5">
              <button type="button" onClick={clearFilters} className="button-secondary px-5 text-[0.68rem] font-semibold uppercase tracking-[0.1em]">Clear</button>
              <button type="button" onClick={closeFilters} className="button-primary px-5 text-[0.68rem] font-semibold uppercase">View {filteredProducts.length}</button>
            </div>
          </aside>
        </div>
      ) : null}

      <SiteFooter />
    </div>
  );
}
