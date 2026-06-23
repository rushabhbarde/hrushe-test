"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { EmptyState } from "@/components/empty-state";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductCard } from "@/components/product-card";
import { ProductListingGrid, ProductListingSkeleton } from "@/components/product-listing-grid";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type { Product } from "@/lib/catalog";
import {
  formatCollectionLabel,
  getCollectionLabelFromSlug,
  getCollectionProducts,
  getNewInProducts,
  productCategoryList,
  slugsMatch,
  sortProductsByStorefrontPriority,
} from "@/lib/catalog";
import { useStorefrontData } from "@/lib/use-storefront";

type CollectionLayout = "runway" | "editorial" | "classic" | "matrix";
type SortOption = "edit" | "newest" | "price-low" | "price-high";

const preferredCategoryOrder = [
  "T-Shirts",
  "Shirts",
  "Oversized",
  "Polos",
  "Bottomwear",
  "Outerwear",
  "Accessories",
];

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: "edit", label: "Curated edit" },
  { value: "newest", label: "Newest arrivals" },
  { value: "price-low", label: "Price: low to high" },
  { value: "price-high", label: "Price: high to low" },
];

const layoutOptions: Array<{ value: CollectionLayout; label: string; columns: number }> = [
  { value: "runway", label: "Large product view", columns: 3 },
  { value: "editorial", label: "Four column view", columns: 4 },
  { value: "classic", label: "Dense view", columns: 5 },
  { value: "matrix", label: "Wardrobe grid view", columns: 6 },
];

