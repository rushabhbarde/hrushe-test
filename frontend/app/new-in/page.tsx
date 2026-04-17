"use client";

import { EmptyState } from "@/components/empty-state";
import { LoadingState } from "@/components/loading-state";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useStorefrontData } from "@/lib/use-storefront";

export default function NewInPage() {
  const { products, loading } = useStorefrontData();
  const newInProducts = products.filter(
    (product) => product.newIn || product.newArrival
  );

  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="mx-auto max-w-[1600px] px-4 py-10 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="New in"
          eyebrowClassName="text-[var(--accent)]"
          title="Fresh pieces from the latest drop."
          description="The newest styles added to the collection, gathered into one clean edit."
        />

        <section className="mt-10">
          {loading ? (
            <LoadingState
              title="Loading new in"
              description="We are pulling the latest pieces into the edit."
            />
          ) : newInProducts.length === 0 ? (
            <EmptyState
              title="No new-in products yet."
              description="Mark products as New In or New Arrival from the admin panel and they will appear here."
              ctaHref="/shop"
              ctaLabel="Browse the shop"
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {newInProducts.map((product) => (
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
