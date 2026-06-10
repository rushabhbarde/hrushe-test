"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { ProductListingGrid, ProductListingSkeleton } from "@/components/product-listing-grid";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useStorefrontData } from "@/lib/use-storefront";

const RECENT_SEARCHES_KEY = "hrushe_recent_searches";

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const { products, loading } = useStorefrontData();
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const stored = window.localStorage.getItem(RECENT_SEARCHES_KEY);
      return stored ? JSON.parse(stored).slice(0, 5) : [];
    } catch {
      return [];
    }
  });

  function rememberSearch(value: string) {
    const normalized = value.trim();

    if (!normalized) {
      return;
    }

    const next = [normalized, ...recentSearches.filter((item) => item !== normalized)].slice(0, 5);
    setRecentSearches(next);

    try {
      window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    } catch {
      // Search history is a convenience only.
    }
  }

  const results = useMemo(() => {
    const normalized = initialQuery.trim().toLowerCase();

    if (!normalized) {
      return [];
    }

    return products.filter((product) => {
      const fields = [
        product.name,
        product.category,
        product.categories?.join(" ") || "",
        product.description,
        product.colors.join(" "),
        product.fabric || "",
        product.gsm || "",
        product.cottonType || "",
        product.feel || "",
        product.weight || "",
        product.washCare || "",
      ]
        .join(" ")
        .toLowerCase();

      return fields.includes(normalized);
    });
  }, [initialQuery, products]);

  const suggestedProducts = useMemo(() => {
    if (!initialQuery) {
      return products.slice(0, 4);
    }

    const queryTerms = initialQuery
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    return products
      .filter((product) =>
        queryTerms.some((term) =>
          [product.category, ...(product.categories || []), ...product.colors]
            .concat([
              product.fabric || "",
              product.gsm || "",
              product.cottonType || "",
              product.feel || "",
              product.weight || "",
            ])
            .join(" ")
            .toLowerCase()
            .includes(term)
        )
      )
      .slice(0, 4);
  }, [initialQuery, products]);

  const submitSearch = (value: string) => {
    const normalized = value.trim();
    rememberSearch(normalized);
    router.push(normalized ? `/search?q=${encodeURIComponent(normalized)}` : "/search");
  };

  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="mx-auto max-w-[1600px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="eyebrow text-[var(--accent)]">Search page</p>
          <h1 className="display-font mt-3 text-5xl">Find the right piece faster.</h1>
          <p className="mt-4 text-[var(--muted)]">
            Search by product name, category, fabric mood, or color.
          </p>
        </div>

        <form
          className="mt-8 flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            submitSearch(query);
          }}
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-w-0 flex-1 rounded-full border border-[var(--border)] bg-white px-5 py-3"
            placeholder="Search for oversized tee, black, shirt..."
          />
          <button
            type="submit"
            className="button-primary rounded-full px-6 py-3 text-sm tracking-[0.08em] transition"
          >
            Search
          </button>
        </form>

        {!initialQuery && recentSearches.length > 0 ? (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--muted)]">
              Recent
            </span>
            {recentSearches.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setQuery(item);
                  submitSearch(item);
                }}
                className="border border-[var(--border)] bg-white/70 px-3 py-2 text-xs uppercase tracking-[0.12em] text-[var(--foreground)]"
              >
                {item}
              </button>
            ))}
          </div>
        ) : null}

        <section className="mt-10">
          {loading && initialQuery ? (
            <ProductListingSkeleton count={8} />
          ) : !initialQuery ? (
            <EmptyState
              title="Start with a search term."
              description="Try a product name, category, or color to narrow down the catalog."
            />
          ) : results.length === 0 ? (
            <>
              <EmptyState
                title="No matching products found."
                description="Try a broader term, remove color words, or browse the full collection."
                ctaHref="/shop"
                ctaLabel="Explore collection"
              />
              {suggestedProducts.length > 0 ? (
                <div className="mt-10">
                  <p className="text-sm uppercase tracking-[0.18em] text-[var(--accent)]">
                    Suggested pieces
                  </p>
                  <div className="mt-6">
                    <ProductListingGrid products={suggestedProducts} />
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <p className="text-sm uppercase tracking-[0.18em] text-[var(--accent)]">
                {results.length} results for &ldquo;{initialQuery}&rdquo;
              </p>
              <div className="mt-6">
                <ProductListingGrid products={results} />
              </div>
            </>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
