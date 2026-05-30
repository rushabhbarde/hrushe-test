"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useDeferredValue, useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type { Product } from "@/lib/catalog";
import { useStorefrontData } from "@/lib/use-storefront";

type SectionKey =
  | "availability"
  | "category"
  | "colors"
  | "price"
  | "collections"
  | "tags"
  | "ratings";

type CollectionFilter = "all" | "new-in" | "best-sellers" | "featured";
type PriceFilter = "all" | "under-1000" | "1000-1999" | "2000-plus";
type RatingFilter = "all" | "4-up" | "3-up";
type TagFilter = "all" | "oversized" | "graphic" | "essential";

const sizeOrder = ["XS", "S", "M", "L", "XL", "2X", "3X"];
const countAccentClass = "text-[#2539bd]";

const swatchColors: Record<string, string> = {
  black: "#111111",
  white: "#f5f5f5",
  offwhite: "#f1efe8",
  "off white": "#f1efe8",
  coffee: "#6f5847",
  bone: "#ded8cc",
  beige: "#d8cbb6",
  begie: "#d8cbb6",
  cream: "#ede2d2",
  stone: "#c8c7c2",
  brown: "#6b4f3a",
  maroon: "#74263f",
  burgundy: "#6f2137",
  red: "#a63131",
  green: "#3f6a4a",
  forest: "#465742",
  sage: "#9aa28d",
  ink: "#2c3440",
  midnight: "#181a20",
  navy: "#24344d",
  slate: "#7f8794",
  sand: "#d7c6a8",
  olive: "#767863",
  charcoal: "#3c3c3c",
  grey: "#7a7a7a",
  gray: "#7a7a7a",
  ash: "#90949b",
  silver: "#b7bcc3",
};

const defaultExpandedSections: Record<SectionKey, boolean> = {
  availability: true,
  category: false,
  colors: false,
  price: false,
  collections: false,
  tags: false,
  ratings: false,
};

function productCategoryList(product: Product) {
  return product.categories && product.categories.length > 0
    ? product.categories
    : [product.category];
}

function productIndexText(product: Product) {
  return [
    product.name,
    product.description,
    product.category,
    ...productCategoryList(product),
    ...product.colors,
  ]
    .join(" ")
    .toLowerCase();
}

function productMatchesTerms(product: Product, terms: string[]) {
  const haystack = productIndexText(product);
  return terms.some((term) => haystack.includes(term));
}

function getAverageRating(product: Product) {
  if (!product.reviews || product.reviews.length === 0) {
    return 0;
  }

  const total = product.reviews.reduce((sum, review) => sum + review.rating, 0);
  return total / product.reviews.length;
}

function formatCategoryLabel(value: string) {
  return value.toUpperCase();
}

function priceMatchesFilter(price: number, filter: PriceFilter) {
  if (filter === "under-1000") {
    return price < 1000;
  }
  if (filter === "1000-1999") {
    return price >= 1000 && price < 2000;
  }
  if (filter === "2000-plus") {
    return price >= 2000;
  }
  return true;
}

