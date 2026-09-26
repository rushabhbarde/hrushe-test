"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { FrameIndex } from "@/components/frame-index";
import { ProductCard } from "@/components/product-card";
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
  withSideImages,
} from "@/lib/catalog";
import { useStorefrontData } from "@/lib/use-storefront";

type CollectionLayout = "runway" | "editorial" | "matrix";
type LayoutIconVariant = "three" | "four" | "six";
type SortOption = "edit" | "newest" | "price-low" | "price-high";

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

function getGenderCollectionTitle(collectionSlug: string) {
  return collectionSlug === "women" ? "ALL WOMENSWEAR" : "ALL MENSWEAR";
}

function getGenderAllLabel(collectionSlug: string) {
  return collectionSlug === "women" ? "ALL WOMENSWEAR" : "ALL MENSWEAR";
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
  const [layout, setLayout] = useState<CollectionLayout>("matrix");
  const [view, setView] = useState<"index" | "grid">("index");
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
    const shown =
      isGenderCollection && matchedCollectionProducts.length === 0 && products.length > 0
        ? getNewInProducts(products)
        : matchedCollectionProducts;

    return isGenderCollection ? withSideImages(shown, collectionSlug === "women" ? "Women" : "Men") : shown;
  }, [collectionSlug, isGenderCollection, matchedCollectionProducts, products]);
  const relatedProducts = getNewInProducts(products, { limit: 4 });
  const categoryTabs = useMemo(
    () => getCollectionCategoryTabs(visibleProducts),
    [visibleProducts]
  );
  const displayTabs = categoryTabs.length > 0 ? categoryTabs : loading ? preferredCategoryOrder.slice(0, 6) : [];
  const activeControlCount = Number(activeCategory !== "all") + Number(sort !== "edit");
  const activeCategoryLabel =
    activeCategory === "all"
      ? getGenderAllLabel(collectionSlug)
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
            <div>
              <p>Shop</p>
              <h1>
                {genderTitle}
                {!loading && visibleProducts.length > 0 ? <span>{visibleProducts.length}</span> : null}
              </h1>
              <div className="collection-plp__description">
                A focused HRUSHE edit of available pieces, arranged for quick browsing.
              </div>
            </div>
          </header>

          <nav className="collection-plp__category-nav" aria-label={`${genderTitle} categories`}>
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              aria-pressed={activeCategory === "all"}
            >
              View All
            </button>
            {displayTabs.map((category) => (
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

          <div className="collection-plp__toolbar" aria-label={`${genderTitle} controls`}>
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
            <CollectionSkeleton layout={layout} />
          ) : filteredProducts.length > 0 && view === "index" ? (
            <FrameIndex products={filteredProducts} label={`${genderTitle} products`} />
          ) : filteredProducts.length > 0 ? (
            <section className={`collection-plp__grid collection-plp__grid--${layout}`} aria-label={`${genderTitle} products`}>
              {filteredProducts.map((product, index) => (
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
              <p className="fr-word text-[clamp(2.5rem,7vw,5rem)]">{activeCategoryLabel}: soon.</p>
              <p className="max-w-md text-base leading-7 text-[var(--muted)]">
                These pieces are being prepared. Reset to see the whole {genderTitle.toLowerCase()} edit.
              </p>
              {activeControlCount > 0 ? (
                <button type="button" onClick={resetControls} className="fr-button max-w-xs">
                  Reset
                </button>
              ) : (
                <Link href="/shop" className="fr-mono fr-link self-start">
                  See every piece →
                </Link>
              )}
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
                  <p className="text-[var(--muted)]">{genderTitle}</p>
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
                      {getGenderAllLabel(collectionSlug)}
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
    <div className="page-shell bg-[var(--background)]">
      <SiteHeader />
      <main className="collection-plp">
        <header className="collection-plp__intro">
          <div>
            <p>Collection</p>
            <h1>
              {displayCategory}
              {!loading && visibleProducts.length > 0 ? <span>{String(visibleProducts.length).padStart(2, "0")}</span> : null}
            </h1>
            {collectionDescription && (loading || visibleProducts.length > 0) ? <div className="collection-plp__description">{collectionDescription}</div> : null}
          </div>
        </header>

        {loading ? (
          <CollectionSkeleton layout="editorial" />
        ) : visibleProducts.length > 0 ? (
          <div className="pt-4">
            <FrameIndex products={visibleProducts} label={`${displayCategory} products`} />
          </div>
        ) : (
          <div className="flex flex-col gap-12 pb-16">
            <section className="flex flex-col gap-4 px-5 py-10 lg:px-10">
              <p className="fr-word text-[clamp(2.5rem,7vw,5rem)]">{matchedCategory ? "Coming soon." : "Not here yet."}</p>
              <p className="max-w-md text-base leading-7 text-[var(--muted)]">
                The next release for {displayCategory} is being prepared. Meanwhile, the newest pieces:
              </p>
            </section>
            {relatedProducts.length > 0 ? <FrameIndex products={relatedProducts} label="Newest pieces" /> : null}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
