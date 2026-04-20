"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { LoadingState } from "@/components/loading-state";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useStorefrontData } from "@/lib/use-storefront";

export default function ShopPage() {
  const { products, loading } = useStorefrontData();
  const [activeTab, setActiveTab] = useState("ALL");
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
  const visibleProducts = useMemo(() => {
    if (activeTab === "ALL") {
      return products;
    }

    if (activeTab === "NEW ARRIVALS") {
      return products.filter((product) => product.newArrival || product.newIn);
    }

    return products.filter((product) =>
      (product.categories && product.categories.length > 0
        ? product.categories
        : [product.category]
      ).includes(activeTab)
    );
  }, [activeTab, products]);

  return (
    <div className="page-shell">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <h1 className="text-3xl font-semibold uppercase tracking-tight sm:text-4xl lg:text-6xl xl:text-7xl">
            T-Shirts
          </h1>

          <div className="mt-6 flex gap-2 overflow-x-auto pb-1 sm:mt-10 sm:flex-wrap sm:overflow-visible sm:pb-0 sm:gap-3">
            {categoryTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 border px-3 py-2.5 text-xs uppercase tracking-[0.08em] transition sm:px-4 sm:text-sm lg:text-base ${
                  activeTab === tab
                    ? "border-black bg-black text-white"
                    : "border-black text-black hover:bg-black/5"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between gap-4 border-b border-[var(--border)] pb-4 sm:mt-8 sm:pb-6">
            <button type="button" className="flex items-center gap-2 text-base uppercase tracking-tight sm:gap-3 sm:text-xl">
              <span className="text-xs sm:text-sm">Sort by</span>
              <span className="text-2xl leading-none sm:text-3xl">+</span>
            </button>
            <button type="button" className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] sm:gap-3 sm:text-sm">
              <span>Filter</span>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16" />
                <path d="M7 12h10" />
                <path d="M10 17h4" />
              </svg>
            </button>
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 pb-14 sm:px-6 lg:px-8">
          {loading ? (
            <LoadingState
              title="Loading the collection"
              description="We are preparing the latest product grid for you."
            />
          ) : visibleProducts.length === 0 ? (
            <EmptyState
              title="No styles in this edit yet."
              description="Try another collection tab or come back after the next product drop."
              ctaHref="/shop"
              ctaLabel="View all products"
            />
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-4 sm:gap-y-8 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