export default function ShopPage() {
  const { products, loading } = useStorefrontData();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sizeFilter, setSizeFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [colorFilter, setColorFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [collectionFilter, setCollectionFilter] = useState<CollectionFilter>("all");
  const [tagFilter, setTagFilter] = useState<TagFilter>("all");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState(defaultExpandedSections);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const newInCount = useMemo(
    () => products.filter((product) => product.newArrival || product.newIn).length,
    [products]
  );

  const sizeOptions = useMemo(() => {
    return Array.from(new Set(products.flatMap((product) => product.sizes)))
      .filter(Boolean)
      .sort((left, right) => {
        const leftIndex = sizeOrder.indexOf(left.toUpperCase());
        const rightIndex = sizeOrder.indexOf(right.toUpperCase());

        if (leftIndex === -1 && rightIndex === -1) {
          return left.localeCompare(right);
        }
        if (leftIndex === -1) {
          return 1;
        }
        if (rightIndex === -1) {
          return -1;
        }

        return leftIndex - rightIndex;
      });
  }, [products]);

  const colorOptions = useMemo(() => {
    return Array.from(new Set(products.flatMap((product) => product.colors)))
      .filter(Boolean)
      .sort((left, right) => left.localeCompare(right))
      .slice(0, 10);
  }, [products]);

  const categoryOptions = useMemo(() => {
    const categoryCounts = new Map<string, number>();

    products.forEach((product) => {
      productCategoryList(product).forEach((category) => {
        categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
      });
    });

    const rankedCategories = Array.from(categoryCounts.entries())
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .map(([category]) => category)
      .slice(0, 8);

    return [
      ...(newInCount > 0 ? [{ label: "NEW", value: "NEW" }] : []),
      ...rankedCategories.map((category) => ({
        label: formatCategoryLabel(category),
        value: category,
      })),
    ];
  }, [newInCount, products]);

  const collectionOptions = useMemo(() => {
    return [
      {
        label: "New In",
        value: "new-in" as const,
        count: products.filter((product) => product.newArrival || product.newIn).length,
      },
      {
        label: "Best Sellers",
        value: "best-sellers" as const,
        count: products.filter((product) => product.bestSeller).length,
      },
      {
        label: "Featured",
        value: "featured" as const,
        count: products.filter((product) => product.featured).length,
      },
    ].filter((option) => option.count > 0);
  }, [products]);

  const tagOptions = useMemo(() => {
    const definitions = [
      {
        label: "Oversized",
        value: "oversized" as const,
        terms: ["oversized", "oversize"],
      },
      {
        label: "Graphic",
        value: "graphic" as const,
        terms: ["graphic", "print"],
      },
      {
        label: "Essential",
        value: "essential" as const,
        terms: ["essential", "basic"],
      },
    ];

    return definitions
      .map((definition) => ({
        ...definition,
        count: products.filter((product) => productMatchesTerms(product, definition.terms)).length,
      }))
      .filter((option) => option.count > 0);
  }, [products]);

  const ratingOptions = useMemo(() => {
    return [
      {
        label: "4★ & up",
        value: "4-up" as const,
        count: products.filter((product) => getAverageRating(product) >= 4).length,
      },
      {
        label: "3★ & up",
        value: "3-up" as const,
        count: products.filter((product) => getAverageRating(product) >= 3).length,
      },
    ].filter((option) => option.count > 0);
  }, [products]);

  const visibleProducts = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();

    const filtered = products.filter((product) => {
      const searchableText = productIndexText(product);
      const averageRating = getAverageRating(product);
      const matchesSearch =
        normalizedQuery.length === 0 || searchableText.includes(normalizedQuery);
      const matchesCategory =
        activeCategory === null
          ? true
          : activeCategory === "NEW"
            ? Boolean(product.newArrival || product.newIn)
            : productCategoryList(product).includes(activeCategory);
      const matchesSize = sizeFilter === "all" || product.sizes.includes(sizeFilter);
      const matchesAvailability =
        availabilityFilter === "all" ||
        availabilityFilter === "available" ||
        (availabilityFilter === "new-in" && Boolean(product.newArrival || product.newIn));
      const matchesColor =
        colorFilter === "all" ||
        product.colors.some((color) => color.toLowerCase() === colorFilter.toLowerCase());
      const matchesPrice = priceMatchesFilter(product.price, priceFilter);
      const matchesCollection =
        collectionFilter === "all" ||
        (collectionFilter === "new-in" && Boolean(product.newArrival || product.newIn)) ||
        (collectionFilter === "best-sellers" && Boolean(product.bestSeller)) ||
        (collectionFilter === "featured" && Boolean(product.featured));
      const matchesTag =
        tagFilter === "all" ||
        (tagFilter === "oversized" && productMatchesTerms(product, ["oversized", "oversize"])) ||
        (tagFilter === "graphic" && productMatchesTerms(product, ["graphic", "print"])) ||
        (tagFilter === "essential" && productMatchesTerms(product, ["essential", "basic"]));
      const matchesRating =
        ratingFilter === "all" ||
        (ratingFilter === "4-up" && averageRating >= 4) ||
        (ratingFilter === "3-up" && averageRating >= 3);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesSize &&
        matchesAvailability &&
        matchesColor &&
        matchesPrice &&
        matchesCollection &&
        matchesTag &&
        matchesRating
      );
    });

    return [...filtered].sort((left, right) => {
      const leftScore =
        Number(Boolean(left.newArrival || left.newIn)) * 4 +
        Number(Boolean(left.bestSeller)) * 3 +
        Number(Boolean(left.featured)) * 2 +
        (left.reviews?.length || 0);
      const rightScore =
        Number(Boolean(right.newArrival || right.newIn)) * 4 +
        Number(Boolean(right.bestSeller)) * 3 +
        Number(Boolean(right.featured)) * 2 +
        (right.reviews?.length || 0);

      if (rightScore !== leftScore) {
        return rightScore - leftScore;
      }

      return left.name.localeCompare(right.name);
    });
  }, [
    activeCategory,
    availabilityFilter,
    collectionFilter,
    colorFilter,
    deferredSearchQuery,
    priceFilter,
    products,
    ratingFilter,
    sizeFilter,
    tagFilter,
  ]);

  const hasFilters =
    activeCategory !== null ||
    sizeFilter !== "all" ||
    availabilityFilter !== "all" ||
    colorFilter !== "all" ||
    priceFilter !== "all" ||
    collectionFilter !== "all" ||
    tagFilter !== "all" ||
    ratingFilter !== "all" ||
    searchQuery.trim().length > 0;

  const activeFilterCount = [
    activeCategory !== null,
    sizeFilter !== "all",
    availabilityFilter !== "all",
    colorFilter !== "all",
    priceFilter !== "all",
    collectionFilter !== "all",
    tagFilter !== "all",
    ratingFilter !== "all",
    searchQuery.trim().length > 0,
  ].filter(Boolean).length;

  function clearFilters() {
    setActiveCategory(null);
    setSizeFilter("all");
    setAvailabilityFilter("all");
    setColorFilter("all");
    setPriceFilter("all");
    setCollectionFilter("all");
    setTagFilter("all");
    setRatingFilter("all");
    setSearchQuery("");
  }

  function toggleSection(section: SectionKey) {
    setExpandedSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  }

  return (
    <div className="page-shell bg-[var(--background)] paper-texture">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-[1600px] px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pb-20">
          <div className="grid gap-8 lg:grid-cols-[272px_minmax(0,1fr)] lg:gap-10 xl:gap-14">
            <aside className="hidden lg:block">
              <div className="sticky top-[134px] space-y-6">
                <div className="border-b border-[rgba(17,17,17,0.08)] pb-5">
                  <h2 className="text-[2rem] font-semibold tracking-[-0.08em] text-[var(--foreground)]">
                    Filters
                  </h2>
                </div>

                <div className="space-y-5">
                  <div className="border-b border-[rgba(17,17,17,0.08)] pb-5">
                    <p className="text-[1.1rem] font-semibold tracking-[0.08em] text-[var(--foreground)]">
                      Size
                    </p>
                    <div className="mt-4 grid grid-cols-6 gap-2">
                      {sizeOptions.map((size) => (
                        <FilterSquare
                          key={size}
                          active={sizeFilter === size}
                          label={size}
                          onClick={() =>
                            setSizeFilter((current) => (current === size ? "all" : size))
                          }
                        />
                      ))}
                    </div>
                  </div>

                  <FilterSection
                    title="Availability"
                    open={expandedSections.availability}
                    onToggle={() => toggleSection("availability")}
                  >
                    <div className="space-y-3">
                      <FilterToggleRow
                        checked={availabilityFilter === "available"}
                        label="Available"
                        meta={`${products.length}`}
                        onClick={() =>
                          setAvailabilityFilter((current) =>
                            current === "available" ? "all" : "available"
                          )
                        }
                      />
                      <FilterToggleRow
                        checked={availabilityFilter === "new-in"}
                        label="New In"
                        meta={`${newInCount}`}
                        onClick={() =>
                          setAvailabilityFilter((current) =>
                            current === "new-in" ? "all" : "new-in"
                          )
                        }
                      />
                    </div>
                  </FilterSection>

                  <FilterSection
                    title="Category"
                    open={expandedSections.category}
                    onToggle={() => toggleSection("category")}
                  >
                    <div className="flex flex-wrap gap-2">
                      {categoryOptions.map((category) => (
                        <FilterPill
                          key={category.value}
                          active={activeCategory === category.value}
                          label={category.label}
                          onClick={() =>
                            setActiveCategory((current) =>
                              current === category.value ? null : category.value
                            )
                          }
                        />
                      ))}
                    </div>
                  </FilterSection>

                  <FilterSection
                    title="Colors"
                    open={expandedSections.colors}
                    onToggle={() => toggleSection("colors")}
                  >
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() =>
                            setColorFilter((current) => (current === color ? "all" : color))
                          }
                          className={`inline-flex min-h-10 items-center gap-2 border px-3 text-[0.74rem] uppercase tracking-[0.12em] transition ${
                            colorFilter === color
                              ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                              : "border-[rgba(17,17,17,0.16)] bg-[rgba(255,255,255,0.85)] text-[var(--foreground)]"
                          }`}
                        >
                          <span
                            className="h-2.5 w-2.5 border border-[rgba(17,17,17,0.12)]"
                            style={{ backgroundColor: swatchColors[color.toLowerCase()] || "#d9d9d9" }}
                          />
                          {color}
                        </button>
                      ))}
                    </div>
                  </FilterSection>

                  <FilterSection
                    title="Price Range"
                    open={expandedSections.price}
                    onToggle={() => toggleSection("price")}
                  >
                    <div className="space-y-2">
                      {[
                        { label: "Under Rs.1,000", value: "under-1000" as const },
                        { label: "Rs.1,000 - 1,999", value: "1000-1999" as const },
                        { label: "Rs.2,000+", value: "2000-plus" as const },
                      ].map((option) => (
                        <FilterPill
                          key={option.value}
                          active={priceFilter === option.value}
                          label={option.label}
                          onClick={() =>
                            setPriceFilter((current) =>
                              current === option.value ? "all" : option.value
                            )
                          }
                          fullWidth
                        />
                      ))}
                    </div>
                  </FilterSection>

                  <FilterSection
                    title="Collections"
                    open={expandedSections.collections}
                    onToggle={() => toggleSection("collections")}
                  >
                    {collectionOptions.length > 0 ? (
                      <div className="space-y-2">
                        {collectionOptions.map((option) => (
                          <FilterPill
                            key={option.value}
                            active={collectionFilter === option.value}
                            label={`${option.label} (${option.count})`}
                            onClick={() =>
                              setCollectionFilter((current) =>
                                current === option.value ? "all" : option.value
                              )
                            }
                            fullWidth
                          />
                        ))}
                      </div>
                    ) : (
                      <FilterHint>No collection filters are live yet.</FilterHint>
                    )}
                  </FilterSection>

                  <FilterSection
                    title="Tags"
                    open={expandedSections.tags}
                    onToggle={() => toggleSection("tags")}
                  >
                    {tagOptions.length > 0 ? (
                      <div className="space-y-2">
                        {tagOptions.map((option) => (
                          <FilterPill
                            key={option.value}
                            active={tagFilter === option.value}
                            label={`${option.label} (${option.count})`}
                            onClick={() =>
                              setTagFilter((current) =>
                                current === option.value ? "all" : option.value
                              )
                            }
                            fullWidth
                          />
                        ))}
                      </div>
                    ) : (
                      <FilterHint>No tag metadata is available yet.</FilterHint>
                    )}
                  </FilterSection>

                  <FilterSection
                    title="Ratings"
                    open={expandedSections.ratings}
                    onToggle={() => toggleSection("ratings")}
                  >
                    {ratingOptions.length > 0 ? (
                      <div className="space-y-2">
                        {ratingOptions.map((option) => (
                          <FilterPill
                            key={option.value}
                            active={ratingFilter === option.value}
                            label={`${option.label} (${option.count})`}
                            onClick={() =>
                              setRatingFilter((current) =>
                                current === option.value ? "all" : option.value
                              )
                            }
                            fullWidth
                          />
                        ))}
                      </div>
                    ) : (
                      <FilterHint>Ratings will appear as reviews accumulate.</FilterHint>
                    )}
                  </FilterSection>
                </div>
              </div>
            </aside>

            <div className="min-w-0">
              <p className="text-[0.92rem] text-[var(--muted)]">
                <Link href="/" className="hover:text-[var(--foreground)]">
                  Home
                </Link>{" "}
                / <span className="font-medium text-[var(--foreground)]">Products</span>
              </p>
              <h1 className="mt-2 text-[2.1rem] font-semibold uppercase leading-none tracking-[-0.08em] text-[var(--foreground)] sm:text-[3rem]">
                Products
              </h1>

              <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,23rem)_minmax(0,1fr)] xl:items-start">
                <label className="flex min-h-[3.3rem] items-center gap-3 border border-[rgba(17,17,17,0.08)] bg-[rgba(17,17,17,0.06)] px-4">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-[var(--foreground)]" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <circle cx="11" cy="11" r="6" />
                    <path d="M20 20l-4.2-4.2" />
                  </svg>
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search"
                    className="w-full bg-transparent text-[0.96rem] tracking-[0.22em] text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
                  />
                </label>

                <div className="space-y-4">
                  <div className="relative lg:hidden">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setMobileFiltersOpen((current) => !current)}
                        className="inline-flex min-h-11 items-center gap-3 text-[1.7rem] font-semibold tracking-[-0.06em] text-[var(--foreground)]"
                        aria-expanded={mobileFiltersOpen}
                      >
                        <span className="text-[1.75rem] leading-none">Filters</span>
                        {activeFilterCount > 0 ? (
                          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--foreground)] px-1.5 text-[0.72rem] font-medium tracking-normal text-[var(--background)]">
                            {activeFilterCount}
                          </span>
                        ) : null}
                        <span
                          className={`text-[1.25rem] transition ${mobileFiltersOpen ? "-rotate-90" : "rotate-90"}`}
                          aria-hidden="true"
                        >
                          ›
                        </span>
                      </button>

                      {hasFilters ? (
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="text-[0.74rem] uppercase tracking-[0.16em] text-[var(--accent)]"
                        >
                          Clear
                        </button>
                      ) : null}
                    </div>

                    {mobileFiltersOpen ? (
                      <div className="absolute left-0 top-full z-20 mt-4 w-[min(78vw,320px)] max-w-[calc(100vw-2rem)] border border-[rgba(17,17,17,0.08)] bg-[var(--background)] p-5 shadow-[0_24px_60px_rgba(17,17,17,0.12)]">
                        <div className="flex items-center justify-between border-b border-[rgba(17,17,17,0.08)] pb-4">
                          <h2 className="text-[1.9rem] font-semibold tracking-[-0.08em] text-[var(--foreground)]">
                            Filters
                          </h2>
                          <button
                            type="button"
                            onClick={() => setMobileFiltersOpen(false)}
                            className="text-[1.4rem] text-[var(--foreground)]"
                            aria-label="Close filters"
                          >
                            ‹
                          </button>
                        </div>

                        <div className="mt-5 max-h-[65vh] space-y-5 overflow-y-auto pr-1">
                          <div className="border-b border-[rgba(17,17,17,0.08)] pb-5">
                            <p className="text-[1.05rem] font-semibold tracking-[0.08em] text-[var(--foreground)]">
                              Size
                            </p>
                            <div className="mt-4 grid grid-cols-6 gap-1.5">
                              {sizeOptions.map((size) => (
                                <FilterSquare
                                  key={size}
                                  active={sizeFilter === size}
                                  label={size}
                                  onClick={() =>
                                    setSizeFilter((current) => (current === size ? "all" : size))
                                  }
                                />
                              ))}
                            </div>
                          </div>

                          <FilterSection
                            title="Availability"
                            open={expandedSections.availability}
                            onToggle={() => toggleSection("availability")}
                          >
                            <div className="space-y-3">
                              <FilterToggleRow
                                checked={availabilityFilter === "available"}
                                label="Available"
                                meta={`${products.length}`}
                                onClick={() =>
                                  setAvailabilityFilter((current) =>
                                    current === "available" ? "all" : "available"
                                  )
                                }
                              />
                              <FilterToggleRow
                                checked={availabilityFilter === "new-in"}
                                label="New In"
                                meta={`${newInCount}`}
                                onClick={() =>
                                  setAvailabilityFilter((current) =>
                                    current === "new-in" ? "all" : "new-in"
                                  )
                                }
                              />
                            </div>
                          </FilterSection>

                          <FilterSection
                            title="Category"
                            open={expandedSections.category}
                            onToggle={() => toggleSection("category")}
                          >
                            <div className="flex flex-wrap gap-2">
                              {categoryOptions.map((category) => (
                                <FilterPill
                                  key={category.value}
                                  active={activeCategory === category.value}
                                  label={category.label}
                                  onClick={() =>
                                    setActiveCategory((current) =>
                                      current === category.value ? null : category.value
                                    )
                                  }
                                />
                              ))}
                            </div>
                          </FilterSection>

                          <FilterSection
                            title="Colors"
                            open={expandedSections.colors}
                            onToggle={() => toggleSection("colors")}
                          >
                            <div className="flex flex-wrap gap-2">
                              {colorOptions.map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() =>
                                    setColorFilter((current) =>
                                      current === color ? "all" : color
                                    )
                                  }
                                  className={`inline-flex min-h-10 items-center gap-2 border px-3 text-[0.74rem] uppercase tracking-[0.12em] transition ${
                                    colorFilter === color
                                      ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                                      : "border-[rgba(17,17,17,0.16)] bg-[rgba(255,255,255,0.85)] text-[var(--foreground)]"
                                  }`}
                                >
                                  <span
                                    className="h-2.5 w-2.5 border border-[rgba(17,17,17,0.12)]"
                                    style={{
                                      backgroundColor:
                                        swatchColors[color.toLowerCase()] || "#d9d9d9",
                                    }}
                                  />
                                  {color}
                                </button>
                              ))}
                            </div>
                          </FilterSection>

                          <FilterSection
                            title="Price Range"
                            open={expandedSections.price}
                            onToggle={() => toggleSection("price")}
                          >
                            <div className="space-y-2">
                              {[
                                { label: "Under Rs.1,000", value: "under-1000" as const },
                                { label: "Rs.1,000 - 1,999", value: "1000-1999" as const },
                                { label: "Rs.2,000+", value: "2000-plus" as const },
                              ].map((option) => (
                                <FilterPill
                                  key={option.value}
                                  active={priceFilter === option.value}
                                  label={option.label}
                                  onClick={() =>
                                    setPriceFilter((current) =>
                                      current === option.value ? "all" : option.value
                                    )
                                  }
                                  fullWidth
                                />
                              ))}
                            </div>
                          </FilterSection>

                          <FilterSection
                            title="Collections"
                            open={expandedSections.collections}
                            onToggle={() => toggleSection("collections")}
                          >
                            {collectionOptions.length > 0 ? (
                              <div className="space-y-2">
                                {collectionOptions.map((option) => (
                                  <FilterPill
                                    key={option.value}
                                    active={collectionFilter === option.value}
                                    label={`${option.label} (${option.count})`}
                                    onClick={() =>
                                      setCollectionFilter((current) =>
                                        current === option.value ? "all" : option.value
                                      )
                                    }
                                    fullWidth
                                  />
                                ))}
                              </div>
                            ) : (
                              <FilterHint>No collection filters are live yet.</FilterHint>
                            )}
                          </FilterSection>

                          <FilterSection
                            title="Tags"
                            open={expandedSections.tags}
                            onToggle={() => toggleSection("tags")}
                          >
                            {tagOptions.length > 0 ? (
                              <div className="space-y-2">
                                {tagOptions.map((option) => (
                                  <FilterPill
                                    key={option.value}
                                    active={tagFilter === option.value}
                                    label={`${option.label} (${option.count})`}
                                    onClick={() =>
                                      setTagFilter((current) =>
                                        current === option.value ? "all" : option.value
                                      )
                                    }
                                    fullWidth
                                  />
                                ))}
                              </div>
                            ) : (
                              <FilterHint>No tag metadata is available yet.</FilterHint>
                            )}
                          </FilterSection>

                          <FilterSection
                            title="Ratings"
                            open={expandedSections.ratings}
                            onToggle={() => toggleSection("ratings")}
                          >
                            {ratingOptions.length > 0 ? (
                              <div className="space-y-2">
                                {ratingOptions.map((option) => (
                                  <FilterPill
                                    key={option.value}
                                    active={ratingFilter === option.value}
                                    label={`${option.label} (${option.count})`}
                                    onClick={() =>
                                      setRatingFilter((current) =>
                                        current === option.value ? "all" : option.value
                                      )
                                    }
                                    fullWidth
                                  />
                                ))}
                              </div>
                            ) : (
                              <FilterHint>Ratings will appear as reviews accumulate.</FilterHint>
                            )}
                          </FilterSection>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:flex xl:flex-wrap">
                    {categoryOptions.map((category) => (
                      <button
                        key={category.value}
                        type="button"
                        onClick={() =>
                          setActiveCategory((current) =>
                            current === category.value ? null : category.value
                          )
                        }
                        className={`min-h-10 border px-3 text-[0.72rem] uppercase tracking-[0.14em] transition ${
                          activeCategory === category.value
                            ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                            : "border-[rgba(17,17,17,0.16)] bg-[rgba(255,255,255,0.85)] text-[var(--foreground)]"
                        }`}
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-b border-[rgba(17,17,17,0.08)] pb-4 text-[0.76rem] uppercase tracking-[0.16em] text-[var(--muted)]">
                <span>{visibleProducts.length} products</span>
                {hasFilters ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-[var(--accent)]"
                  >
                    Clear filters
                  </button>
                ) : (
                  <span>Curated by everyday fits</span>
                )}
              </div>

              <div className="mt-8">
                {loading ? (
                  <ShopGridSkeleton count={6} />
                ) : visibleProducts.length === 0 ? (
                  <EmptyState
                    title="No products found."
                    description="Try clearing filters or searching with fewer words."
                    ctaHref="/shop"
                    ctaLabel="View all products"
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 sm:gap-y-10 xl:grid-cols-3 xl:gap-x-10 xl:gap-y-12">
                    {visibleProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
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

function FilterSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-[rgba(17,17,17,0.08)] pb-5">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 text-left"
        aria-expanded={open}
      >
        <span className="text-[1.1rem] font-semibold tracking-[0.08em] text-[var(--foreground)]">
          {title}
        </span>
        <span
          className={`text-[1.2rem] text-[var(--foreground)] transition ${
            open ? "-rotate-90" : "rotate-90"
          }`}
          aria-hidden="true"
        >
          ›
        </span>
      </button>
      {open ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

function FilterSquare({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-10 items-center justify-center border text-[0.74rem] uppercase tracking-[0.12em] transition ${
        active
          ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
          : "border-[rgba(17,17,17,0.16)] bg-[rgba(255,255,255,0.85)] text-[var(--foreground)]"
      }`}
    >
      {label}
    </button>
  );
}

function FilterToggleRow({
  checked,
  label,
  meta,
  onClick,
}: {
  checked: boolean;
  label: string;
  meta: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 text-left">
      <span
        className={`flex h-6 w-6 items-center justify-center border transition ${
          checked
            ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
            : "border-[rgba(17,17,17,0.16)] bg-[rgba(255,255,255,0.88)] text-transparent"
        }`}
        aria-hidden="true"
      >
        ✓
      </span>
      <span className="flex items-center gap-2 text-[0.98rem] text-[var(--foreground)]">
        <span>{label}</span>
        <span className={`font-medium ${countAccentClass}`}>({meta})</span>
      </span>
    </button>
  );
}

function FilterPill({
  label,
  active,
  onClick,
  fullWidth = false,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  fullWidth?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border px-3 py-2 text-[0.74rem] uppercase tracking-[0.12em] transition ${
        fullWidth ? "w-full text-left" : ""
      } ${
        active
          ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
          : "border-[rgba(17,17,17,0.16)] bg-[rgba(255,255,255,0.85)] text-[var(--foreground)]"
      }`}
    >
      {label}
    </button>
  );
}

function FilterHint({ children }: { children: ReactNode }) {
  return <p className="text-sm leading-6 text-[var(--muted)]">{children}</p>;
}

function ShopGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 sm:gap-y-10 xl:grid-cols-3 xl:gap-x-10 xl:gap-y-12">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="loading-pulse">
          <div className="aspect-[18/25] bg-[var(--surface-strong)]" />
          <div className="mt-2 h-5 w-4/5 bg-[var(--surface-strong)]" />
          <div className="mt-2 h-4 w-28 bg-[var(--surface-strong)]" />
          <div className="mt-2 h-3 w-16 bg-[var(--surface-strong)]" />
        </div>
      ))}
    </div>
  );
}
