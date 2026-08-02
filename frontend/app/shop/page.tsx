"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type { Product } from "@/lib/catalog";
import {
  getNewInProducts,
  isVisibleStorefrontProduct,
  productCategoryList,
  slugsMatch,
  sortProductsByStorefrontPriority,
} from "@/lib/catalog";
import { useStorefrontData } from "@/lib/use-storefront";
import { useDialogAccessibility } from "@/lib/use-dialog-accessibility";

type AvailabilityFilter = "all" | "available";
type CollectionLayout = "runway" | "editorial" | "matrix";
type LayoutIconVariant = "three" | "four" | "six";
type SortOption = "edit" | "newest" | "price-low" | "price-high";

const swatchColors: Record<string, string> = {
  black: "#11110f",
  white: "#ffffff",
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

const preferredCategoryOrder = [
  "T-Shirts",
  "Oversized",
  "Polos",
  "Shirts",
  "Pants",
  "Shorts",
  "Hoodies",
  "Knitwear",
  "Sweaters",
  "Denim",
  "Footwear",
  "Accessories",
  "Outerwear",
  "Bottomwear",
];

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: "edit", label: "Curated edit" },
  { value: "newest", label: "Newest arrivals" },
  { value: "price-low", label: "Price: low to high" },
  { value: "price-high", label: "Price: high to low" },
];

const layoutOptions: Array<{ value: CollectionLayout; label: string; icon: LayoutIconVariant; cells: number }> = [
  { value: "runway", label: "3 product view", icon: "three", cells: 1 },
  { value: "editorial", label: "4 product view", icon: "four", cells: 4 },
  { value: "matrix", label: "6 product view", icon: "six", cells: 9 },
];

function productIsAvailable(product: ReturnType<typeof useStorefrontData>["products"][number]) {
  if (product.availability) {
    return product.availability === "available";
  }

  return !product.trackInventory || product.variants?.some((variant) => variant.active && variant.stock > 0);
}

function isSortOption(value: string | null): value is SortOption {
  return value === "edit" || value === "newest" || value === "price-low" || value === "price-high";
}

function sortShopProducts(products: Product[], sort: SortOption) {
  if (sort === "price-low") {
    return [...products].sort((left, right) => left.price - right.price);
  }

  if (sort === "price-high") {
    return [...products].sort((left, right) => right.price - left.price);
  }

  if (sort === "newest") {
    return [...products].sort(
      (left, right) =>
        new Date(right.createdAt || right.updatedAt || 0).getTime() -
        new Date(left.createdAt || left.updatedAt || 0).getTime()
    );
  }

  return sortProductsByStorefrontPriority(products);
}

function normaliseCategoryLabel(category: string) {
  return category.replace(/begie/gi, "Beige");
}

