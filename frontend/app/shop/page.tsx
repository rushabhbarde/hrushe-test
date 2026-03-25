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
    const categories = Array.from(new Set(products.map((product) => product.category)));
    return ["ALL", "NEW ARRIVALS", ...categories];
  }, [products]);
  const visibleProducts = useMemo(() => {
    if (activeTab === "ALL") {
      return products;
    }

    if (activeTab === "NEW ARRIVALS") {
      return products.filter((product) => product.newArrival);
    }

    return products.filter((product) => product.category === activeTab);
  }, [activeTab, products]);

  return (
    <div className="page-shell">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-semibold uppercase tracking-tight sm:text-5xl lg:text-7xl">
            T-Shirts
          </h1>

          <div className="mt-6 flex flex-wrap gap-2 sm:mt-10 sm:gap-3">
            {categoryTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`border px-3 py-2 text-sm uppercase tracking-[0.04em] transition sm:px-4 sm:text-base ${
                  activeTab === tab
                    ? "border-black bg-black text-white"
                    : "border-black text-black hover:bg-black/5"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between border-b border-[var(--border)] pb-4 sm:mt-8 sm:pb-6">
            <button type="button" className="flex items-center gap-2 text-lg uppercase tracking-tight sm:gap-3 sm:text-2xl">
              <span className="text-sm sm:text-base">Sort by</span>
              <span className="text-3xl leading-none sm:text-4xl">+</span>
            </button>
            <button type="button" className="flex items-center gap-2 text-sm uppercase tracking-[0.12em] sm:gap-3 sm:text-base">
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
            <div className="grid gap-x-3 gap-y-6 sm:gap-y-8 md:grid-cols-2 xl:grid-cols-4">
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
