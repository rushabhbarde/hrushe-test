"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/empty-state";
import { ProductListingGrid, ProductListingSkeleton } from "@/components/product-listing-grid";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useStorefrontData } from "@/lib/use-storefront";

export default function ShopPage() {
  const { products, loading } = useStorefrontData();
  const [activeTab, setActiveTab] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");
  const [sizeFilter, setSizeFilter] = useState("all");
  const [colorFilter, setColorFilter] = useState("all");
  const [fitFilter, setFitFilter] = useState("all");

  const categoryTabs = useMemo(() => {
    const categories = Array.from(
      new Set(
        products.flatMap((product) =>
          product.categories && product.categories.length > 0
            ? product.categories
            : [product.category]
        )
      )
    );
    return ["ALL", "NEW ARRIVALS", ...categories];
  }, [products]);

  const filterOptions = useMemo(() => {
    const sizes = Array.from(new Set(products.flatMap((product) => product.sizes))).filter(Boolean);
    const colors = Array.from(new Set(products.flatMap((product) => product.colors))).filter(Boolean);
    return {
      sizes,
      colors,
    };
  }, [products]);

  const visibleProducts = useMemo(() => {
    const tabProducts =
      activeTab === "ALL"
        ? products
        : activeTab === "NEW ARRIVALS"
          ? products.filter((product) => product.newArrival || product.newIn)
          : products.filter((product) =>
              (product.categories && product.categories.length > 0
                ? product.categories
                : [product.category]
              ).includes(activeTab)
            );

    const filtered = tabProducts.filter((product) => {
      const searchableFit = [product.name, product.category, ...(product.categories || [])]
        .join(" ")
        .toLowerCase();
      const matchesSize = sizeFilter === "all" || product.sizes.includes(sizeFilter);
      const matchesColor = colorFilter === "all" || product.colors.includes(colorFilter);
      const matchesFit = fitFilter === "all" || searchableFit.includes(fitFilter);

      return matchesSize && matchesColor && matchesFit;
    });

    return [...filtered].sort((left, right) => {
      if (sortBy === "price-low") {
        return left.price - right.price;
      }
      if (sortBy === "price-high") {
        return right.price - left.price;
      }
      if (sortBy === "popular") {
        return Number(Boolean(right.bestSeller)) - Number(Boolean(left.bestSeller));
      }
      return Number(Boolean(right.newArrival || right.newIn)) - Number(Boolean(left.newArrival || left.newIn));
    });
  }, [activeTab, colorFilter, fitFilter, products, sizeFilter, sortBy]);

  const hasFilters = sizeFilter !== "all" || colorFilter !== "all" || fitFilter !== "all";

  function clearFilters() {
    setSizeFilter("all");
    setColorFilter("all");
    setFitFilter("all");
    setSortBy("newest");
  }

  return (
    <div className="page-shell">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-[1600px] px-4 pb-4 pt-7 sm:px-6 sm:pb-6 sm:pt-10 lg:px-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--accent)]">
            Shop
          </p>
          <h1 className="mt-3 text-4xl font-semibold uppercase tracking-[-0.06em] sm:text-6xl lg:text-7xl">
            T-Shirts.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">
            Clean everyday silhouettes, built around fit, fabric, and a minimal black-white-red rhythm.
          </p>

          <div className="mt-7 flex gap-2 overflow-x-auto pb-1 sm:mt-10 sm:flex-wrap sm:overflow-visible sm:pb-0 sm:gap-3">
            {categoryTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`min-h-11 shrink-0 border px-4 text-xs uppercase tracking-[0.12em] transition sm:px-5 ${
                  activeTab === tab
                    ? "border-black bg-black text-white"
                    : "border-black text-black hover:bg-black/5"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-7 border-y border-[var(--border)] py-3 sm:mt-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                {visibleProducts.length} styles
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:items-center">
                <ListingSelect label="Size" value={sizeFilter} onChange={setSizeFilter}>
                  <option value="all">All sizes</option>
                  {filterOptions.sizes.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </ListingSelect>
                <ListingSelect label="Color" value={colorFilter} onChange={setColorFilter}>
                  <option value="all">All colors</option>
                  {filterOptions.colors.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </ListingSelect>
                <ListingSelect label="Fit" value={fitFilter} onChange={setFitFilter}>
                  <option value="all">All fits</option>
                  <option value="oversize">Oversize</option>
                  <option value="regular">Regular</option>
                </ListingSelect>
                <ListingSelect label="Sort" value={sortBy} onChange={setSortBy}>
                  <option value="newest">Newest</option>
                  <option value="price-low">Price low to high</option>
                  <option value="price-high">Price high to low</option>
                  <option value="popular">Popular</option>
                </ListingSelect>
                {hasFilters ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="min-h-11 px-3 text-left text-xs font-medium uppercase tracking-[0.16em] text-[var(--accent)] sm:text-center"
                  >
                    Clear filters
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 pb-14 sm:px-6 lg:px-8">
          {loading ? (
            <ProductListingSkeleton count={10} />
          ) : visibleProducts.length === 0 ? (
            <EmptyState
              title="No products found."
              description="Clear filters or try another collection tab to see more styles."
              ctaHref="/shop"
              ctaLabel="View all styles"
            />
          ) : (
            <ProductListingGrid products={visibleProducts} />
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function ListingSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-3 border border-[var(--border)] bg-white px-3 text-xs uppercase tracking-[0.14em] text-[var(--muted)] lg:min-w-[150px]">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="max-w-[130px] bg-transparent text-right text-xs uppercase tracking-[0.08em] text-black outline-none"
      >
        {children}
      </select>
    </label>
  );
}
