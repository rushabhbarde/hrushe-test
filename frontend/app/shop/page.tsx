"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FrameIndex } from "@/components/frame-index";
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
  const [view, setView] = useState<"index" | "grid">("index");
  const [layout, setLayout] = useState<CollectionLayout>("editorial");
  const [selectedColour, setSelectedColour] = useState("all");
  const [availability, setAvailability] = useState<AvailabilityFilter>("all");
  const [sort, setSort] = useState<SortOption>(routeSort);
  const closeFilters = useCallback(() => setFiltersOpen(false), []);
  const { dialogRef, initialFocusRef } = useDialogAccessibility(filtersOpen, closeFilters);

  useEffect(() => {
    setSort(routeSort);
  }, [routeSort]);

  const sourceProducts = useMemo(
    () => (isNewArrivalsRoute ? getNewInProducts(products) : products.filter(isVisibleStorefrontProduct)),
    [isNewArrivalsRoute, products]
  );
  const categoryTabs = useMemo(() => getShopCategoryTabs(sourceProducts), [sourceProducts]);
  const colours = useMemo(
    () => Array.from(new Set(sourceProducts.flatMap((product) => product.colors))).filter(Boolean),
    [sourceProducts]
  );

  const shownProducts = useMemo(() => {
    const filtered = sourceProducts.filter((product) => {
      const matchesCategory =
        activeCategory === "all" ||
        getDerivedProductCategories(product).some((category) => slugsMatch(category, activeCategory));
      const matchesColour =
        selectedColour === "all" ||
        product.colors.some((colour) => colour.toLowerCase() === selectedColour.toLowerCase());
      const matchesAvailability = availability === "all" || productIsAvailable(product);
      return matchesCategory && matchesColour && matchesAvailability;
    });

    return sortShopProducts(filtered, sort);
  }, [activeCategory, availability, selectedColour, sort, sourceProducts]);

  const defaultSort: SortOption = isNewArrivalsRoute ? "newest" : "edit";
  const activeControlCount =
    Number(activeCategory !== "all") +
    Number(selectedColour !== "all") +
    Number(availability !== "all") +
    Number(sort !== defaultSort);
  const title = isNewArrivalsRoute ? "New in" : "The edit";

  const resetControls = () => {
    setActiveCategory("all");
    setSelectedColour("all");
    setAvailability("all");
    setSort(defaultSort);
  };

  return (
    <div className="page-shell bg-[var(--background)]">
      <SiteHeader />
      <main className="collection-plp">
        <header className="collection-plp__intro">
          <div>
            <p>{isNewArrivalsRoute ? "Shop · Newest first" : "Shop · Every piece"}</p>
            <h1>
              {title}
              {!loading && sourceProducts.length > 0 ? <span>{String(sourceProducts.length).padStart(2, "0")}</span> : null}
            </h1>
          </div>
        </header>

        {categoryTabs.length > 1 ? (
          <nav className="collection-plp__category-nav" aria-label={`${title} categories`}>
            <button type="button" onClick={() => setActiveCategory("all")} aria-pressed={activeCategory === "all"}>
              All
            </button>
            {categoryTabs.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                aria-pressed={slugsMatch(activeCategory, category)}
              >
                {normaliseCategoryLabel(category)}
              </button>
            ))}
          </nav>
        ) : null}

        <div className="collection-plp__toolbar" aria-label={`${title} controls`}>
          <div className="collection-plp__filter-actions">
            {activeControlCount > 0 ? (
              <button type="button" onClick={resetControls} className="collection-plp__reset-button">
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
              {activeControlCount > 0 ? <sup>{activeControlCount}</sup> : null}
            </button>
          </div>

          <div className="flex items-center gap-5">
            <div className="fr-mono flex gap-4" role="group" aria-label="View">
              {(["index", "grid"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setView(option)}
                  aria-pressed={view === option}
                  className={`fr-mono fr-choice min-h-11 ${view === option ? "is-active fr-link" : ""}`}
                >
                  {option === "index" ? "Index" : "Grid"}
                </button>
              ))}
            </div>
            {view === "grid" ? (
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
            ) : null}
          </div>
        </div>

        {loading ? (
          <ShopCollectionSkeleton layout={layout} />
        ) : shownProducts.length > 0 && view === "index" ? (
          <div className="pt-6">
            <FrameIndex key={`${activeCategory}-${selectedColour}-${availability}-${sort}`} products={shownProducts} label={`${title} products`} />
          </div>
        ) : shownProducts.length > 0 ? (
          <section className={`collection-plp__grid collection-plp__grid--${layout}`} aria-label={`${title} products`}>
            {shownProducts.map((product, index) => (
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
          <section className="flex flex-col gap-4 px-5 py-16 lg:px-10">
            <p className="fr-word text-[clamp(2.5rem,7vw,5rem)]">Nothing in this edit.</p>
            <p className="max-w-md text-base leading-7 text-[var(--muted)]">Loosen the filters to see every piece again.</p>
            <button type="button" onClick={resetControls} className="fr-button max-w-xs">
              Reset
            </button>
          </section>
        )}
      </main>

      {filtersOpen ? (
        <div className="collection-filter-drawer">
          <button type="button" className="collection-filter-drawer__overlay" aria-label="Close filter and sort panel" onClick={closeFilters} />
          <aside
            ref={dialogRef}
            className="collection-filter-drawer__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shop-filter-title"
          >
            <div className="collection-filter-drawer__header">
              <div>
                <p className="text-[var(--muted)]">{title}</p>
                <h2 id="shop-filter-title">Filter &amp; sort</h2>
              </div>
              <button ref={initialFocusRef} type="button" onClick={closeFilters} aria-label="Close filter and sort panel">
                ×
              </button>
            </div>

            <div className="collection-filter-drawer__body">
              {categoryTabs.length > 1 ? (
                <fieldset>
                  <legend>Category</legend>
                  <div className="collection-filter-drawer__option-grid">
                    <button type="button" onClick={() => setActiveCategory("all")} aria-pressed={activeCategory === "all"}>
                      All
                    </button>
                    {categoryTabs.map((category) => (
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
              ) : null}

              {colours.length > 1 ? (
                <fieldset>
                  <legend>Colour</legend>
                  <div className="collection-filter-drawer__option-grid">
                    {colours.map((colour) => (
                      <button
                        key={colour}
                        type="button"
                        onClick={() => setSelectedColour((current) => (current === colour ? "all" : colour))}
                        aria-pressed={selectedColour === colour}
                        className="flex items-center gap-3"
                      >
                        <span
                          className="h-3 w-3 shrink-0 border border-[var(--border)]"
                          style={{ backgroundColor: swatchColors[colour.toLowerCase()] || "#d9d9d4" }}
                          aria-hidden="true"
                        />
                        {colour.replace(/begie/i, "beige")}
                      </button>
                    ))}
                  </div>
                </fieldset>
              ) : null}

              <fieldset>
                <legend>Availability</legend>
                <div className="collection-filter-drawer__option-grid">
                  {(
                    [
                      ["all", "All pieces"],
                      ["available", "Available now"],
                    ] as const
                  ).map(([value, label]) => (
                    <button key={value} type="button" onClick={() => setAvailability(value)} aria-pressed={availability === value}>
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend>Sort</legend>
                <div className="collection-filter-drawer__option-grid">
                  {sortOptions.map((option) => (
                    <button key={option.value} type="button" onClick={() => setSort(option.value)} aria-pressed={sort === option.value}>
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            <div className="collection-filter-drawer__footer">
              <button type="button" onClick={resetControls}>
                Reset
              </button>
              <button type="button" onClick={closeFilters}>
                View {shownProducts.length}
              </button>
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