function getDerivedProductCategories(product: Product) {
  const categories = new Set(productCategoryList(product).filter(Boolean));
  const searchText = [
    product.name,
    product.displayName,
    product.slug,
    product.description,
    product.category,
    ...(product.categories || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (searchText.includes("tee") || searchText.includes("t-shirt") || searchText.includes("tshirt")) {
    categories.add("T-Shirts");
  }

  if (searchText.includes("oversize")) {
    categories.add("Oversized");
  }

  if (searchText.includes("polo")) {
    categories.add("Polos");
  }

  if (searchText.includes("hoodie") || searchText.includes("sweatshirt")) {
    categories.add("Hoodies");
  }

  if (searchText.includes("knit")) {
    categories.add("Knitwear");
  }

  if (searchText.includes("sweater")) {
    categories.add("Sweaters");
  }

  if (searchText.includes("denim") || searchText.includes("jean")) {
    categories.add("Denim");
  }

  if (searchText.includes("shoe") || searchText.includes("sneaker") || searchText.includes("footwear")) {
    categories.add("Footwear");
  }

  if (searchText.includes("shirt") && !searchText.includes("t-shirt") && !searchText.includes("tshirt")) {
    categories.add("Shirts");
  }

  if (searchText.includes("pant") || searchText.includes("trouser")) {
    categories.add("Pants");
    categories.add("Bottomwear");
  }

  if (searchText.includes("short")) {
    categories.add("Shorts");
    categories.add("Bottomwear");
  }

  if (searchText.includes("jacket") || searchText.includes("outerwear") || searchText.includes("coat")) {
    categories.add("Outerwear");
  }

  if (searchText.includes("accessor") || searchText.includes("cap") || searchText.includes("bag")) {
    categories.add("Accessories");
  }

  return Array.from(categories);
}

function getShopCategoryTabs(products: Product[]) {
  const presentCategories = Array.from(
    new Set(products.flatMap((product) => getDerivedProductCategories(product)).filter(Boolean))
  );
  const orderedPreferred = preferredCategoryOrder.filter((preferredCategory) =>
    presentCategories.some((category) => slugsMatch(category, preferredCategory))
  );
  const remaining = presentCategories
    .filter(
      (category) =>
        !orderedPreferred.some((preferredCategory) => slugsMatch(category, preferredCategory))
    )
    .sort((left, right) => left.localeCompare(right));

  return [...orderedPreferred, ...remaining].slice(0, 8);
}

function LayoutIcon({ variant, cells }: { variant: LayoutIconVariant; cells: number }) {
  return (
    <span className={`collection-layout-icon collection-layout-icon--${variant}`} aria-hidden="true">
      {Array.from({ length: cells }, (_, index) => (
        <span key={index} />
      ))}
    </span>
  );
}

function FilterSlidersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 7h16M4 17h16" strokeLinecap="square" />
      <path d="M8 4v6M16 14v6" strokeLinecap="square" />
    </svg>
  );
}

