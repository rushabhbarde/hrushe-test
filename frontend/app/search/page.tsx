"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FrameIndex } from "@/components/frame-index";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { LoadingState } from "@/components/loading-state";
import { useStorefrontData } from "@/lib/use-storefront";

const RECENT_SEARCHES_KEY = "hrushe_recent_searches";

function SearchPageContent() {
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

  const liveQuery = query.trim();

  const results = useMemo(() => {
    const normalized = liveQuery.toLowerCase();

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
  }, [liveQuery, products]);

  const suggestedProducts = useMemo(() => {
    if (!liveQuery) {
      return products.slice(0, 4);
    }

    const queryTerms = liveQuery
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
  }, [liveQuery, products]);

  const submitSearch = (value: string) => {
    const normalized = value.trim();
    rememberSearch(normalized);
    router.push(normalized ? `/search?q=${encodeURIComponent(normalized)}` : "/search");
  };

  const shown = liveQuery ? results : products;

  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="pb-16 pt-6 lg:pb-24 lg:pt-12">
        <form
          role="search"
          className="flex flex-col gap-3 px-5 lg:px-10"
          onSubmit={(event) => {
            event.preventDefault();
            submitSearch(query);
          }}
        >
          <label className="fr-mono fr-muted" htmlFor="storefront-search">
            Search the edit
          </label>
          <input
            id="storefront-search"
            name="q"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onBlur={() => rememberSearch(query)}
            className="fr-word fr-search w-full border-0 border-b border-[color-mix(in_srgb,var(--foreground)_18%,transparent)] bg-transparent pb-3 text-[clamp(3rem,13vw,10rem)]! outline-none! placeholder:text-[#d6d2cb] focus:border-[var(--foreground)]"
            placeholder="Type"
            autoComplete="off"
            autoFocus
          />
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <span className="fr-mono fr-muted" aria-live="polite">
              {loading
                ? "Loading the edit"
                : liveQuery
                  ? `${results.length} ${results.length === 1 ? "piece" : "pieces"} · “${liveQuery}”`
                  : "Product, fabric, fit or colour"}
            </span>
            {liveQuery ? (
              <button type="button" onClick={() => setQuery("")} className="fr-mono fr-choice fr-link is-active">
                Clear
              </button>
            ) : null}
            {!liveQuery && recentSearches.length > 0 ? (
              <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="fr-mono fr-muted">Recent</span>
                {recentSearches.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setQuery(item);
                      submitSearch(item);
                    }}
                    className="fr-mono fr-choice fr-link is-active"
                  >
                    {item}
                  </button>
                ))}
              </span>
            ) : null}
          </div>
        </form>

        <section className="mt-10 lg:mt-14">
          {loading && products.length === 0 ? (
            <LoadingState title="Loading the edit" description="" />
          ) : shown.length > 0 ? (
            <FrameIndex key={liveQuery} products={shown} label={liveQuery ? "Results" : "The edit"} />
          ) : (
            <div className="flex flex-col gap-10 px-5 lg:px-10">
              <div className="flex flex-col gap-4">
                <p className="fr-word text-[clamp(2.5rem,7vw,5rem)]">Nothing by that name.</p>
                <p className="max-w-md text-base leading-7 text-[var(--muted)]">
                  Try a broader word, drop the colour, or look through the whole edit.
                </p>
              </div>
              {suggestedProducts.length > 0 ? (
                <div className="flex flex-col gap-4">
                  <span className="fr-mono fr-muted">You might mean</span>
                  <div className="-mx-5 lg:-mx-10">
                    <FrameIndex products={suggestedProducts} label="Suggested" />
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={(
      <div className="page-shell">
        <SiteHeader />
        <main className="px-5 py-12 lg:px-10">
          <LoadingState title="Preparing search" description="" />
        </main>
        <SiteFooter />
      </div>
    )}>
      <SearchPageContent />
    </Suspense>
  );
}
