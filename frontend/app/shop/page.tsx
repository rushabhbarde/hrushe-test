"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { ProductListingGrid, ProductListingSkeleton } from "@/components/product-listing-grid";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useStorefrontData } from "@/lib/use-storefront";

export default function ShopPage() {
  const { products, loading } = useStorefrontData();
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");
  const [sizeFilter, setSizeFilter] = useState("all");
  const [colorFilter, setColorFilter] = useState("all");
  const [fitFilter, setFitFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = useMemo(() => {
    const dynamic = Array.from(
      new Set(
        products.flatMap((product) =>
          product.categories && product.categories.length > 0
            ? product.categories
            : [product.category]
        )
      )
    );

    return ["ALL", "NEW ARRIVALS", ...dynamic];
  }, [products]);

  const filterOptions = useMemo(() => {
    const sizes = Array.from(new Set(products.flatMap((product) => product.sizes))).filter(Boolean);
    const colors = Array.from(new Set(products.flatMap((product) => product.colors))).filter(Boolean);

    return { sizes, colors };
  }, [products]);

  const visibleProducts = useMemo(() => {
    const categoryFiltered =
      activeCategory === "ALL"
        ? products
        : activeCategory === "NEW ARRIVALS"
          ? products.filter((product) => product.newArrival || product.newIn)
          : products.filter((product) =>
              (product.categories && product.categories.length > 0
                ? product.categories
                : [product.category]
              ).includes(activeCategory)
            );

    const filtered = categoryFiltered.filter((product) => {
      const searchableText = [
        product.name,
        product.description,
        product.category,
        ...(product.categories || []),
        ...product.colors,
      ]
        .join(" ")
        .toLowerCase();

      const productFitText = [product.name, product.category, ...(product.categories || [])]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        searchQuery.trim().length === 0 ||
        searchableText.includes(searchQuery.trim().toLowerCase());
      const matchesSize = sizeFilter === "all" || product.sizes.includes(sizeFilter);
      const matchesColor = colorFilter === "all" || product.colors.includes(colorFilter);
      const matchesFit = fitFilter === "all" || productFitText.includes(fitFilter);

      return matchesSearch && matchesSize && matchesColor && matchesFit;
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
  }, [activeCategory, colorFilter, fitFilter, products, searchQuery, sizeFilter, sortBy]);

  const hasFilters =
    activeCategory !== "ALL" ||
    sizeFilter !== "all" ||
    colorFilter !== "all" ||
    fitFilter !== "all" ||
    searchQuery.trim().length > 0 ||
    sortBy !== "newest";

  function clearFilters() {
    setActiveCategory("ALL");
    setSearchQuery("");
    setSizeFilter("all");
    setColorFilter("all");
    setFitFilter("all");
    setSortBy("newest");
  }

  return (
    <div className="page-shell bg-[var(--background)]">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-[1600px] px-4 pb-14 pt-7 sm:px-6 sm:pt-10 lg:px-8">
          <div className="border-b border-[var(--border)] pb-5">
            <p className="text-[0.74rem] uppercase tracking-[0.14em] text-[var(--muted)]">
              <Link href="/" className="hover:text-[var(--foreground)]">
                Home
              </Link>{" "}
              / Products
            </p>
            <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-[2.65rem] font-semibold uppercase leading-[0.92] tracking-[-0.08em] text-[var(--foreground)] sm:text-[4.6rem]">
                  Products
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-[0.95rem]">
                  Premium everyday silhouettes with calmer colour stories, comfortable fits, and
                  repeat-wear ease.
                </p>
              </div>

              <div className="w-full max-w-[480px]">
                <label className="flex min-h-12 items-center gap-3 border border-[var(--border)] bg-[var(--surface)] px-4">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-[var(--muted)]" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="11" cy="11" r="6" />
                    <path d="M20 20l-4.2-4.2" />
                  </svg>
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search products"
                    className="w-full bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-8 xl:grid-cols-[260px_minmax(0,1fr)] xl:gap-10">
            <aside className="hidden xl:block">
              <div className="sticky top-[138px] space-y-8">
                <SidebarBlock title="Categories">
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setActiveCategory(category)}
                        className={`block w-full border px-3 py-3 text-left text-[0.72rem] uppercase tracking-[0.14em] transition ${
                          activeCategory === category
                            ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                            : "border-[var(--border)] text-[var(--foreground)] hover:border-[var(--foreground)]"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </SidebarBlock>

                <SidebarBlock title="Size">
                  <div className="grid grid-cols-3 gap-2">
                    {filterOptions.sizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSizeFilter((current) => (current === size ? "all" : size))}
                        className={`min-h-10 border text-[0.72rem] uppercase tracking-[0.14em] transition ${
                          sizeFilter === size
                            ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                            : "border-[var(--border)] text-[var(--foreground)] hover:border-[var(--foreground)]"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </SidebarBlock>

                <SidebarBlock title="Fit">
                  <div className="space-y-2">
                    {[
                      { label: "All fits", value: "all" },
                      { label: "Oversize", value: "oversize" },
                      { label: "Regular", value: "regular" },
                    ].map((fit) => (
                      <button
                        key={fit.value}
                        type="button"
                        onClick={() => setFitFilter(fit.value)}
                        className={`block w-full border px-3 py-3 text-left text-[0.72rem] uppercase tracking-[0.14em] transition ${
                          fitFilter === fit.value
                            ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                            : "border-[var(--border)] text-[var(--foreground)] hover:border-[var(--foreground)]"
                        }`}
                      >
                        {fit.label}
                      </button>
                    ))}
                  </div>
                </SidebarBlock>

                <SidebarBlock title="Color">
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setColorFilter((current) => (current === color ? "all" : color))}
                        className={`border px-3 py-2 text-[0.68rem] uppercase tracking-[0.14em] transition ${
                          colorFilter === color
                            ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                            : "border-[var(--border)] text-[var(--foreground)] hover:border-[var(--foreground)]"
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </SidebarBlock>

                {hasFilters ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-[0.72rem] font-medium uppercase tracking-[0.16em] text-[var(--accent)]"
                  >
                    Clear all filters
                  </button>
                ) : null}
              </div>
            </aside>

            <div className="min-w-0">
              <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {categories.slice(0, 6).map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setActiveCategory(category)}
                        className={`min-h-10 border px-3 text-[0.72rem] uppercase tracking-[0.14em] transition ${
                          activeCategory === category
                            ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                            : "border-[var(--border)] text-[var(--foreground)] hover:border-[var(--foreground)]"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <ListingSelect label="Sort" value={sortBy} onChange={setSortBy}>
                      <option value="newest">Newest</option>
                      <option value="price-low">Price low to high</option>
                      <option value="price-high">Price high to low</option>
                      <option value="popular">Popular</option>
                    </ListingSelect>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-3 xl:hidden">
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
                </div>

                <div className="flex items-center justify-between text-[0.72rem] uppercase tracking-[0.14em] text-[var(--muted)]">
                  <span>{visibleProducts.length} products</span>
                  {hasFilters ? (
                    <button type="button" onClick={clearFilters} className="text-[var(--accent)] xl:hidden">
                      Clear filters
                    </button>
                  ) : (
                    <span>Curated by fit and colour</span>
                  )}
                </div>
              </div>

              <div className="pt-5">
                {loading ? (
                  <ProductListingSkeleton count={10} />
                ) : visibleProducts.length === 0 ? (
                  <EmptyState
                    title="No products found."
                    description="Try clearing filters or searching with fewer words."
                    ctaHref="/shop"
                    ctaLabel="View all products"
                  />
                ) : (
                  <ProductListingGrid products={visibleProducts} />
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function SidebarBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="eyebrow text-[var(--muted)]">{title}</p>
      <div className="mt-4">{children}</div>
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
    <label className="flex min-h-11 items-center justify-between gap-3 border border-[var(--border)] bg-[var(--surface)] px-3 text-[0.72rem] uppercase tracking-[0.12em] text-[var(--muted)]">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="max-w-[140px] bg-transparent text-right text-[0.72rem] uppercase tracking-[0.08em] text-[var(--foreground)] outline-none"
      >
        {children}
      </select>
    </label>
  );
}