function ShopCollectionSkeleton({ layout }: { layout: CollectionLayout }) {
  return (
    <div className={`collection-plp__grid collection-plp__grid--${layout}`} aria-hidden="true">
      {Array.from({ length: layout === "matrix" ? 18 : 8 }, (_, index) => (
        <div key={index} className="bg-[var(--background)]">
          <div className="loading-pulse aspect-[4/5] bg-[var(--surface-strong)]" />
          <div className="px-3 pb-5 pt-3 sm:px-4">
            <div className="h-3 w-4/5 bg-[var(--surface-strong)]" />
            <div className="mt-2 h-3 w-2/5 bg-[var(--surface-strong)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ShopContent() {
  const searchParams = useSearchParams();
  const requestedSort = searchParams.get("sort");
  const routeSort = isSortOption(requestedSort) ? requestedSort : "edit";
  const isNewArrivalsRoute = routeSort === "newest";
  const { products, loading } = useStorefrontData();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [layout, setLayout] = useState<CollectionLayout>("matrix");
  const [selectedColour, setSelectedColour] = useState("all");
  const [availability, setAvailability] = useState<AvailabilityFilter>("all");
  const [sort, setSort] = useState<SortOption>(routeSort);
  const closeFilters = useCallback(() => setFiltersOpen(false), []);
  const { dialogRef, initialFocusRef } = useDialogAccessibility(filtersOpen, closeFilters);

  useEffect(() => {
    setSort(routeSort);
  }, [routeSort]);

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
        (availability === "available" && productIsAvailable(product));
      return matchesColour && matchesAvailability;
    });

    return sortShopProducts(filtered, sort);
  }, [availability, selectedColour, sort, visibleProducts]);

  const newArrivalProducts = useMemo(() => getNewInProducts(products), [products]);
  const newArrivalCategoryTabs = useMemo(
    () => getShopCategoryTabs(newArrivalProducts),
    [newArrivalProducts]
  );
  const newArrivalDisplayTabs =
    newArrivalCategoryTabs.length > 0 ? newArrivalCategoryTabs : loading ? preferredCategoryOrder.slice(0, 6) : [];
  const newArrivalProductsForCategory = useMemo(() => {
    const productsForCategory =
      activeCategory === "all"
        ? newArrivalProducts
        : newArrivalProducts.filter((product) =>
            getDerivedProductCategories(product).some((category) => slugsMatch(category, activeCategory))
          );

    return sortShopProducts(productsForCategory, sort);
  }, [activeCategory, newArrivalProducts, sort]);
  const activeNewArrivalControlCount = Number(activeCategory !== "all") + Number(sort !== "newest");
  const activeCategoryLabel = activeCategory === "all" ? "NEW ARRIVALS" : normaliseCategoryLabel(activeCategory);

  const clearFilters = () => {
    setSelectedColour("all");
    setAvailability("all");
  };

  const resetNewArrivalControls = () => {
    setActiveCategory("all");
    setSort("newest");
  };

  if (isNewArrivalsRoute) {
    return (
      <div className="page-shell bg-[var(--background)]">
        <SiteHeader />
        <main className="collection-plp">
          <header className="collection-plp__intro">
            <div>
              <p>Shop</p>
              <h1>
                NEW ARRIVALS
                {!loading && newArrivalProducts.length > 0 ? <span>{newArrivalProducts.length}</span> : null}
              </h1>
              <div className="collection-plp__description">
                A focused HRUSHE edit of newest available pieces, arranged for quick browsing.
              </div>
            </div>
          </header>

          <nav className="collection-plp__category-nav" aria-label="New arrivals categories">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              aria-pressed={activeCategory === "all"}
            >
              View All
            </button>
            {newArrivalDisplayTabs.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                aria-pressed={slugsMatch(activeCategory, category)}
                disabled={loading}
              >
                {normaliseCategoryLabel(category)}
              </button>
            ))}
          </nav>

          <div className="collection-plp__toolbar" aria-label="New arrivals controls">
            <div className="collection-plp__filter-actions">
              {activeNewArrivalControlCount > 0 ? (
                <button type="button" onClick={resetNewArrivalControls} className="collection-plp__reset-button">
                  Reset
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="collection-plp__filter-button"
                aria-haspopup="dialog"
              >
                <FilterSlidersIcon />
                <span>Filter &amp; Sort</span>
                {activeNewArrivalControlCount > 0 ? <sup>{activeNewArrivalControlCount}</sup> : null}
              </button>
            </div>

            <div className="collection-plp__layout-controls" aria-label="Product grid density">
              {layoutOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setLayout(option.value)}
                  aria-label={option.label}
                  aria-pressed={layout === option.value}
                >
                  <LayoutIcon variant={option.icon} cells={option.cells} />
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <ShopCollectionSkeleton layout={layout} />
          ) : newArrivalProductsForCategory.length > 0 ? (
            <section className={`collection-plp__grid collection-plp__grid--${layout}`} aria-label="New arrivals products">
              {newArrivalProductsForCategory.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant="editorial"
                  priority={index < 4}
                  showInfo={layout !== "matrix"}
                />
              ))}
            </section>
          ) : (
            <section className="mx-auto max-w-[760px] px-4 py-20 sm:px-6">
              <EmptyState
                title={`${activeCategoryLabel} is being prepared.`}
                description="Reset the controls to return to the complete New Arrivals edit, or explore all available HRUSHE pieces."
                ctaHref="/shop"
                ctaLabel="Explore all products"
              />
              {activeNewArrivalControlCount > 0 ? (
                <button
                  type="button"
                  onClick={resetNewArrivalControls}
                  className="button-primary mt-4 min-h-12 px-6 text-xs font-semibold uppercase tracking-[0.12em]"
                >
                  Reset controls
                </button>
              ) : null}
            </section>
          )}
        </main>

        {filtersOpen ? (
          <div className="collection-filter-drawer">
            <button
              type="button"
              className="collection-filter-drawer__overlay"
              aria-label="Close filter and sort panel"
              onClick={() => setFiltersOpen(false)}
            />
            <aside
              ref={dialogRef}
              className="collection-filter-drawer__panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="shop-new-arrivals-filter-title"
            >
              <div className="collection-filter-drawer__header">
                <div>
                  <p className="eyebrow text-[var(--muted)]">NEW ARRIVALS</p>
                  <h2 id="shop-new-arrivals-filter-title">Filter &amp; sort</h2>
                </div>
                <button
                  ref={initialFocusRef}
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  aria-label="Close filter and sort panel"
                >
                  ×
                </button>
              </div>

              <div className="collection-filter-drawer__body">
                <fieldset>
                  <legend>Category</legend>
                  <div className="collection-filter-drawer__option-grid">
                    <button
                      type="button"
                      onClick={() => setActiveCategory("all")}
                      aria-pressed={activeCategory === "all"}
                    >
                      NEW ARRIVALS
                    </button>
                    {newArrivalDisplayTabs.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setActiveCategory(category)}
                        aria-pressed={slugsMatch(activeCategory, category)}
                      >
                        {normaliseCategoryLabel(category)}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend>Sort</legend>
                  <div className="collection-filter-drawer__option-grid">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSort(option.value)}
                        aria-pressed={sort === option.value}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>

              <div className="collection-filter-drawer__footer">
                <button type="button" onClick={resetNewArrivalControls}>
                  Reset
                </button>
                <button type="button" onClick={() => setFiltersOpen(false)}>
                  View {newArrivalProductsForCategory.length}
                </button>
              </div>
            </aside>
          </div>
        ) : null}

        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="page-shell bg-[var(--background)]">
      <SiteHeader />
      <main className="mx-auto max-w-[1600px] px-4 pb-24 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pb-32 lg:pt-24">
        <div className="mb-7">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Shop" }]} />
        </div>
        <header className="grid gap-8 border-b border-[var(--border)] pb-10 lg:grid-cols-[1fr_0.7fr] lg:items-end lg:pb-14">
          <div>
            <p className="eyebrow text-[var(--muted)]">HRUSHE collection</p>
            <h1 className="mt-5 text-[2.2rem] font-medium uppercase leading-[0.94] tracking-[-0.035em] sm:text-[4rem] sm:leading-[0.92] sm:tracking-[-0.045em] lg:text-[5.5rem]">
              The collection.
            </h1>
          </div>
          <p className="max-w-xl text-[0.94rem] leading-7 text-[var(--muted)] sm:text-base">
            A quiet collection of essentials, built with intention and designed to be worn your way.
          </p>
        </header>

        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-[var(--border)] py-5">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            {filteredProducts.length} {filteredProducts.length === 1 ? "piece" : "pieces"}
          </p>
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-3 sm:flex-none">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="inline-flex min-h-12 shrink-0 items-center border border-[var(--border)] px-5 text-[0.68rem] font-semibold uppercase tracking-[0.12em]"
            >
              Filter{activeFilterCount ? ` (${activeFilterCount})` : ""}
            </button>
            <label className="sr-only" htmlFor="shop-sort">Sort collection</label>
            <select
              id="shop-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
              className="min-h-12 min-w-0 max-w-full flex-1 border border-[var(--border)] bg-transparent px-4 text-[0.68rem] font-semibold uppercase tracking-[0.1em] outline-none sm:flex-none"
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
            <div className="collection-plp__grid collection-plp__grid--matrix" aria-hidden="true">
              {Array.from({ length: 8 }, (_, index) => (
                <div key={index} className="bg-[var(--background)]">
                  <div className="loading-pulse aspect-[4/5] bg-[var(--surface-strong)]" />
                  <div className="px-5 py-5">
                    <div className="h-3 w-4/5 bg-[var(--surface-strong)]" />
                    <div className="mt-2 h-3 w-2/5 bg-[var(--surface-strong)]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <section className="collection-plp__grid collection-plp__grid--matrix" aria-label="All HRUSHE products">
              {filteredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} variant="editorial" priority={index < 6} />
              ))}
            </section>
          ) : (
            <div>
              <EmptyState
                title="No pieces match this edit."
                description="Clear the filters to return to the complete collection."
              />
              <button type="button" onClick={clearFilters} className="button-primary mt-4 min-h-12 px-6 text-xs font-semibold uppercase tracking-[0.12em]">
                Clear filters
              </button>
            </div>
          )}
        </section>
      </main>

      {filtersOpen ? (
        <div className="fixed inset-0 z-[115]">
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
                  ].map(([value, label]) => (
                    <button key={value} type="button" onClick={() => setAvailability(value as AvailabilityFilter)} className={`min-h-12 border px-4 text-left text-xs font-medium uppercase tracking-[0.08em] ${availability === value ? "hrushe-inverse-action" : "border-[var(--border)]"}`}>
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

export default function ShopPage() {
  return (
    <Suspense fallback={null}>
      <ShopContent />
    </Suspense>
  );
}