function sortCollectionProducts(products: Product[], sort: SortOption) {
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

function getCollectionCategoryTabs(products: Product[]) {
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

  if (searchText.includes("shirt") && !searchText.includes("t-shirt") && !searchText.includes("tshirt")) {
    categories.add("Shirts");
  }

  if (searchText.includes("pant") || searchText.includes("trouser") || searchText.includes("short")) {
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

function getGenderCollectionTitle(collectionSlug: string) {
  return collectionSlug === "women" ? "Women's Sale" : "Men's Sale";
}

function FilterSortIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M4 7h16M4 17h16" strokeLinecap="square" />
      <path d="M8 4v6M16 14v6" strokeLinecap="square" />
    </svg>
  );
}

function LayoutIcon({ columns }: { columns: number }) {
  return (
    <span className="collection-layout-icon" aria-hidden="true" style={{ "--columns": columns } as CSSProperties}>
      {Array.from({ length: columns }, (_, index) => (
        <span key={index} />
      ))}
    </span>
  );
}

function CollectionSkeleton({ layout }: { layout: CollectionLayout }) {
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

export default function CollectionPage() {
  const params = useParams<{ slug: string }>();
  const { products, loading } = useStorefrontData();
  const [activeCategory, setActiveCategory] = useState("all");
  const [sort, setSort] = useState<SortOption>("edit");
  const [layout, setLayout] = useState<CollectionLayout>("editorial");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const collectionSlug = params.slug || "";
  const isGenderCollection = collectionSlug === "men" || collectionSlug === "women";
  const matchedCategory = useMemo(
    () => getCollectionLabelFromSlug(collectionSlug, products),
    [collectionSlug, products]
  );
  const displayCategory = matchedCategory || formatCollectionLabel(collectionSlug) || "Collection";
  const matchedCollectionProducts = useMemo(
    () => (matchedCategory ? getCollectionProducts(products, matchedCategory) : []),
    [matchedCategory, products]
  );
  const visibleProducts = useMemo(() => {
    if (isGenderCollection && matchedCollectionProducts.length === 0 && products.length > 0) {
      return getNewInProducts(products);
    }

    return matchedCollectionProducts;
  }, [isGenderCollection, matchedCollectionProducts, products]);
  const relatedProducts = getNewInProducts(products, { limit: 4 });
  const categoryTabs = useMemo(
    () => getCollectionCategoryTabs(visibleProducts),
    [visibleProducts]
  );
  const displayTabs = categoryTabs.length > 0 ? categoryTabs : loading ? preferredCategoryOrder.slice(0, 6) : [];
  const activeControlCount = Number(activeCategory !== "all") + Number(sort !== "edit");
  const activeCategoryLabel =
    activeCategory === "all"
      ? `All ${collectionSlug === "women" ? "Women" : "Men"}`
      : normaliseCategoryLabel(activeCategory);
  const filteredProducts = useMemo(() => {
    const productsForCategory =
      activeCategory === "all"
        ? visibleProducts
        : visibleProducts.filter((product) =>
            getDerivedProductCategories(product).some((category) => slugsMatch(category, activeCategory))
          );

    return sortCollectionProducts(productsForCategory, sort);
  }, [activeCategory, sort, visibleProducts]);

  const collectionDescription =
    visibleProducts.length > 0
      ? `A focused ${displayCategory.toLowerCase()} edit for customers who already know the type of piece they want.`
      : `The ${displayCategory.toLowerCase()} edit is being prepared. Explore related HRUSHE essentials while this collection is restocked.`;

  const resetControls = () => {
    setActiveCategory("all");
    setSort("edit");
  };

  if (isGenderCollection) {
    const genderTitle = getGenderCollectionTitle(collectionSlug);

    return (
      <div className="page-shell bg-[var(--background)]">
        <SiteHeader />
        <main className="collection-plp">
          <header className="collection-plp__intro">
            <h1>{genderTitle}</h1>
          </header>

          <div className="collection-plp__toolbar" aria-label={`${genderTitle} controls`}>
            <div className="collection-plp__filter-actions">
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="collection-plp__filter-button"
                aria-haspopup="dialog"
              >
                <FilterSortIcon />
                <span>Filter &amp; sort</span>
                {activeControlCount > 0 ? <sup>{activeControlCount}</sup> : null}
              </button>
              {activeControlCount > 0 ? (
                <button type="button" onClick={resetControls} className="collection-plp__reset-button">
                  Reset
                </button>
              ) : null}
            </div>

            <nav className="collection-plp__category-nav" aria-label={`${genderTitle} categories`}>
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                aria-pressed={activeCategory === "all"}
              >
                All {collectionSlug === "women" ? "Women" : "Men"}
              </button>
              {displayTabs.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  aria-pressed={slugsMatch(activeCategory, category)}
                  disabled={loading && categoryTabs.length === 0}
                >
                  {normaliseCategoryLabel(category)}
                </button>
              ))}
            </nav>

            <div className="collection-plp__layout-controls" aria-label="Product grid density">
              {layoutOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setLayout(option.value)}
                  aria-label={option.label}
                  aria-pressed={layout === option.value}
                >
                  <LayoutIcon columns={option.columns} />
                </button>
              ))}
            </div>
          </div>

          <div className="collection-plp__status" aria-live="polite">
            <span>{loading ? "Loading pieces" : `${filteredProducts.length} ${filteredProducts.length === 1 ? "piece" : "pieces"}`}</span>
            <span>{activeCategoryLabel}</span>
          </div>

          {loading ? (
            <CollectionSkeleton layout={layout} />
          ) : filteredProducts.length > 0 ? (
            <section className={`collection-plp__grid collection-plp__grid--${layout}`} aria-label={`${genderTitle} products`}>
              {filteredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} variant="editorial" priority={index < 4} />
              ))}
            </section>
          ) : (
            <section className="mx-auto max-w-[760px] px-4 py-20 sm:px-6">
              <EmptyState
                title={`${activeCategoryLabel} is being prepared.`}
                description="Reset the controls to return to the complete gender edit, or explore the newest available HRUSHE pieces."
                ctaHref="/shop"
                ctaLabel="Explore all products"
              />
              {activeControlCount > 0 ? (
                <button
                  type="button"
                  onClick={resetControls}
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
              className="collection-filter-drawer__panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="collection-filter-title"
            >
              <div className="collection-filter-drawer__header">
                <div>
                  <p className="eyebrow text-[var(--muted)]">{genderTitle}</p>
                  <h2 id="collection-filter-title">Filter &amp; sort</h2>
                </div>
                <button
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
                      All {collectionSlug === "women" ? "Women" : "Men"}
                    </button>
                    {displayTabs.map((category) => (
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
                <button type="button" onClick={resetControls}>
                  Reset
                </button>
                <button type="button" onClick={() => setFiltersOpen(false)}>
                  View {filteredProducts.length}
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
    <div className="page-shell">
      <SiteHeader />
      <main className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
        <div className="mb-7">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, { label: displayCategory }]} />
        </div>
        <SectionHeading eyebrow="Collection" eyebrowClassName="text-[var(--accent)]" title={displayCategory} description={collectionDescription} />
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/shop" className="button-secondary px-5 py-3 transition">Back to shop</Link>
          <Link href="/story" className="button-secondary px-5 py-3 transition">Discover the fit</Link>
        </div>
        <div className="mt-10">
          {loading ? (
            <ProductListingSkeleton count={8} />
          ) : visibleProducts.length > 0 ? (
            <>
              <div className="mb-5 flex flex-col gap-2 text-[0.76rem] uppercase tracking-[0.16em] text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
                <span>{visibleProducts.length} pieces available</span>
                <span>Filtered by collection</span>
              </div>
              <ProductListingGrid products={visibleProducts} />
            </>
          ) : (
            <div className="space-y-10">
              <EmptyState
                title={`${displayCategory} is ${matchedCategory ? "coming soon" : "not live yet"}.`}
                description="The next release for this edit is being prepared. Explore the newest available HRUSHE pieces in the meantime."
                ctaHref="/shop"
                ctaLabel="Explore all products"
              />
              {relatedProducts.length > 0 ? (
                <section aria-labelledby="related-collection-products">
                  <div className="mb-5 flex flex-col gap-2 border-t border-[var(--border)] pt-8 text-[0.76rem] uppercase tracking-[0.16em] text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
                    <h2 id="related-collection-products" className="font-medium text-[var(--foreground)]">You may also like</h2>
                    <span>Newest available pieces</span>
                  </div>
                  <ProductListingGrid products={relatedProducts} />
                </section>
              ) : null}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
