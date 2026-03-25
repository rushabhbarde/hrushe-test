"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useStorefrontData } from "@/lib/use-storefront";

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const { products } = useStorefrontData();

  const results = useMemo(() => {
    const normalized = initialQuery.trim().toLowerCase();

    if (!normalized) {
      return [];
    }

    return products.filter((product) => {
      const fields = [
        product.name,
        product.category,
        product.description,
        product.colors.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return fields.includes(normalized);
    });
  }, [initialQuery, products]);

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
            router.push(`/search?q=${encodeURIComponent(query.trim())}`);
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

        <section className="mt-10">
          {!initialQuery ? (
            <EmptyState
              title="Start with a search term."
              description="Try a product name, category, or color to narrow down the catalog."
            />
          ) : results.length === 0 ? (
            <EmptyState
              title="No matching products found."
              description="Try a broader search term or browse the full shop instead."
              ctaHref="/shop"
              ctaLabel="Browse all products"
            />
          ) : (
            <>
              <p className="text-sm uppercase tracking-[0.18em] text-[var(--accent)]">
                {results.length} results for &ldquo;{initialQuery}&rdquo;
              </p>
              <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {results.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
